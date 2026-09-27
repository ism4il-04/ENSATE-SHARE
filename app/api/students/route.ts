import { and, asc, count, eq, ilike, isNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, studentAllowlist, users } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { fail, handler, json } from '@/lib/server/http';
import { invalidateStudentAccess, STUDENT_EMAIL_DOMAIN } from '@/lib/server/student-access';
import { escapeLike } from '@/lib/server/validation';

const PAGE_SIZE = 50;

// Student allowlist overview: status, one page of entries with their account (superadmin)
export const GET = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const q = req.nextUrl.searchParams;
    const search = (q.get('search') ?? '').trim().toLowerCase().slice(0, 100);
    const page = Math.max(1, parseInt(q.get('page') ?? '') || 1);
    const filter = search ? ilike(studentAllowlist.email, `%${escapeLike(search)}%`) : undefined;

    const [[{ total }], [{ allowlistCount }], [{ registeredStudents }], [{ outside }], entries] = await Promise.all([
        db.select({ total: count() }).from(studentAllowlist).where(filter),
        db.select({ allowlistCount: count() }).from(studentAllowlist),
        db.select({ registeredStudents: count() }).from(users).where(eq(users.role, 'student')),
        // Student accounts not on the list: blocked while the list is active
        db
            .select({ outside: count() })
            .from(users)
            .leftJoin(studentAllowlist, eq(studentAllowlist.email, users.email))
            .where(and(eq(users.role, 'student'), isNull(studentAllowlist.email))),
        db
            .select({
                email: studentAllowlist.email,
                addedAt: studentAllowlist.createdAt,
                firstName: users.firstName,
                lastName: users.lastName,
                lastLoginAt: users.lastLoginAt,
                isActive: users.isActive,
                role: users.role,
            })
            .from(studentAllowlist)
            .leftJoin(users, eq(users.email, studentAllowlist.email))
            .where(filter)
            .orderBy(asc(studentAllowlist.email))
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),
    ]);

    return json({
        success: true,
        domain: STUDENT_EMAIL_DOMAIN,
        enforced: allowlistCount > 0,
        allowlistCount,
        registeredStudents,
        registeredOutsideList: allowlistCount > 0 ? outside : 0,
        total,
        page,
        pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        entries: entries.map((e) => ({
            id: e.email,
            email: e.email,
            addedAt: e.addedAt,
            account:
                e.role === 'student'
                    ? { firstName: e.firstName, lastName: e.lastName, lastLoginAt: e.lastLoginAt, isActive: e.isActive }
                    : null,
        })),
    });
}, 'Error fetching student list');

// Empty the list: every @etu.uae.ac.ma account is allowed again (?all=true required)
export const DELETE = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;
    if (req.nextUrl.searchParams.get('all') !== 'true') return fail(400, 'Confirmation manquante');

    const deleted = await db.delete(studentAllowlist).returning({ email: studentAllowlist.email });
    invalidateStudentAccess();
    await logActivity({ userId: auth.id, action: 'STUDENT_LIST_DELETE', details: { all: true, deleted: deleted.length } });

    return json({ success: true, deleted: deleted.length });
}, 'Erreur lors de la suppression');
