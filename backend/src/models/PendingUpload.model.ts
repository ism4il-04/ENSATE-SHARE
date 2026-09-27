import mongoose, { Document, Schema } from 'mongoose';

// An upload the server authorized: the browser sends the file straight to Google Drive,
// then calls upload-complete, which checks the Drive file against this record.
export interface IPendingUpload extends Document {
    userId: mongoose.Types.ObjectId;
    folderId: string;
    fileName: string;
    originalName: string;
    fileType: string;
    mimeType: string;
    size: number;
    year: string;
    filiere: string;
    semester: string;
    module: string;
    fileCategory: string;
    fileLabel?: string;
    expiresAt: Date;
}

const pendingUploadSchema = new Schema<IPendingUpload>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    folderId: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    year: { type: String, required: true },
    filiere: { type: String, required: true },
    semester: { type: String, required: true },
    module: { type: String, required: true },
    fileCategory: { type: String, required: true },
    fileLabel: { type: String },
    // Google upload links are valid for a week; unfinished uploads are forgotten after a day
    expiresAt: { type: Date, required: true },
});

pendingUploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPendingUpload>('PendingUpload', pendingUploadSchema);
