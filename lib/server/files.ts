import 'server-only';
import { and, count, desc, eq, ilike, or, SQL, sql, sum } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db, files, filieres, modules, semesters, users, years } from '@/lib/db';
import { escapeLike } from './validation';

export const FILES_TAG = 'files';

const fileColumns = {
    id: files.id,
    fileName: files.fileName,
    originalName: files.originalName,
    displayName: files.displayName,
    fileType: files.fileType,
    fileSize: files.fileSize,
    driveId: files.driveId,
    webViewLink: files.webViewLink,
    webContentLink: files.webContentLink,
    thumbnailLink: files.thumbnailLink,
    category: files.category,
    label: files.label,
    moduleId: files.moduleId,
    createdAt: files.createdAt,
    updatedAt: files.updatedAt,
    uploaderId: users.id,
    uploaderFirstName: users.firstName,
    uploaderLastName: users.lastName,
    filiere: filieres.name,
    cycle: filieres.cycle,
    year: years.code,
    semester: semesters.name,
    module: modules.name,
};

export type FileRow = {
    [K in keyof typeof fileColumns]: (typeof fileColumns)[K]['_']['data'] | null;
};

const selectFiles = () =>
    db
        .select(fileColumns)
        .from(files)
        .innerJoin(modules, eq(modules.id, files.moduleId))
        .innerJoin(semesters, eq(semesters.id, modules.semesterId))
        .innerJoin(years, eq(years.id, semesters.yearId))
        .innerJoin(filieres, eq(filieres.id, years.filiereId))
        .leftJoin(users, eq(users.id, files.uploadedBy));

// Same JSON shape the pages have always received (from the MongoDB backend)
export const serializeFile = (f: FileRow) => ({
    _id: f.id,
    fileName: f.fileName,
    originalName: f.originalName,
    displayName: f.displayName,
    fileType: f.fileType,
    fileSize: f.fileSize,
    fileUrl: f.webViewLink,
    driveId: f.driveId,
    webViewLink: f.webViewLink,
    webContentLink: f.webContentLink,
    thumbnailLink: f.thumbnailLink,
    year: f.year,
    filiere: f.filiere,
    semester: f.semester,
    module: f.module,
    fileCategory: f.category,
    fileLabel: f.label ?? undefined,
    uploadedBy: f.uploaderId ? { _id: f.uploaderId, firstName: f.uploaderFirstName, lastName: f.uploaderLastName } : null,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
});

export interface FileFilters {
    year?: string;
    filiere?: string;
    semester?: string;
    module?: string;
    fileCategory?: string;
    search?: string;
    uploadedYearId?: number; // responsable dashboard: their assigned year only
    page: number;
    limit: number;
}

async function queryFiles(filters: FileFilters) {
    const conditions: SQL[] = [];
    if (filters.year) conditions.push(eq(years.code, filters.year));
    if (filters.filiere) conditions.push(eq(filieres.name, filters.filiere));
    if (filters.semester) conditions.push(eq(semesters.name, filters.semester));
    if (filters.module) conditions.push(eq(modules.name, filters.module));
    if (filters.fileCategory) conditions.push(sql`${files.category}::text = ${filters.fileCategory}`);
    if (filters.uploadedYearId) conditions.push(eq(years.id, filters.uploadedYearId));
    if (filters.search) {
        const pattern = `%${escapeLike(filters.search)}%`;
        conditions.push(or(ilike(files.displayName, pattern), ilike(files.fileName, pattern), ilike(files.label, pattern))!);
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const joined = <T extends ReturnType<typeof db.select>>(q: T) =>
        q
            .from(files)
            .innerJoin(modules, eq(modules.id, files.moduleId))
            .innerJoin(semesters, eq(semesters.id, modules.semesterId))
            .innerJoin(years, eq(years.id, semesters.yearId))
            .innerJoin(filieres, eq(filieres.id, years.filiereId))
            .where(where);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [rows, [totals]] = await Promise.all([
        selectFiles()
            .where(where)
            .orderBy(desc(files.createdAt))
            .limit(filters.limit)
            .offset((filters.page - 1) * filters.limit),
        joined(
            db.select({
                total: count(),
                totalSize: sum(files.fileSize),
                thisMonth: sql<number>`count(*) filter (where ${files.createdAt} >= ${startOfMonth})`,
            })
        ),
    ]);

    const total = Number(totals?.total ?? 0);
    return {
        success: true,
        count: rows.length,
        total,
        totalSize: Number(totals?.totalSize ?? 0),
        thisMonthCount: Number(totals?.thisMonth ?? 0),
        page: filters.page,
        pages: Math.ceil(total / filters.limit),
        files: rows.map(serializeFile),
    };
}

// Public listings are cached per filter set and refreshed after any upload/edit/delete
const cachedQueryFiles = unstable_cache(queryFiles, ['files-list'], { tags: [FILES_TAG] });

export const listFiles = (filters: FileFilters, { cached }: { cached: boolean }) =>
    cached ? cachedQueryFiles(filters) : queryFiles(filters);

export async function getFileRow(id: string): Promise<FileRow | null> {
    const [row] = await selectFiles().where(eq(files.id, id));
    return row ?? null;
}

export const getCachedFileRow = unstable_cache(getFileRow, ['file-by-id'], { tags: [FILES_TAG] });

// Superadmin dashboard figures
export async function fileStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [[totals], recent] = await Promise.all([
        db
            .select({
                totalFiles: count(),
                totalStorage: sum(files.fileSize),
                filesThisMonth: sql<number>`count(*) filter (where ${files.createdAt} >= ${startOfMonth})`,
            })
            .from(files),
        selectFiles().orderBy(desc(files.createdAt)).limit(10),
    ]);
    return {
        totalFiles: Number(totals.totalFiles),
        totalStorage: Number(totals.totalStorage ?? 0),
        filesThisMonth: Number(totals.filesThisMonth),
        recentUploads: recent.map(serializeFile),
    };
}

export async function filesGroupedBy(field: 'filiere' | 'year') {
    const column = field === 'filiere' ? filieres.name : years.code;
    const rows = await db
        .select({ key: column, count: count(), totalSize: sum(files.fileSize) })
        .from(files)
        .innerJoin(modules, eq(modules.id, files.moduleId))
        .innerJoin(semesters, eq(semesters.id, modules.semesterId))
        .innerJoin(years, eq(years.id, semesters.yearId))
        .innerJoin(filieres, eq(filieres.id, years.filiereId))
        .groupBy(column)
        .orderBy(field === 'filiere' ? desc(count()) : column);
    return rows.map((r) => ({ _id: r.key, count: Number(r.count), totalSize: Number(r.totalSize ?? 0) }));
}

