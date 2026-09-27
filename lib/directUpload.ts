import { filesAPI } from '@/lib/api';

export interface UploadDetails {
    semester: string;
    module: string;
    fileCategory: string;
    fileLabel?: string;
    year?: string;
    filiere?: string;
}

// Sends the file straight to Google Drive through a one-time upload link from our API,
// so it never goes through Vercel (which caps request bodies at 4.5 MB).
export async function uploadFileDirect(
    file: File,
    details: UploadDetails,
    onProgress?: (loadedBytes: number) => void
): Promise<void> {
    // 1. Our API checks the rights and target, and returns the Drive upload link
    const session = await filesAPI.createUploadSession({ ...details, fileName: file.name, size: file.size });
    const { uploadId, uploadUrl, mimeType } = session.data as { uploadId: string; uploadUrl: string; mimeType: string };

    // 2. Browser -> Google Drive (XMLHttpRequest for upload progress)
    const driveFileId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', mimeType);
        xhr.upload.onprogress = (e) => onProgress?.(e.loaded);
        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    resolve(JSON.parse(xhr.responseText).id);
                } catch {
                    reject(new Error('Réponse Google Drive invalide'));
                }
            } else {
                reject(new Error(`Google Drive a refusé le fichier (${xhr.status})`));
            }
        };
        xhr.onerror = () => reject(new Error("Échec de l'envoi vers Google Drive (connexion interrompue ?)"));
        xhr.send(file);
    });

    // 3. Our API verifies the Drive file and registers it
    await filesAPI.completeUpload({ uploadId, driveFileId });
}
