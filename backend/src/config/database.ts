import mongoose from 'mongoose';

// Cache mongoose connection across serverless invocations
let cached = (global as any).mongooseConnection as {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
} | undefined;

const connectDB = async (): Promise<void> => {
    // If already connected, skip
    if (cached?.conn) {
        return;
    }

    if (!cached) {
        cached = (global as any).mongooseConnection = { conn: null, promise: null };
    }

    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(mongoURI).then((m) => {
            console.log(`✅ MongoDB Connected: ${m.connection.host}`);
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error: any) {
        cached.promise = null; // Reset promise on failure so next call retries
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        throw error;
    }
};

export default connectDB;
