import { NextRequest } from 'next/server';
import { db, pendingUploads } from '@/lib/db';
import { requireStaff } from '@/lib/server/auth';
import { driveAccessToken, ensureDrivePath } from '@/lib/server/drive';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { resolveUploadTarget } from '@/lib/server/upload-target';
import { allowedExtensionsLabel, getExtension, MAX_UPLOAD_BYTES, mimeTypeFor, sanitizeFileName } from '@/lib/server/upload-rules';
import { isNonEmptyString } from '@/lib/server/validation';
import { eq } from 'drizzle-orm';

const PENDING_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

// Origin the browser uploads from: Google only accepts the browser's upload (CORS) from this origin
const uploadOrigin = (req: NextRequest): string => {
    const own = req.nextUrl.origin;
    const origin = req.headers.get('origin');
    return origin && origin === own ? origin : own;
};

/**
 * Authorizes an upload and returns a one-time Google Drive upload link: the browser sends the
 * file straight to Drive, since Vercel caps request bodies at 4.5 MB.
 */
export const POST = handler(async (req: NextRequest) => {
    const auth = await requireStaff(req);
    if (auth instanceof Response) return auth;

    const body = await readBody(req);
    const { fileName, size } = body;

    if (!isNonEmptyString(fileName, 255)) return fail(400, 'Nom de fichier invalide');
    if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) return fail(400, 'Taille de fichier invalide');
    if (size > MAX_UPLOAD_BYTES) {
        return fail(400, `Fichier trop volumineux (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} Mo)`);
    }

    const fileType = getExtension(fileName);
    const mimeType = mimeTypeFor(fileType);
    if (!mimeType) return fail(400, `Type de fichier non autorisé. Types acceptés : ${allowedExtensionsLabel()}`);

    const target = await resolveUploadTarget(auth, body);
    if (typeof target === 'string') return fail(400, target);

    const { module } = target;
    const folderId = await ensureDrivePath({ ...module, category: target.category });
    const sanitizedName = sanitizeFileName(fileName);

    const [pending] = await db
        .insert(pendingUploads)
        .values({
            userId: auth.id,
            moduleId: module.moduleId,
            category: target.category,
            label: target.label ?? null,
            folderId,
            fileName: sanitizedName,
            originalName: fileName,
            fileType: fileType as typeof pendingUploads.$inferInsert.fileType,
            mimeType,
            size,
            expiresAt: new Date(Date.now() + PENDING_UPLOAD_TTL_MS),
        })
        .returning({ id: pendingUploads.id });

    // Start a resumable upload on Drive; the session URL accepts exactly this one file
    const driveResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${await driveAccessToken()}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType,
            'X-Upload-Content-Length': String(size),
            Origin: uploadOrigin(req),
        },
        body: JSON.stringify({
            name: sanitizedName,
            parents: [folderId],
            mimeType,
            appProperties: { ensaUploadId: pending.id },
        }),
    });

    const uploadUrl = driveResponse.headers.get('location');
    if (!driveResponse.ok || !uploadUrl) {
        console.error('Drive resumable session failed:', driveResponse.status, await driveResponse.text());
        await db.delete(pendingUploads).where(eq(pendingUploads.id, pending.id));
        return fail(502, "Google Drive n'a pas accepté l'upload, réessayez");
    }

    return json({ success: true, uploadId: pending.id, uploadUrl, mimeType });
}, "Erreur lors de la préparation de l'upload");
