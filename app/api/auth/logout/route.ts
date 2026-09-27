import { NextRequest } from 'next/server';
import { logActivity } from '@/lib/server/activity';
import { handler, json } from '@/lib/server/http';
import { clearSessionCookie, getAuthUser } from '@/lib/server/session';

export const POST = handler(async (req: NextRequest) => {
    const user = await getAuthUser(req);
    if (user && user.role !== 'student') {
        await logActivity({ userId: user.id, action: 'LOGOUT' });
    }
    const res = json({ success: true, message: 'Logout successful' });
    clearSessionCookie(res);
    return res;
});
