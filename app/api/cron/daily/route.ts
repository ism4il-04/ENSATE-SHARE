import { timingSafeEqual } from 'crypto';
import { lt } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import * as schema from '@/lib/db/schema';
import { db, pendingUploads } from '@/lib/db';
import { deleteExpiredCodes } from '@/lib/server/access-codes';
import { drive } from '@/lib/server/drive';
import { fail, handler, json } from '@/lib/server/http';

const BACKUP_FOLDER = '_backups';
const BACKUPS_KEPT = 30;

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; compared in constant time
function isAuthorizedCron(req: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    const header = req.headers.get('authorization') ?? '';
    if (!secret) return false;
    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(header);
    return expected.length === received.length && timingSafeEqual(expected, received);
}

async function backupFolderId(): Promise<string> {
    const root = process.env.GOOGLE_DRIVE_FOLDER_ID || '1PqHqKAQdYB3GLQrYtnas23wjvm9m5Gr7';
    const found = await drive().files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${BACKUP_FOLDER}' and '${root}' in parents and trashed=false`,
        fields: 'files(id)',
    });
    if (found.data.files?.[0]?.id) return found.data.files[0].id;
    // Private folder: not shared with "anyone with the link", unlike documents
    const created = await drive().files.create({
        requestBody: { name: BACKUP_FOLDER, mimeType: 'application/vnd.google-apps.folder', parents: [root] },
        fields: 'id',
    });
    return created.data.id!;
}

// Daily: purge abandoned uploads and expired access codes, then back up every table as JSON to Drive (Neon Free keeps only 6 h of history)
export const GET = handler(async (req: NextRequest) => {
    if (!isAuthorizedCron(req)) return fail(401, 'Unauthorized');

    await db.delete(pendingUploads).where(lt(pendingUploads.expiresAt, new Date()));
    // Expired access codes go, and with them the temporary accounts they created
    const expiredCodes = await deleteExpiredCodes();

    const tables = {
        filieres: schema.filieres,
        years: schema.years,
        semesters: schema.semesters,
        modules: schema.modules,
        users: schema.users,
        files: schema.files,
        saved_parcours: schema.savedParcours,
        student_allowlist: schema.studentAllowlist,
        access_codes: schema.accessCodes,
        activity_logs: schema.activityLogs,
    };
    const dump: Record<string, unknown[]> = {};
    for (const [name, table] of Object.entries(tables)) {
        dump[name] = await db.select().from(table as any);
    }

    const folderId = await backupFolderId();
    const name = `ensate-share-${new Date().toISOString().slice(0, 10)}.json`;
    await drive().files.create({
        requestBody: { name, parents: [folderId], mimeType: 'application/json' },
        media: { mimeType: 'application/json', body: Readable.from([JSON.stringify({ createdAt: new Date(), tables: dump })]) },
        fields: 'id',
    });

    // Keep only the most recent backups
    const existing = await drive().files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        orderBy: 'createdTime desc',
        pageSize: 100,
    });
    for (const old of (existing.data.files ?? []).slice(BACKUPS_KEPT)) {
        await drive().files.delete({ fileId: old.id! });
    }

    return json({ success: true, expiredCodes, backup: name, rows: Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, v.length])) });
}, 'Daily job failed');
