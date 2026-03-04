import app from '../backend/src/app';

export default async function handler(req: any, res: any) {
    return app(req, res);
}
