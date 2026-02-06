import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    action: string;
    targetId?: mongoose.Types.ObjectId;
    targetType?: string;
    details?: any;
    timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        action: {
            type: String,
            required: [true, 'Action is required'],
            enum: [
                'FILE_UPLOAD',
                'FILE_DELETE',
                'FILE_UPDATE',
                'USER_CREATE',
                'USER_UPDATE',
                'USER_DELETE',
                'STRUCTURE_UPDATE',
                'LOGIN',
                'LOGOUT',
                // Lowercase versions used by controllers
                'login',
                'logout',
                'upload',
                'delete',
                'create_user',
                'update_user',
                'delete_user',
            ],
        },
        targetId: {
            type: Schema.Types.ObjectId,
        },
        targetType: {
            type: String,
            enum: ['File', 'User', 'AcademicStructure'],
        },
        details: {
            type: Schema.Types.Mixed,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

// Index for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
