import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { accessCodes, db } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { fail, handler, json } from '@/lib/server/http';
import { invalidateStudentAccess } from '@/lib/server/student-access';

// Delete a code: the temporary accounts it created are deleted with it and lose access at once
export const DELETE = handler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) return fail(404, 'Code introuvable');

    const [deleted] = await db.delete(accessCodes).where(eq(accessCodes.id, id)).returning();
    if (!deleted) return fail(404, 'Code introuvable');

    invalidateStudentAccess();
    await logActivity({ userId: auth.id, action: 'ACCESS_CODE_DELETE', details: { label: deleted.label } });
    return json({ success: true });
}, 'Erreur lors de la suppression du code');
