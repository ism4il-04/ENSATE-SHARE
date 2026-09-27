import mongoose, { Document, Schema } from 'mongoose';

// Failed login counters, keyed by "ip:<addr>" or "email:<addr>".
// Stored in MongoDB (not memory) so limits hold across serverless instances.
export interface ILoginAttempt extends Document {
    key: string;
    count: number;
    expiresAt: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>({
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
});

// MongoDB removes the document once expiresAt has passed
loginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);
