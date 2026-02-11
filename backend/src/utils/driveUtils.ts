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

interface DrivePathParams {
    filiere: string;
    year: string;
    semester: string;
    module: string;
    fileCategory: string;
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
    currentParentId = await findOrCreateFolder(fileCategory, currentParentId);

    return currentParentId;
};
