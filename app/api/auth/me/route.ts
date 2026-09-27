import { NextRequest } from 'next/server';
import { handler, json } from '@/lib/server/http';
import { getAuthUser, publicUser } from '@/lib/server/session';

// Current user, or user: null when there is no valid session (never an error)
export const GET = handler(async (req: NextRequest) => {
    const user = await getAuthUser(req);
    return json({ success: true, user: user ? publicUser(user) : null });
});
