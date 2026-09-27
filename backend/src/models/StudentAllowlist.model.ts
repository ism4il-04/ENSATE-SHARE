import mongoose, { Document, Schema } from 'mongoose';

// University emails allowed to sign in as students.
// While this collection is empty, every @etu.uae.ac.ma Google Workspace account is allowed.
export interface IStudentAllowlist extends Document {
    email: string;
    createdAt: Date;
}

const studentAllowlistSchema = new Schema<IStudentAllowlist>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IStudentAllowlist>('StudentAllowlist', studentAllowlistSchema);
