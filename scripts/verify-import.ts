/**
 * Compares MongoDB and Postgres after db:import-mongo: files per filière/year/semester/module,
 * total size, responsables' assignments, uploaders. Read-only on both sides.
 *   npm run db:verify-import [-- --production]
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { neon } from '@neondatabase/serverless';
import { resolveTarget } from './db-target';

(async () => {
    const { url } = resolveTarget(process.argv);
    config({ path: '.env.development.local' }); // MONGODB_URI (read-only source)
    await mongoose.connect(process.env.MONGODB_URI as string);
    const mdb = mongoose.connection.db!;
    const sql = neon(url);
    let problems = 0;
    const compare = (label: string, a: Map<string, unknown>, b: Map<string, unknown>) => {
        const keys = new Set([...a.keys(), ...b.keys()]);
        const diffs = [...keys].filter((k) => String(a.get(k)) !== String(b.get(k)));
        problems += diffs.length;
        console.log(`${diffs.length ? 'DIFF' : 'OK  '} ${label}: ${keys.size} entries${diffs.length ? `, ${diffs.length} differ` : ''}`);
        for (const k of diffs.slice(0, 5)) console.log(`       ${k}: mongo=${a.get(k)} postgres=${b.get(k)}`);
    };

    // Files per module path + total size
    const mPaths = new Map<string, number>();
    for (const r of await mdb.collection('files').aggregate([{ $group: { _id: { f: '$filiere', y: '$year', s: '$semester', m: '$module', c: '$fileCategory' }, n: { $sum: 1 } } }]).toArray()) {
        mPaths.set([r._id.f, r._id.y, r._id.s, r._id.m, r._id.c].join(' / '), r.n);
    }
    const pPaths = new Map<string, number>();
    for (const r of await sql`select f.name as f, y.code as y, s.name as s, m.name as m, fi.category as c, count(*)::int as n
        from files fi join modules m on m.id = fi.module_id join semesters s on s.id = m.semester_id
        join years y on y.id = s.year_id join filieres f on f.id = y.filiere_id group by 1,2,3,4,5`) {
        pPaths.set([r.f, r.y, r.s, r.m, r.c].join(' / '), r.n);
    }
    compare('files per filière / year / semester / module / category', mPaths, pPaths);

    const [mSize] = await mdb.collection('files').aggregate([{ $group: { _id: null, t: { $sum: '$fileSize' } } }]).toArray();
    const [pSize] = await sql`select coalesce(sum(file_size),0)::bigint as t from files`;
    compare('total size (bytes)', new Map([['total', mSize?.t ?? 0]]), new Map([['total', pSize.t]]));

    // Accounts: role, active, assignment, has password
    const mUsers = new Map<string, string>();
    for (const u of await mdb.collection('users').find().toArray()) {
        mUsers.set(String(u.email).toLowerCase(), [u.role, u.isActive !== false, u.role === 'responsable' ? `${u.assignedFiliere}/${String(u.assignedYear).trim()}` : '-', !!u.password].join(' '));
    }
    const pUsers = new Map<string, string>();
    for (const u of await sql`select u.email, u.role, u.is_active, f.name as filiere, y.code, u.password_hash is not null as has_pw
        from users u left join years y on y.id = u.assigned_year_id left join filieres f on f.id = y.filiere_id`) {
        pUsers.set(u.email, [u.role, u.is_active, u.role === 'responsable' ? `${u.filiere}/${u.code}` : '-', u.has_pw].join(' '));
    }
    compare('accounts (role, active, assignment, password)', mUsers, pUsers);

    // Uploaders per file (by Drive id)
    const mEmailById = new Map((await mdb.collection('users').find().toArray()).map((u) => [String(u._id), String(u.email).toLowerCase()]));
    const mUp = new Map<string, string>();
    for (const f of await mdb.collection('files').find().toArray()) mUp.set(f.driveId, mEmailById.get(String(f.uploadedBy)) ?? 'none');
    const pUp = new Map<string, string>();
    for (const r of await sql`select fi.drive_id, coalesce(u.email,'none') as email from files fi left join users u on u.id = fi.uploaded_by`) pUp.set(r.drive_id, r.email);
    compare('uploader of each file', mUp, pUp);

    await mongoose.disconnect();
    console.log(problems ? `\n${problems} difference(s) found` : '\nAll checks match.');
    process.exit(problems ? 1 : 0);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
