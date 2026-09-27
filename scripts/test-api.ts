/**
 * End-to-end API checks against a running dev server (`npm run dev`) and the Neon *dev* branch.
 *   npm run test:api            (server on http://localhost:3000)
 *
 * Creates its own records (emails and names starting with "zz") and removes them at the end.
 * Sessions are signed with the local SESSION_SECRET, so Google sign-in itself is not exercised here.
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, like, or } from 'drizzle-orm';
import { SignJWT } from 'jose';
import * as s from '../lib/db/schema';

config({ path: '.env.development.local' });
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const db = drizzle(neon(process.env.DATABASE_URL!), { schema: s, casing: 'snake_case' });

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, info = '') => {
    results.push([name, ok, info]);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? `  (${info})` : ''}`);
};

async function cookieFor(user: { id: string; role: string; email: string; firstName: string; lastName: string }) {
    const token = await new SignJWT({ role: user.role, email: user.email, fn: user.firstName, ln: user.lastName })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(process.env.SESSION_SECRET!));
    return `token=${token}`;
}

async function call(method: string, path: string, body?: unknown, cookie?: string) {
    const res = await fetch(BASE + '/api' + path, {
        method,
        redirect: 'manual',
        headers: { 'Content-Type': 'application/json', Origin: BASE, ...(cookie && { Cookie: cookie }) },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: any;
    try {
        json = JSON.parse(text);
    } catch {
        json = text;
    }
    return { status: res.status, json, location: res.headers.get('location') };
}

async function cleanup() {
    await db.delete(s.users).where(or(like(s.users.email, 'zz%'), like(s.users.email, 'zz.%')));
    await db.delete(s.loginAttempts).where(like(s.loginAttempts.key, '%zz%'));
    await db.delete(s.studentAllowlist).where(like(s.studentAllowlist.email, 'zz%'));
}

(async () => {
    await cleanup();
    const [admin] = await db.select().from(s.users).where(eq(s.users.role, 'superadmin')).limit(1);
    const [resp] = await db.select().from(s.users).where(eq(s.users.email, 'responsable.gi1@etu.uae.ac.ma'));
    const [student] = await db
        .insert(s.users)
        .values({ email: 'zz.student@etu.uae.ac.ma', role: 'student', firstName: 'Zz', lastName: 'Student' })
        .returning();
    const [student2] = await db
        .insert(s.users)
        .values({ email: 'zz.other@etu.uae.ac.ma', role: 'student', firstName: 'Zz', lastName: 'Other' })
        .returning();
    const A = await cookieFor(admin);
    const R = await cookieFor(resp);
    const S = await cookieFor(student);
    const S2 = await cookieFor(student2);

    // ---------------- Auth ----------------
    let r = await call('GET', '/auth/me');
    check('me without session -> user null', r.status === 200 && r.json.user === null);
    r = await call('GET', '/auth/me', undefined, S);
    check('me as student (no DB lookup) -> student', r.json.user?.role === 'student' && r.json.user.email === student.email);
    r = await call('GET', '/auth/me', undefined, R);
    check('me as responsable -> assignment', r.json.user?.assignedYear === 'GI1' && r.json.user.assignedFiliere === 'Génie Informatique', JSON.stringify(r.json.user?.assignedYear));
    r = await call('POST', '/auth/login', { email: { $ne: null }, password: { $ne: null } });
    check('login with objects -> 400', r.status === 400);
    for (let i = 0; i < 5; i++) r = await call('POST', '/auth/login', { email: 'zz-nobody@test.local', password: 'wrong' + i });
    check('wrong passwords -> 401', r.status === 401, r.json.message);
    r = await call('POST', '/auth/login', { email: 'zz-nobody@test.local', password: 'x' });
    check('6th attempt -> 429', r.status === 429, r.json.message);
    r = await call('POST', '/auth/login', { email: student.email, password: 'anything12' });
    check('password login refused for a student', r.status === 401);
    r = await call('POST', '/auth/google', { credential: 'abc.def.ghi' });
    check('garbage Google token refused', r.status === 401 || r.status === 503, `${r.status}`);
    r = await call('GET', '/auth/me', undefined, 'token=forged.jwt.value');
    check('forged session ignored', r.json.user === null);

    // ---------------- Access rules ----------------
    check('files need a session', (await call('GET', '/files')).status === 401);
    check('student cannot start an upload', (await call('POST', '/files/upload-session', {}, S)).status === 403);
    check('student cannot list users', (await call('GET', '/users', undefined, S)).status === 403);
    check('responsable cannot list users', (await call('GET', '/users', undefined, R)).status === 403);
    check('cron refuses without secret', (await call('GET', '/cron/daily')).status === 401);

    // ---------------- Files ----------------
    r = await call('GET', '/files?year=GI1&limit=5', undefined, S);
    const [{ gi1 }] = await db
        .select({ gi1: s.files.id })
        .from(s.files)
        .innerJoin(s.modules, eq(s.modules.id, s.files.moduleId))
        .innerJoin(s.semesters, eq(s.semesters.id, s.modules.semesterId))
        .innerJoin(s.years, eq(s.years.id, s.semesters.yearId))
        .where(eq(s.years.code, 'GI1'))
        .limit(1);
    check('file list filtered by year', r.status === 200 && r.json.files.every((f: any) => f.year === 'GI1') && r.json.total > 0, `total=${r.json.total}`);
    const f0 = r.json.files[0];
    check('file shape kept (_id, displayName, uploadedBy)', !!f0?._id && !!f0.displayName && 'uploadedBy' in f0 && !!f0.fileCategory);
    r = await call('GET', `/files/${gi1}`, undefined, S);
    check('file detail', r.status === 200 && r.json.file._id === gi1);
    r = await call('GET', `/files/${gi1}/download`, undefined, S);
    check('download redirects to Drive', r.status >= 300 && r.status < 400 && /google\.com/.test(r.location ?? ''), `${r.status}`);
    check('unknown file -> 404', (await call('GET', '/files/00000000-0000-0000-0000-000000000000', undefined, S)).status === 404);
    r = await call('GET', '/files?scope=mine&limit=100', undefined, R);
    check('responsable scope=mine -> own year only', r.status === 200 && r.json.files.every((f: any) => f.year === 'GI1'), `total=${r.json.total}`);
    r = await call('GET', '/files?search=%25&limit=5', undefined, S);
    check('search with LIKE characters is literal', r.status === 200);

    // ---------------- Structure ----------------
    r = await call('GET', '/structure');
    const pubModule = r.json.structure?.cycles?.[0]?.years?.[0]?.semesters?.[0]?.modules?.[0];
    check('public structure: module names as strings', typeof pubModule === 'string');
    r = await call('GET', '/structure?withIds=1', undefined, S);
    check('withIds ignored for a student', typeof r.json.structure.cycles[0].years[0].semesters[0].modules[0] === 'string');
    r = await call('GET', '/structure?withIds=1', undefined, A);
    const tree = r.json.structure;
    check('withIds for superadmin', typeof tree.cycles[0].id === 'number' && typeof tree.cycles[0].years[0].semesters[0].modules[0].id === 'number');

    const withTest = { cycles: [...tree.cycles, { name: 'ZZ Test', cycle: 'CI', years: [{ code: 'ZZ9', semesters: [{ name: 'S1', modules: [{ name: 'Mod A' }] }] }] }] };
    r = await call('PUT', '/structure', withTest, A);
    const zz = r.json.structure?.cycles?.find((c: any) => c.name === 'ZZ Test');
    const modA = zz?.years[0].semesters[0].modules[0];
    check('structure: add filière/year/semester/module', r.status === 200 && !!modA?.id, r.json.message);

    zz.years[0].semesters[0].modules[0] = { id: modA.id, name: 'Mod B' };
    r = await call('PUT', '/structure', r.json.structure, A);
    const modB = r.json.structure?.cycles?.find((c: any) => c.name === 'ZZ Test')?.years[0].semesters[0].modules[0];
    check('structure: rename keeps the id', r.status === 200 && modB?.id === modA.id && modB.name === 'Mod B');
    const treeAfterRename = r.json.structure;

    // ---------------- Direct upload into the test module ----------------
    const size = 5 * 1024 * 1024 + 123; // above Vercel's 4.5 MB body limit
    r = await call('POST', '/files/upload-session', { fileName: 'zz-test.pdf', size, filiere: 'ZZ Test', year: 'ZZ9', semester: 'S1', module: 'Mod B', fileCategory: 'Cours' }, A);
    check('upload session', r.status === 200 && /googleapis\.com\/upload/.test(r.json.uploadUrl ?? ''), r.json.message);
    const { uploadId, uploadUrl, mimeType } = r.json;
    const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': mimeType, Origin: BASE }, body: Buffer.alloc(size, 0x25) });
    const driveFile: any = await put.json();
    check('file sent straight to Drive', put.status === 200 && !!driveFile.id);
    check('other user cannot complete it', (await call('POST', '/files/upload-complete', { uploadId, driveFileId: driveFile.id }, R)).status === 404);
    r = await call('POST', '/files/upload-complete', { uploadId, driveFileId: driveFile.id }, A);
    const uploaded = r.json.file;
    check('upload registered', r.status === 201 && uploaded?.module === 'Mod B' && uploaded.fileSize === size, r.json.message);

    const withoutModule = JSON.parse(JSON.stringify(treeAfterRename));
    withoutModule.cycles.find((c: any) => c.name === 'ZZ Test').years[0].semesters[0].modules = [];
    r = await call('PUT', '/structure', withoutModule, A);
    check('cannot delete a module that has files', r.status === 400 && /fichier/.test(r.json.message), r.json.message);

    r = await call('PUT', `/files/${uploaded._id}`, { fileName: 'zz-renamed.pdf', module: 'Mod B', fileCategory: 'TD', fileLabel: 'Zz' }, A);
    check('edit file metadata', r.status === 200 && r.json.file.displayName === 'zz-renamed.pdf' && r.json.file.fileCategory === 'TD');
    check('responsable cannot delete a file they did not upload', (await call('DELETE', `/files/${uploaded._id}`, undefined, R)).status === 403);
    r = await call('DELETE', `/files/${uploaded._id}`, undefined, A);
    check('delete file (Drive + record)', r.status === 200);

    r = await call('PUT', '/structure', { cycles: tree.cycles }, A);
    check('remove the test filière', r.status === 200 && !r.json.structure.cycles.some((c: any) => c.name === 'ZZ Test'), r.json.message);

    // ---------------- Saved parcours ----------------
    r = await call('POST', '/parcours', { cycle: 'CI', filiere: 'Génie Informatique', year: 'GI1', semester: 'S1' }, S);
    const firstStatus = r.status;
    const gi1Semesters = tree.cycles.find((c: any) => c.name === 'Génie Informatique').years.find((y: any) => y.code === 'GI1').semesters;
    r = await call('POST', '/parcours', { cycle: 'CI', filiere: 'Génie Informatique', year: 'GI1', semester: gi1Semesters[0].name }, S);
    check('save a parcours', (r.status === 201 || r.status === 200) && r.json.parcours.length === 1, `${firstStatus}/${r.status}`);
    const savedId = r.json.parcours[0].id;
    r = await call('POST', '/parcours', { cycle: 'CI', filiere: 'Génie Informatique', year: 'GI1', semester: gi1Semesters[0].name }, S);
    check('duplicate not added', r.json.parcours.length === 1);
    check('nonexistent parcours refused', (await call('POST', '/parcours', { cycle: 'CI', filiere: 'Génie Informatique', year: 'GI1', semester: 'S99' }, S)).status === 400);
    const allSemesters = tree.cycles
        .flatMap((c: any) => c.years.flatMap((y: any) => y.semesters.map((se: any) => ({ cycle: c.cycle, filiere: c.name, year: y.code, semester: se.name }))))
        .filter((p: any) => !(p.year === 'GI1' && p.semester === gi1Semesters[0].name));
    for (const p of allSemesters.slice(0, 5)) r = await call('POST', '/parcours', p, S);
    check('6 parcours saved', r.json.parcours?.length === 6, `${r.status}`);
    r = await call('POST', '/parcours', allSemesters[5], S);
    check('7th parcours refused', r.status === 400, r.json.message);
    await call('DELETE', `/parcours/${savedId}`, undefined, S2);
    check("can't remove someone else's parcours", (await call('GET', '/parcours', undefined, S)).json.parcours.length === 6);
    r = await call('DELETE', `/parcours/${savedId}`, undefined, S);
    check('remove own parcours', r.status === 200 && r.json.parcours.length === 5);

    // ---------------- Student list: instant revocation ----------------
    r = await call('POST', '/students/import', { emails: ['zz.other@etu.uae.ac.ma', 'x@gmail.com'] }, A);
    check('import student list', r.status === 200 && r.json.added === 1 && r.json.invalidCount === 1, JSON.stringify(r.json));
    check('unlisted student loses access immediately', (await call('GET', '/files?limit=1', undefined, S)).status === 401);
    check('listed student keeps access', (await call('GET', '/files?limit=1', undefined, S2)).status === 200);
    r = await call('DELETE', `/students/${encodeURIComponent('zz.other@etu.uae.ac.ma')}`, undefined, A);
    check('remove from list', r.status === 200);
    check('empty list again: every student allowed', (await call('GET', '/files?limit=1', undefined, S)).status === 200);

    // ---------------- Responsables ----------------
    r = await call('POST', '/users', { email: 'zz.resp@gmail.com', firstName: 'Zz', lastName: 'Resp', assignedYear: 'GI2', assignedFiliere: 'Génie Informatique' }, A);
    const zzResp = r.json.user;
    check('create responsable (no password)', r.status === 201 && zzResp?.assignedYear === 'GI2', r.json.message);
    check('staff email conflict refused', (await call('POST', '/users', { email: admin.email, firstName: 'a', lastName: 'b', assignedYear: 'GI2', assignedFiliere: 'Génie Informatique' }, A)).status === 400);
    check('year outside filière refused', (await call('POST', '/users', { email: 'zz.x@gmail.com', firstName: 'a', lastName: 'b', assignedYear: 'GM1', assignedFiliere: 'Génie Informatique' }, A)).status === 400);
    r = await call('PUT', `/users/${zzResp._id}`, { email: 'zz.student@etu.uae.ac.ma', firstName: 'Zz', lastName: 'Merged', assignedYear: 'GI2', assignedFiliere: 'Génie Informatique' }, A);
    const [merged] = await db.select().from(s.users).where(eq(s.users.email, 'zz.student@etu.uae.ac.ma'));
    const mergedParcours = await db.select().from(s.savedParcours).where(eq(s.savedParcours.userId, zzResp._id));
    check('email change to a student address merges accounts', r.status === 200 && merged?.id === zzResp._id && merged.role === 'responsable' && mergedParcours.length === 5, r.json.message);
    check("merged student's old session no longer works", (await call('GET', '/parcours', undefined, S)).status === 401);
    r = await call('PUT', `/users/${zzResp._id}`, { isActive: false }, A);
    check('deactivate responsable', r.status === 200 && r.json.user.isActive === false);
    check('users list', (await call('GET', '/users', undefined, A)).json.users.some((u: any) => u._id === zzResp._id));
    r = await call('DELETE', `/users/${zzResp._id}`, undefined, A);
    check('delete responsable', r.status === 200);

    // ---------------- Stats & logs ----------------
    r = await call('GET', '/stats/dashboard', undefined, A);
    check('dashboard stats', r.status === 200 && r.json.stats.totalFiles >= 547 && Array.isArray(r.json.stats.recentUploads), `files=${r.json.stats?.totalFiles}`);
    r = await call('GET', '/stats/files-by-filiere', undefined, A);
    check('files by filière', r.status === 200 && r.json.distribution.length > 0 && r.json.distribution[0]._id);
    r = await call('GET', '/stats/logs?limit=5', undefined, A);
    check('activity logs', r.status === 200 && r.json.logs.length === 5 && 'timestamp' in r.json.logs[0], `total=${r.json.total}`);
    r = await call('GET', '/stats/logs?action=STRUCTURE_UPDATE&limit=3', undefined, A);
    check('logs filtered by action', r.json.logs.every((l: any) => l.action === 'STRUCTURE_UPDATE'));

    // ---------------- Profile ----------------
    r = await call('PUT', '/auth/profile', { lastName: admin.lastName + 'x' }, A);
    check('profile update', r.status === 200 && r.json.user.lastName === admin.lastName + 'x');
    await call('PUT', '/auth/profile', { lastName: admin.lastName }, A);

    await cleanup();
    const failed = results.filter((x) => !x[1]).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
})().catch(async (e) => {
    console.error(e);
    await cleanup().catch(() => undefined);
    process.exit(1);
});
