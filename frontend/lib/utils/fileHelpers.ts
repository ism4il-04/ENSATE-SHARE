// Helper functions for file management

/**
 * Generate Cloudinary thumbnail URL for PDF files
 * Note: Cloudinary's document preview requires special add-ons for Office files (DOCX, PPTX, etc.)
 * @param cloudinaryUrl - Original Cloudinary URL
 * @param fileType - File extension (pdf, docx, xlsx, pptx, etc.)
 * @returns Thumbnail URL for PDFs, original URL for others
 */
export const generateThumbnailUrl = (cloudinaryUrl: string, fileType: string, thumbnailLink?: string): string => {
    // If it's a Google Drive file with a thumbnail link, use it directly
    if (thumbnailLink) {
        return thumbnailLink;
    }

    // Standard Cloudinary logic for images and PDFs
    if (!['jpg', 'jpeg', 'png', 'gif', 'pdf'].includes(fileType.toLowerCase())) {
        return '';
    }

    // Default transformations
    // w_200,h_200,c_fill,f_jpg,pg_1 = width 200, height 200, fill crop, jpg format, page 1
    const transformations = 'w_200,h_200,c_fill,f_jpg,pg_1';

    // Insert transformations into the URL
    const uploadIndex = cloudinaryUrl.indexOf('/upload/');
    if (uploadIndex === -1) return cloudinaryUrl;

    // For PDF thumbnails, we need to ensure resource type is image if possible, 
    // but with the new Google Drive approach, this Cloudinary logic is legacy.
    // However, for existing Cloudinary files, we keep this.
    // Note: The previous fix for PDF thumbnails (changing /raw/ to /image/) is still valid for Cloudinary.
    let modifiedUrl = cloudinaryUrl;
    if (fileType.toLowerCase() === 'pdf' && modifiedUrl.includes('/raw/upload/')) {
        modifiedUrl = modifiedUrl.replace('/raw/upload/', '/image/upload/');
    }

    return modifiedUrl.slice(0, uploadIndex + 8) + transformations + '/' + modifiedUrl.slice(uploadIndex + 8);
};

/**
 * Check if a file type supports thumbnail generation
 * @param fileType - File extension
 * @returns true if the file type supports thumbnails (currently only PDF)
 */
export const isDocumentWithThumbnail = (fileType: string): boolean => {
    return fileType.toLowerCase() === 'pdf';
};

/**
 * Get file type icon color based on extension
 * @param fileType - File extension
 * @returns Color class for the file icon
 */
export const getFileTypeColor = (fileType: string): string => {
    const colors: Record<string, string> = {
        'pdf': 'text-red-500',
        'doc': 'text-blue-500',
        'docx': 'text-blue-500',
        'xls': 'text-green-600',
        'xlsx': 'text-green-600',
        'ppt': 'text-orange-500',
        'pptx': 'text-orange-500',
        'txt': 'text-gray-500',
        'zip': 'text-yellow-600',
        'rar': 'text-yellow-600',
    };

    return colors[fileType.toLowerCase()] || 'text-gray-400';
};

/**
 * Get color scheme for file category badges
 * @param category - File category (Cours, TD, TP, EXAM, Autre)
 * @returns Object with bg and text color classes
 */
export const getFileCategoryColor = (category: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
        'Cours': { bg: 'bg-accent-100', text: 'text-accent-800' },
        'TD': { bg: 'bg-atlas-100', text: 'text-atlas-800' },
        'TP': { bg: 'bg-gold-100', text: 'text-gold-800' },
        'EXAM': { bg: 'bg-red-100', text: 'text-red-800' },
        'Autre': { bg: 'bg-cream-300/60', text: 'text-atlas-700' },
    };

    return colors[category] || colors['Autre'];
};

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};
