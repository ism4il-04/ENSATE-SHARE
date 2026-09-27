import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export const MAX_SAVED_PARCOURS = 6;

export interface ISavedParcours {
    _id: mongoose.Types.ObjectId;
    cycle: 'CP' | 'CI';
    filiere: string;
    year: string;
    semester: string;
}

export interface IUser extends Document {
    email: string;
    password?: string;
    role: 'student' | 'responsable' | 'superadmin';
    assignedYear?: string;
    assignedFiliere?: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    passwordChangedAt?: Date;
    lastLoginAt?: Date;
    savedParcours: mongoose.Types.DocumentArray<ISavedParcours & mongoose.Types.Subdocument>;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const savedParcoursSchema = new Schema<ISavedParcours>({
    cycle: { type: String, enum: ['CP', 'CI'], required: true },
    filiere: { type: String, required: true },
    year: { type: String, required: true },
    semester: { type: String, required: true },
});

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            // Optional: students and responsables sign in with Google; a password is only a fallback
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: ['student', 'responsable', 'superadmin'],
            required: [true, 'Role is required'],
        },
        assignedYear: {
            type: String,
            required: function (this: IUser) {
                return this.role === 'responsable';
            },
        },
        assignedFiliere: {
            type: String,
            required: function (this: IUser) {
                return this.role === 'responsable';
            },
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Tokens issued before this date are rejected (see auth.middleware)
        passwordChangedAt: {
            type: Date,
        },
        lastLoginAt: {
            type: Date,
        },
        savedParcours: {
            type: [savedParcoursSchema],
            default: [],
            validate: {
                validator: (v: unknown[]) => v.length <= MAX_SAVED_PARCOURS,
                message: `At most ${MAX_SAVED_PARCOURS} saved parcours`,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        if (!this.isNew) {
            this.passwordChangedAt = new Date();
        }
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    // Google-only accounts (students) have no password to compare against
    if (!this.password) {
        return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
