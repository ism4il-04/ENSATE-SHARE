import app from '../backend/src/app';
import connectDB from '../backend/src/config/database';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: any, res: any) {
    // Ensure DB is connected before handling the request
    await connectDB();
    return app(req, res);
}
