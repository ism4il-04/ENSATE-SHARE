import { drive, FOLDER_ID } from '../config/drive';

/**
 * Find or create a folder in Google Drive
 * @param folderName Name of the folder
 * @param parentId ID of the parent folder
 * @returns ID of the found or created folder
 */
export const findOrCreateFolder = async (folderName: string, parentId: string): Promise<string> => {
    try {
        // Search for existing folder
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id!;
        }

        // Create new folder
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        };

        const folder = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return folder.data.id!;
    } catch (error: any) {
        console.error(`Error in findOrCreateFolder (${folderName}):`, error);
        throw new Error(`Failed to process folder: ${folderName}`);
    }
};

/**
 * Find an existing folder in Google Drive (do not create it)
 */
export const findFolder = async (folderName: string, parentId: string): Promise<string | null> => {
    try {
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
            pageSize: 1,
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id || null;
        }
        return null;
    } catch (error: any) {
        console.error(`Error in findFolder (${folderName}):`, error);
        return null;
    }
};

export interface DrivePathParams {
    filiere: string;
    year: string;
    semester: string;
    module: string;
    fileCategory?: string;
}

/**
 * Ensures the full folder path exists in Google Drive
 * Hierarchy: Cycle > Filière (optional) > Year > Semester > Module > Type
 */
export const ensureDrivePath = async (params: DrivePathParams): Promise<string> => {
    const { filiere, year, semester, module, fileCategory } = params;
    let currentParentId = FOLDER_ID;

    // 1. Cycle Level
    const isPrep = filiere.toLowerCase().includes('préparatoire') || filiere.toLowerCase().includes('preparatoire') || filiere === 'CP';
    const cycleName = isPrep ? 'Cycle Préparatoire' : 'Cycle Ingénieur';
    currentParentId = await findOrCreateFolder(cycleName, currentParentId);

    // 2. Filière Level (Skip for CP)
    if (!isPrep) {
        currentParentId = await findOrCreateFolder(filiere, currentParentId);
    }

    // 3. Year Level
    currentParentId = await findOrCreateFolder(year, currentParentId);

    // 4. Semester Level
    currentParentId = await findOrCreateFolder(semester, currentParentId);

    // 5. Module Level
    currentParentId = await findOrCreateFolder(module, currentParentId);

    // 6. Type Level (Category)
    const category = fileCategory || 'Autre';
    currentParentId = await findOrCreateFolder(category, currentParentId);

    return currentParentId;
};

export interface DrivePathIds {
    cycleId?: string;
    filiereId?: string;
    yearId?: string;
    semesterId?: string;
    moduleId?: string;
    categoryId?: string;
}

/**
 * Find existing Drive folders for a given (filiere, year, semester, module, category) path.
 * Does NOT create any folder.
 */
export const findDrivePathIds = async (params: DrivePathParams): Promise<DrivePathIds | null> => {
    const { filiere, year, semester, module, fileCategory } = params;
    let currentParentId = FOLDER_ID;
    const ids: DrivePathIds = {};

    const isPrep =
        filiere.toLowerCase().includes('préparatoire') ||
        filiere.toLowerCase().includes('preparatoire') ||
        filiere === 'CP';
    const cycleName = isPrep ? 'Cycle Préparatoire' : 'Cycle Ingénieur';

    // 1. Cycle
    const cycleId = await findFolder(cycleName, currentParentId);
    if (!cycleId) return null;
    ids.cycleId = cycleId;
    currentParentId = cycleId;

    // 2. Filière (skip for CP)
    if (!isPrep) {
        const filiereId = await findFolder(filiere, currentParentId);
        if (!filiereId) return ids;
        ids.filiereId = filiereId;
        currentParentId = filiereId;
    }

    // 3. Year
    const yearId = await findFolder(year, currentParentId);
    if (!yearId) return ids;
    ids.yearId = yearId;
    currentParentId = yearId;

    // 4. Semester
    const semesterId = await findFolder(semester, currentParentId);
    if (!semesterId) return ids;
    ids.semesterId = semesterId;
    currentParentId = semesterId;

    // 5. Module
    const moduleId = await findFolder(module, currentParentId);
    if (!moduleId) return ids;
    ids.moduleId = moduleId;
    currentParentId = moduleId;

    // 6. Category
    if (fileCategory) {
        const categoryId = await findFolder(fileCategory, currentParentId);
        if (categoryId) ids.categoryId = categoryId;
    }

    return ids;
};

/**
 * Returns true if a Drive folder has no non-trashed children.
 */
export const isFolderEmpty = async (folderId: string): Promise<boolean> => {
    try {
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            pageSize: 1,
            spaces: 'drive',
        });
        return !response.data.files || response.data.files.length === 0;
    } catch (error: any) {
        console.error(`Error in isFolderEmpty (${folderId}):`, error);
        return false;
    }
};

/**
 * Delete a folder if it has no children. Returns true if deleted.
 */
export const deleteFolderIfEmpty = async (folderId: string): Promise<boolean> => {
    const empty = await isFolderEmpty(folderId);
    if (!empty) return false;
    try {
        await drive.files.delete({ fileId: folderId });
        return true;
    } catch (error: any) {
        console.error(`Error deleting folder ${folderId}:`, error);
        return false;
    }
};

/**
 * Delete a category folder (Cours/TD/...) if it exists and is empty.
 */
export const deleteCategoryFolderIfEmpty = async (params: DrivePathParams): Promise<void> => {
    const ids = await findDrivePathIds(params);
    if (!ids?.categoryId) return;
    await deleteFolderIfEmpty(ids.categoryId);
};

/**
 * Delete a module folder if it exists, and prune empty ancestors:
 * Module -> Semester -> Year -> Filière (if CI) -> Cycle
 */
export const deleteModuleFolderAndPruneAncestors = async (params: DrivePathParams): Promise<void> => {
    const ids = await findDrivePathIds(params);
    if (!ids?.moduleId) return;

    try {
        await drive.files.delete({ fileId: ids.moduleId });
    } catch (error: any) {
        console.error(`Error deleting module folder ${ids.moduleId}:`, error);
        return;
    }

    const ancestors = [ids.semesterId, ids.yearId, ids.filiereId, ids.cycleId].filter(
        (id): id is string => Boolean(id),
    );

    for (const folderId of ancestors) {
        const deleted = await deleteFolderIfEmpty(folderId);
        if (!deleted) break;
    }
};

/**
 * Rename a module folder in Drive (keep same position in hierarchy).
 */
export const renameModuleFolder = async (
    params: DrivePathParams & { newModuleName: string },
): Promise<void> => {
    const ids = await findDrivePathIds(params);
    if (!ids?.moduleId) return;

    try {
        await drive.files.update({
            fileId: ids.moduleId,
            requestBody: { name: params.newModuleName },
        });
    } catch (error: any) {
        console.error(`Error renaming module folder ${ids.moduleId} to ${params.newModuleName}:`, error);
    }
}
