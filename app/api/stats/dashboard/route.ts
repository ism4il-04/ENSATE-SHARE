import { count, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { requireSuperadmin } from '@/lib/server/auth';
import { fileStats } from '@/lib/server/files';
import { handler, json } from '@/lib/server/http';

export const GET = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const [stats, [{ totalResponsables }]] = await Promise.all([
        fileStats(),
        db.select({ totalResponsables: count() }).from(users).where(eq(users.role, 'responsable')),
    ]);
    return json({ success: true, stats: { ...stats, totalResponsables } });
}, 'Error fetching dashboard statistics');
