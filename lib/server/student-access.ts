import 'server-only';
import { and, eq } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { accessCodes, db, studentAllowlist, users } from '@/lib/db';

// University Google Workspace domain whose accounts may sign in as students
export const STUDENT_EMAIL_DOMAIN = 'etu.uae.ac.ma';

export const isStudentDomainEmail = (email: string): boolean => email.endsWith(`@${STUDENT_EMAIL_DOMAIN}`);

// `hd` is set by Google only for Workspace accounts of that domain, so a personal Google
// account can't pass for a student address.
export const isStudentGoogleAccount = (email: string, hostedDomain?: string): boolean =>
    isStudentDomainEmail(email) && hostedDomain === STUDENT_EMAIL_DOMAIN;

const STUDENT_ACCESS_TAG = 'student-access';

/**
 * Who may use a student session, kept in the Next.js data cache so student requests don't
 * touch the database: the active student accounts and, when the list is in use, the allowed
 * emails. Cleared (and reloaded once) whenever the student list or a student account changes
 * (created, converted, merged, deactivated), so removals apply on the very next request.
 */
const getStudentAccessSnapshot = unstable_cache(
    async () => {
        const allowed = await db.select({ email: studentAllowlist.email }).from(studentAllowlist);
        const active = await db
            .select({ id: users.id, guestUntil: accessCodes.expiresAt })
            .from(users)
            .leftJoin(accessCodes, eq(accessCodes.id, users.accessCodeId))
            .where(and(eq(users.role, 'student'), eq(users.isActive, true)));
        return {
            enforced: allowed.length > 0,
            allowedEmails: allowed.map((a) => a.email),
            activeStudentIds: active.map((a) => a.id),
            // Temporary accounts (access code) and when their code expires
            guestExpiries: Object.fromEntries(
                active.filter((a) => a.guestUntil).map((a) => [a.id, a.guestUntil!.toISOString()])
            ) as Record<string, string>,
        };
    },
    [STUDENT_ACCESS_TAG],
    { tags: [STUDENT_ACCESS_TAG] }
);

export const invalidateStudentAccess = () => revalidateTag(STUDENT_ACCESS_TAG);

// Empty list: every student-domain account; otherwise only listed emails.
// With a userId, the student account must also still exist and be active; a temporary account
// (access code) is allowed until its code expires, whatever the student list says.
export async function isStudentAllowed(email: string, userId?: string): Promise<boolean> {
    const snapshot = await getStudentAccessSnapshot();
    if (userId) {
        if (!snapshot.activeStudentIds.includes(userId)) return false;
        const guestUntil = snapshot.guestExpiries[userId];
        if (guestUntil) return new Date(guestUntil).getTime() > Date.now();
    }
    return !snapshot.enforced || snapshot.allowedEmails.includes(email.toLowerCase());
}
