/**
 * One-off copy of every MongoDB collection into Postgres, in a single transaction
 * (all or nothing). MongoDB is only read, never modified.
 *
 *   npm run db:import-mongo                   → Neon dev branch (refuses if it already has data)
 *   npm run db:import-mongo -- --reset        → empties the dev tables first
 *   TARGET_DATABASE_URL=… npm run db:import-mongo -- --production [--reset]
 *
 * MONGODB_URI is read from .env.development.local.
 */
import { randomUUID } from 'crypto';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { count, sql } from 'drizzle-orm';
import * as s from '../lib/db/schema';
import { resolveTarget } from './db-target';

const reset = process.argv.includes('--reset');
const CHUNK = 200;

const chunks = <T>(items: T[]) => {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
    return out;
};
const key = (...parts: string[]) => parts.map((p) => p.trim()).join('|');
const date = (d: unknown) => (d instanceof Date ? d : d ? new Date(d as string) : undefined);

(async () => {
    const { url } = resolveTarget(process.argv);
    config({ path: '.env.development.local' }); // MONGODB_URI (read-only source)
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing from .env.development.local');

    await mongoose.connect(process.env.MONGODB_URI);
    const mdb = mongoose.connection.db!;
    const [structure] = await mdb.collection('academicstructures').find().toArray();
    const mUsers = await mdb.collection('users').find().toArray();
    const mFiles = await mdb.collection('files').find().toArray();
    const mLogs = await mdb.collection('activitylogs').find().toArray();
    const mAllow = await mdb.collection('studentallowlists').find().toArray();
    await mongoose.disconnect();
    console.log(`MongoDB read: ${mUsers.length} users, ${mFiles.length} files, ${mLogs.length} logs, ${mAllow.length} allowlist emails`);

    if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') neonConfig.webSocketConstructor = WebSocket;
    const pool = new Pool({ connectionString: url });
    const db = drizzle(pool, { schema: s, casing: 'snake_case' });

    try {
        await db.transaction(async (tx) => {
            const [{ n: existing }] = await tx.select({ n: count() }).from(s.users);
            if (existing > 0 && !reset) {
                throw new Error(`Target already has ${existing} users. Re-run with --reset to empty it first.`);
            }
            if (reset) {
                await tx.execute(sql`truncate table
                    activity_logs, saved_parcours, pending_uploads, files, users, student_allowlist,
                    login_attempts, modules, semesters, years, filieres restart identity cascade`);
            }

            // Academic structure
            const moduleIds = new Map<string, number>(); // filière|year|semester|module
            const semesterIds = new Map<string, number>(); // filière|year|semester
            const yearIds = new Map<string, number>(); // year code
            for (const [fi, c] of structure.cycles.entries()) {
                const [f] = await tx.insert(s.filieres).values({ name: c.name.trim(), cycle: c.cycle, position: fi }).returning();
                for (const [yi, y] of c.years.entries()) {
                    const [yr] = await tx.insert(s.years).values({ filiereId: f.id, code: y.code.trim(), position: yi }).returning();
                    yearIds.set(y.code.trim(), yr.id);
                    for (const [si, sem] of y.semesters.entries()) {
                        const [se] = await tx.insert(s.semesters).values({ yearId: yr.id, name: sem.name.trim(), position: si }).returning();
                        semesterIds.set(key(c.name, y.code, sem.name), se.id);
                        const mods = await tx
                            .insert(s.modules)
                            .values(sem.modules.map((m: string, mi: number) => ({ semesterId: se.id, name: m.trim(), position: mi })))
                            .returning();
                        for (const m of mods) moduleIds.set(key(c.name, y.code, sem.name, m.name), m.id);
                    }
                }
            }

            // Users (new uuids; old ObjectId → uuid map for files and logs)
            const userIds = new Map<string, string>();
            const userRows = mUsers.map((u) => {
                const id = randomUUID();
                userIds.set(String(u._id), id);
                const assignedYearId = u.role === 'responsable' ? yearIds.get(String(u.assignedYear).trim()) : undefined;
                if (u.role === 'responsable' && !assignedYearId) throw new Error(`Unknown year "${u.assignedYear}" for ${u.email}`);
                return {
                    id,
                    email: String(u.email).toLowerCase(),
                    role: u.role,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    passwordHash: u.password || null,
                    assignedYearId: assignedYearId ?? null,
                    isActive: u.isActive !== false,
                    passwordChangedAt: date(u.passwordChangedAt) ?? null,
                    lastLoginAt: date(u.lastLoginAt) ?? null,
                    createdAt: date(u.createdAt) ?? new Date(),
                    updatedAt: date(u.updatedAt) ?? new Date(),
                };
            });
            for (const part of chunks(userRows)) await tx.insert(s.users).values(part);

            const parcoursRows = mUsers.flatMap((u) =>
                (u.savedParcours ?? []).map((p: any) => {
                    const semesterId = semesterIds.get(key(p.filiere, p.year, p.semester));
                    if (!semesterId) throw new Error(`Unknown saved parcours for ${u.email}: ${JSON.stringify(p)}`);
                    return { userId: userIds.get(String(u._id))!, semesterId };
                })
            );
            for (const part of chunks(parcoursRows)) await tx.insert(s.savedParcours).values(part).onConflictDoNothing();

            // Files
            const fileRows = mFiles.map((f) => {
                const moduleId = moduleIds.get(key(f.filiere, f.year, f.semester, f.module));
                if (!moduleId) throw new Error(`File ${f._id} points to an unknown module: ${f.filiere} / ${f.year} / ${f.semester} / ${f.module}`);
                return {
                    moduleId,
                    category: f.fileCategory ?? 'Autre',
                    label: f.fileLabel || null,
                    fileName: f.fileName,
                    originalName: f.originalName,
                    displayName: f.displayName || f.originalName,
                    fileType: f.fileType,
                    fileSize: f.fileSize,
                    driveId: f.driveId,
                    webViewLink: f.webViewLink || null,
                    webContentLink: f.webContentLink || null,
                    thumbnailLink: f.thumbnailLink || null,
                    uploadedBy: userIds.get(String(f.uploadedBy)) ?? null,
                    createdAt: date(f.createdAt) ?? new Date(),
                    updatedAt: date(f.updatedAt) ?? new Date(),
                };
            });
            for (const part of chunks(fileRows)) await tx.insert(s.files).values(part);

            // Activity log (entries of deleted accounts keep a null user)
            const logRows = mLogs.map((l) => ({
                userId: userIds.get(String(l.userId)) ?? null,
                action: l.action,
                targetType: l.targetType ?? null,
                targetId: l.targetId ? String(l.targetId) : null,
                details: l.details ?? null,
                createdAt: date(l.timestamp) ?? new Date(),
            }));
            for (const part of chunks(logRows)) await tx.insert(s.activityLogs).values(part);

            const allowRows = mAllow.map((a) => ({ email: String(a.email).toLowerCase(), createdAt: date(a.createdAt) ?? new Date() }));
            for (const part of chunks(allowRows)) await tx.insert(s.studentAllowlist).values(part);

            // Report
            const counts = async (table: any) => (await tx.select({ n: count() }).from(table))[0].n;
            const report = {
                filieres: await counts(s.filieres),
                years: await counts(s.years),
                semesters: await counts(s.semesters),
                modules: await counts(s.modules),
                users: await counts(s.users),
                files: await counts(s.files),
                saved_parcours: await counts(s.savedParcours),
                activity_logs: await counts(s.activityLogs),
                student_allowlist: await counts(s.studentAllowlist),
            };
            console.log('Postgres now contains:', report);
            if (report.users !== mUsers.length || report.files !== mFiles.length || report.activity_logs !== mLogs.length) {
                throw new Error('Row counts differ from MongoDB, rolling back');
            }
        });
        console.log('Import committed.');
    } finally {
        await pool.end();
    }
})().catch((error) => {
    console.error('Import failed, nothing was written:', error.message ?? error);
    process.exit(1);
});
