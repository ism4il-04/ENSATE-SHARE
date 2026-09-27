import 'server-only';
import { google } from 'googleapis';

/**
 * Google Drive storage. Documents live under GOOGLE_DRIVE_FOLDER_ID in the hierarchy
 * Cycle > Filière (not for the Cycle Préparatoire) > Year > Semester > Module > Category.
 */

let client: { drive: ReturnType<typeof google.drive>; auth: InstanceType<typeof google.auth.OAuth2> } | null = null;

const getClient = () => {
    if (!client) {
        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
            throw new Error('Google Drive credentials are missing (GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN)');
        }
        const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'https://developers.google.com/oauthplayground');
        auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
        client = { drive: google.drive({ version: 'v3', auth }), auth };
    }
    return client;
};

export const drive = () => getClient().drive;

export const driveAccessToken = async (): Promise<string> => {
    const { token } = await getClient().auth.getAccessToken();
    if (!token) throw new Error('Could not get a Google Drive access token');
    return token;
};

// Same default as the former Express backend, in case the variable isn't set on Vercel
const rootFolderId = () => process.env.GOOGLE_DRIVE_FOLDER_ID || '1PqHqKAQdYB3GLQrYtnas23wjvm9m5Gr7';

const escapeQuery = (name: string) => name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const FOLDER_MIME = 'application/vnd.google-apps.folder';

async function findFolder(name: string, parentId: string): Promise<string | null> {
    const response = await drive().files.list({
        q: `mimeType='${FOLDER_MIME}' and name='${escapeQuery(name)}' and '${parentId}' in parents and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive',
        pageSize: 1,
    });
    return response.data.files?.[0]?.id ?? null;
}

async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
    const existing = await findFolder(name, parentId);
    if (existing) return existing;
    const folder = await drive().files.create({
        requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
        fields: 'id',
    });
    return folder.data.id!;
}

export interface DrivePath {
    filiere: string;
    cycle: 'CP' | 'CI';
    year: string;
    semester: string;
    module: string;
    category?: string;
}

const cycleFolderName = (cycle: 'CP' | 'CI') => (cycle === 'CP' ? 'Cycle Préparatoire' : 'Cycle Ingénieur');

// Creates the missing folders of the path and returns the deepest one (the category folder)
export async function ensureDrivePath(path: DrivePath): Promise<string> {
    let parent = await findOrCreateFolder(cycleFolderName(path.cycle), rootFolderId());
    if (path.cycle !== 'CP') parent = await findOrCreateFolder(path.filiere, parent);
    parent = await findOrCreateFolder(path.year, parent);
    parent = await findOrCreateFolder(path.semester, parent);
    parent = await findOrCreateFolder(path.module, parent);
    return findOrCreateFolder(path.category || 'Autre', parent);
}

interface DrivePathIds {
    cycleId?: string;
    filiereId?: string;
    yearId?: string;
    semesterId?: string;
    moduleId?: string;
    categoryId?: string;
}

// Existing folders of a path (never creates any)
async function findDrivePathIds(path: DrivePath): Promise<DrivePathIds> {
    const ids: DrivePathIds = {};
    const cycleId = await findFolder(cycleFolderName(path.cycle), rootFolderId());
    if (!cycleId) return ids;
    ids.cycleId = cycleId;
    let parent = cycleId;
    if (path.cycle !== 'CP') {
        const filiereId = await findFolder(path.filiere, parent);
        if (!filiereId) return ids;
        ids.filiereId = parent = filiereId;
    }
    const yearId = await findFolder(path.year, parent);
    if (!yearId) return ids;
    ids.yearId = parent = yearId;
    const semesterId = await findFolder(path.semester, parent);
    if (!semesterId) return ids;
    ids.semesterId = parent = semesterId;
    const moduleId = await findFolder(path.module, parent);
    if (!moduleId) return ids;
    ids.moduleId = parent = moduleId;
    if (path.category) {
        const categoryId = await findFolder(path.category, parent);
        if (categoryId) ids.categoryId = categoryId;
    }
    return ids;
}

async function deleteFolderIfEmpty(folderId: string): Promise<boolean> {
    const children = await drive().files.list({ q: `'${folderId}' in parents and trashed=false`, fields: 'files(id)', pageSize: 1 });
    if (children.data.files?.length) return false;
    await drive().files.delete({ fileId: folderId });
    return true;
}

// Removes the category folder of a path if it no longer contains anything
export async function deleteCategoryFolderIfEmpty(path: DrivePath): Promise<void> {
    try {
        const ids = await findDrivePathIds(path);
        if (ids.categoryId) await deleteFolderIfEmpty(ids.categoryId);
    } catch (error) {
        console.error('deleteCategoryFolderIfEmpty failed:', error);
    }
}

// Deletes a module's folder (call only when no file references it) and prunes empty ancestors
export async function deleteModuleFolderAndPruneAncestors(path: DrivePath): Promise<void> {
    try {
        const ids = await findDrivePathIds({ ...path, category: undefined });
        if (!ids.moduleId) return;
        await drive().files.delete({ fileId: ids.moduleId });
        for (const folderId of [ids.semesterId, ids.yearId, ids.filiereId, ids.cycleId]) {
            if (!folderId || !(await deleteFolderIfEmpty(folderId))) break;
        }
    } catch (error) {
        console.error('deleteModuleFolderAndPruneAncestors failed:', error);
    }
}

// Renames a module's folder in place
export async function renameModuleFolder(path: DrivePath, newName: string): Promise<void> {
    try {
        const ids = await findDrivePathIds({ ...path, category: undefined });
        if (ids.moduleId) await drive().files.update({ fileId: ids.moduleId, requestBody: { name: newName } });
    } catch (error) {
        console.error('renameModuleFolder failed:', error);
    }
}
