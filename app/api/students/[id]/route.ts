import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, studentAllowlist } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { fail, handler, json } from '@/lib/server/http';
import { invalidateStudentAccess } from '@/lib/server/student-access';

// Remove one email from the student allowlist (id = the email); access ends on the student's next request
export const DELETE = handler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const email = decodeURIComponent((await params).id).toLowerCase();
    const [removed] = await db.delete(studentAllowlist).where(eq(studentAllowlist.email, email)).returning();
    if (!removed) return fail(404, 'Adresse introuvable');

    invalidateStudentAccess();
    await logActivity({ userId: auth.id, action: 'STUDENT_LIST_DELETE', details: { email } });
    return json({ success: true });
}, 'Erreur lors de la suppression');
