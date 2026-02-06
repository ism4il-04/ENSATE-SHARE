import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    // Allowed file extensions
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'pdf',
        'docx',
        'pptx',
        'xls',
        'xlsx',
        'zip',
        'jpg',
        'jpeg',
        'png',
        'gif',
    ];

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            ),
            false
        );
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
    },
});

export default upload;
