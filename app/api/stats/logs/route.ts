import { count, desc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { activityLogs, db, users } from '@/lib/db';
import { requireSuperadmin } from '@/lib/server/auth';
import { handler, json } from '@/lib/server/http';

// Activity log, newest first, optionally filtered by action (superadmin)
export const GET = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const q = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(q.get('page') ?? '') || 1);
    const limit = Math.min(200, Math.max(1, parseInt(q.get('limit') ?? '') || 50));
    const action = q.get('action');
    const where = action ? eq(activityLogs.action, action.slice(0, 50)) : undefined;

    const [rows, [{ total }]] = await Promise.all([
        db
            .select({
                id: activityLogs.id,
                action: activityLogs.action,
                targetType: activityLogs.targetType,
                targetId: activityLogs.targetId,
                details: activityLogs.details,
                createdAt: activityLogs.createdAt,
                userId: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            })
            .from(activityLogs)
            .leftJoin(users, eq(users.id, activityLogs.userId))
            .where(where)
            .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))
            .limit(limit)
            .offset((page - 1) * limit),
        db.select({ total: count() }).from(activityLogs).where(where),
    ]);

    // Same shape as before: userId is the populated user (or null), timestamp is the date
    const logs = rows.map((r) => ({
        _id: String(r.id),
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        details: r.details,
        timestamp: r.createdAt,
        userId: r.userId ? { _id: r.userId, firstName: r.firstName, lastName: r.lastName, email: r.email } : null,
    }));

    return json({ success: true, count: logs.length, total, page, pages: Math.ceil(total / limit), logs });
}, 'Error fetching activity logs');
