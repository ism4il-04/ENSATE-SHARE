import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    fileName: string;
    originalName: string;
    displayName: string; // Original filename with accents preserved
    fileType: string;
    fileSize: number;
    fileUrl: string;
    publicId: string; // Cloudinary public ID for deletion
    year: string;
    filiere: string;
    semester: string; // "S1" to "S10"
    module: string;
    fileCategory: 'Cours' | 'TD' | 'TP' | 'EXAM' | 'Autre'; // Fixed category
    fileLabel?: string; // Custom label (e.g., "Cours n°1")
    uploadedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
    {
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        originalName: {
            type: String,
            required: [true, 'Original file name is required'],
            trim: true,
        },
        displayName: {
            type: String,
            required: [true, 'Display name is required'],
            trim: true,
        },
        fileType: {
            type: String,
            required: [true, 'File type is required'],
            enum: ['pdf', 'docx', 'pptx', 'xls', 'xlsx', 'zip', 'jpg', 'jpeg', 'png', 'gif'],
        },
        fileSize: {
            type: Number,
            required: [true, 'File size is required'],
        },
        fileUrl: {
            type: String,
            required: [true, 'File URL is required'],
        },
        publicId: {
            type: String,
            required: [true, 'Public ID is required'],
        },
        year: {
            type: String,
            required: [true, 'Year is required'],
        },
        filiere: {
            type: String,
            required: [true, 'Filiere is required'],
        },
        semester: {
            type: String,
            required: [true, 'Semester is required'],
        },
        module: {
            type: String,
            required: [true, 'Module is required'],
        },
        fileCategory: {
            type: String,
            required: [true, 'File category is required'],
            enum: ['Cours', 'TD', 'TP', 'EXAM', 'Autre'],
            default: 'Autre',
        },
        fileLabel: {
            type: String,
            required: false,
            trim: true,
            maxlength: [100, 'File label cannot exceed 100 characters'],
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader is required'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
fileSchema.index({ year: 1, filiere: 1, semester: 1, module: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ fileName: 'text', originalName: 'text' });

export default mongoose.model<IFile>('File', fileSchema);
