// File types and size accepted for uploads (must stay in line with File.model's fileType enum)
const MIME_BY_EXTENSION: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
};

export const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_FILE_SIZE || '') || 50 * 1024 * 1024;

const allowedExtensions = (): string[] => {
    const configured = process.env.ALLOWED_FILE_TYPES?.split(',').map((t) => t.trim().toLowerCase());
    return (configured?.length ? configured : Object.keys(MIME_BY_EXTENSION)).filter((ext) => ext in MIME_BY_EXTENSION);
};

export const getExtension = (fileName: string): string => {
    const dot = fileName.lastIndexOf('.');
    return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
};

// MIME type the file is stored with on Drive, decided by the server from the extension
export const mimeTypeFor = (ext: string): string | null =>
    allowedExtensions().includes(ext) ? MIME_BY_EXTENSION[ext] : null;

export const allowedExtensionsLabel = (): string => allowedExtensions().join(', ');

// Drive-safe file name: no accents or special characters
export const sanitizeFileName = (name: string): string =>
    name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 200);
