import { and, count, eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { db, files, modules, semesters, years } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireLogin, requireStaff } from '@/lib/server/auth';
import { deleteCategoryFolderIfEmpty, deleteModuleFolderAndPruneAncestors, drive } from '@/lib/server/drive';
import { FILES_TAG, getCachedFileRow, getFileRow, serializeFile } from '@/lib/server/files';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { isNonEmptyString, isUuid } from '@/lib/server/validation';

type Params = { params: Promise<{ id: string }> };

const FILE_CATEGORIES = ['Cours', 'TD', 'TP', 'EXAM', 'Autre'] as const;

export const GET = handler(async (req: NextRequest, { params }: Params) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const file = isUuid(id) ? await getCachedFileRow(id) : null;
    if (!file) return fail(404, 'File not found');
    return json({ success: true, file: serializeFile(file) });
}, 'Error fetching file');

// Edit metadata: owner (responsable who uploaded it) or superadmin
export const PUT = handler(async (req: NextRequest, { params }: Params) => {
    const auth = await requireStaff(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const file = isUuid(id) ? await getFileRow(id) : null;
    if (!file) return fail(404, 'File not found');
    if (auth.role !== 'superadmin' && file.uploaderId !== auth.id) {
        return fail(403, 'Not authorized to update this file');
    }

    const { fileName, semester, module, fileCategory, fileLabel } = await readBody(req);
    for (const [field, value] of Object.entries({ fileName, semester, module, fileCategory })) {
        if (value !== undefined && value !== '' && !isNonEmptyString(value)) return fail(400, `Invalid ${field}`);
    }
    if (fileLabel !== undefined && fileLabel !== '' && !isNonEmptyString(fileLabel, 100)) {
        return fail(400, 'Invalid fileLabel');
    }

    const changes: Partial<typeof files.$inferInsert> = {};
    if (fileName) {
        changes.fileName = (fileName as string).trim();
        changes.displayName = (fileName as string).trim();
    }
    if (fileCategory) {
        if (!FILE_CATEGORIES.includes(fileCategory as any)) return fail(400, 'Invalid fileCategory');
        changes.category = fileCategory as (typeof FILE_CATEGORIES)[number];
    }
    if (fileLabel !== undefined) changes.label = (fileLabel as string) || null;

    // Moving to another module (the edit form lists every module of the file's year)
    if (module && module !== file.module) {
        const candidates = await db
            .select({ id: modules.id, semester: semesters.name })
            .from(modules)
            .innerJoin(semesters, eq(semesters.id, modules.semesterId))
            .innerJoin(years, eq(years.id, semesters.yearId))
            .where(
                and(
                    eq(modules.name, module as string),
                    eq(years.code, file.year!),
                    ...(semester ? [eq(semesters.name, semester as string)] : [])
                )
            );
        const target = candidates.find((c) => c.semester === file.semester) ?? candidates[0];
        if (!target) return fail(400, `Le module « ${module} » n'existe pas dans l'année ${file.year}`);
        changes.moduleId = target.id;
    }

    await db.update(files).set({ ...changes, updatedAt: new Date() }).where(eq(files.id, id));
    revalidateTag(FILES_TAG);
    await logActivity({
        userId: auth.id,
        action: 'FILE_UPDATE',
        targetType: 'File',
        targetId: id,
        details: { fileName, module },
    });

    return json({ success: true, message: 'File updated successfully', file: serializeFile((await getFileRow(id))!) });
}, 'Error updating file');

// Delete: owner or superadmin; removes the Drive file and prunes empty folders
export const DELETE = handler(async (req: NextRequest, { params }: Params) => {
    const auth = await requireStaff(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const file = isUuid(id) ? await getFileRow(id) : null;
    if (!file) return fail(404, 'File not found');
    if (auth.role !== 'superadmin' && file.uploaderId !== auth.id) {
        return fail(403, 'Not authorized to delete this file');
    }

    try {
        await drive().files.delete({ fileId: file.driveId! });
    } catch (error) {
        // Already gone from Drive: still remove the record
        console.error('Error deleting from Drive:', error);
    }
    await db.delete(files).where(eq(files.id, id));
    revalidateTag(FILES_TAG);

    const path = {
        filiere: file.filiere!,
        cycle: file.cycle!,
        year: file.year!,
        semester: file.semester!,
        module: file.module!,
        category: file.category!,
    };
    const [{ inModule }] = await db.select({ inModule: count() }).from(files).where(eq(files.moduleId, file.moduleId!));
    if (inModule === 0) {
        await deleteModuleFolderAndPruneAncestors(path);
    } else {
        const [{ inCategory }] = await db
            .select({ inCategory: count() })
            .from(files)
            .where(and(eq(files.moduleId, file.moduleId!), eq(files.category, file.category!)));
        if (inCategory === 0) await deleteCategoryFolderIfEmpty(path);
    }

    await logActivity({
        userId: auth.id,
        action: 'FILE_DELETE',
        targetType: 'File',
        targetId: id,
        details: { fileName: file.fileName, year: file.year, filiere: file.filiere },
    });

    return json({ success: true, message: 'File deleted successfully' });
}, 'Error deleting file');
