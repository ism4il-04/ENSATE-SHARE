import { and, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { db, files, pendingUploads } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireStaff } from '@/lib/server/auth';
import { drive } from '@/lib/server/drive';
import { FILES_TAG, getFileRow, serializeFile } from '@/lib/server/files';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { findModuleById } from '@/lib/server/structure';
import { isNonEmptyString, isUuid } from '@/lib/server/validation';

// Registers a file the browser finished uploading to Drive, after checking it's the one we authorized
export const POST = handler(async (req: NextRequest) => {
    const auth = await requireStaff(req);
    if (auth instanceof Response) return auth;

    const { uploadId, driveFileId } = await readBody(req);
    if (!isUuid(uploadId) || !isNonEmptyString(driveFileId, 200)) return fail(400, 'Requête invalide');

    const [pending] = await db
        .select()
        .from(pendingUploads)
        .where(and(eq(pendingUploads.id, uploadId), eq(pendingUploads.userId, auth.id)));
    if (!pending) return fail(404, 'Upload introuvable ou expiré');

    // The Drive file must be the one this session created: our upload id, our folder, the announced size
    let driveFile;
    try {
        driveFile = (
            await drive().files.get({
                fileId: driveFileId,
                fields: 'id, size, parents, appProperties, webViewLink, webContentLink, thumbnailLink',
            })
        ).data;
    } catch {
        driveFile = null;
    }

    if (!driveFile || driveFile.appProperties?.ensaUploadId !== uploadId) {
        return fail(400, 'Fichier Drive invalide pour cet upload');
    }
    if (!driveFile.parents?.includes(pending.folderId) || Number(driveFile.size) !== pending.size) {
        await drive().files.delete({ fileId: driveFileId }).catch(() => undefined);
        await db.delete(pendingUploads).where(eq(pendingUploads.id, pending.id));
        return fail(400, "Le fichier reçu ne correspond pas à l'upload annoncé");
    }

    // Readable by link: used by previews and downloads
    await drive().permissions.create({ fileId: driveFileId, requestBody: { role: 'reader', type: 'anyone' } });

    // Drive generates thumbnails a few seconds after upload (PPTX often takes longer)
    let thumbnailLink = driveFile.thumbnailLink;
    for (let retries = 0; !thumbnailLink && retries < 3; retries++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
            thumbnailLink = (await drive().files.get({ fileId: driveFileId, fields: 'thumbnailLink' })).data.thumbnailLink;
        } catch (error) {
            console.error('Failed to refetch thumbnail:', error);
        }
    }

    const [created] = await db
        .insert(files)
        .values({
            moduleId: pending.moduleId,
            category: pending.category,
            label: pending.label,
            fileName: pending.fileName,
            originalName: pending.originalName,
            displayName: pending.originalName, // keeps accents for display
            fileType: pending.fileType,
            fileSize: pending.size,
            driveId: driveFileId,
            webViewLink: driveFile.webViewLink ?? null,
            webContentLink: driveFile.webContentLink ?? null,
            thumbnailLink: thumbnailLink ?? null,
            uploadedBy: auth.id,
        })
        .onConflictDoNothing({ target: files.driveId })
        .returning({ id: files.id });
    await db.delete(pendingUploads).where(eq(pendingUploads.id, pending.id));
    if (!created) return fail(409, 'Ce fichier est déjà enregistré');

    revalidateTag(FILES_TAG);
    const path = await findModuleById(pending.moduleId);
    await logActivity({
        userId: auth.id,
        action: 'upload',
        details: `Uploaded ${pending.fileName} to ${path?.year} - ${path?.filiere} - ${path?.semester} - ${path?.module}`,
    });

    return json({ success: true, message: 'Fichier ajouté', file: serializeFile((await getFileRow(created.id))!) }, 201);
}, "Erreur lors de l'enregistrement du fichier");
