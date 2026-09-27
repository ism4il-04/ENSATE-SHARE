import { json } from '@/lib/server/http';

export const GET = () => json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
