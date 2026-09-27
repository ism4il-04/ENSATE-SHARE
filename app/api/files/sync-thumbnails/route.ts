import { eq, isNull, or } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { db, files } from '@/lib/db';
import { requireSuperadmin } from '@/lib/server/auth';
import { drive } from '@/lib/server/drive';
import { FILES_TAG } from '@/lib/server/files';
import { handler, json } from '@/lib/server/http';

// Maintenance (superadmin): fetch Drive thumbnails for files that don't have one yet, 50 at a time
export const GET = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const toSync = await db
        .select({ id: files.id, fileName: files.fileName, driveId: files.driveId })
        .from(files)
        .where(or(isNull(files.thumbnailLink), eq(files.thumbnailLink, '')))
        .limit(50);

    const results = [];
    for (const file of toSync) {
        try {
            const { data } = await drive().files.get({ fileId: file.driveId, fields: 'thumbnailLink' });
            if (data.thumbnailLink) {
                await db.update(files).set({ thumbnailLink: data.thumbnailLink }).where(eq(files.id, file.id));
                results.push({ id: file.id, name: file.fileName, status: 'Updated' });
            } else {
                results.push({ id: file.id, name: file.fileName, status: 'Skipped', link: 'Not found in Drive' });
            }
        } catch (error: any) {
            results.push({ id: file.id, name: file.fileName, status: 'Error', error: error.message });
        }
    }
    if (results.some((r) => r.status === 'Updated')) revalidateTag(FILES_TAG);

    return json({ success: true, count: toSync.length, results });
}, 'Error syncing thumbnails');
