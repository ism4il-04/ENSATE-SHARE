import { and, count, eq, ne } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { db, inTransaction, savedParcours, users } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { FILES_TAG } from '@/lib/server/files';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { invalidateSavedParcours, MAX_SAVED_PARCOURS } from '@/lib/server/parcours';
import { findYear } from '@/lib/server/structure';
import { invalidateStudentAccess } from '@/lib/server/student-access';
import { getResponsable } from '@/lib/server/users';
import { isNonEmptyString, isUuid, isValidEmail } from '@/lib/server/validation';

type Params = { params: Promise<{ id: string }> };

class UserError extends Error {}

// Update a responsable (superadmin)
export const PUT = handler(async (req: NextRequest, { params }: Params) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const [user] = isUuid(id) ? await db.select().from(users).where(eq(users.id, id)) : [];
    if (!user) return fail(404, 'Utilisateur introuvable');
    if (user.role !== 'responsable') return fail(400, 'Seuls les comptes responsables peuvent être modifiés ici');

    const { email, firstName, lastName, assignedYear, assignedFiliere, isActive } = await readBody(req);
    const changes: Partial<typeof users.$inferInsert> = {};

    for (const [field, value] of [['firstName', firstName], ['lastName', lastName]] as const) {
        if (value === undefined || value === '') continue;
        if (!isNonEmptyString(value)) return fail(400, `Champ invalide : ${field}`);
        changes[field] = value.trim();
    }

    if ((assignedYear !== undefined && assignedYear !== '') || (assignedFiliere !== undefined && assignedFiliere !== '')) {
        if (!isNonEmptyString(assignedYear)) return fail(400, 'Année invalide');
        const year = await findYear(assignedYear.trim(), isNonEmptyString(assignedFiliere) ? assignedFiliere.trim() : undefined);
        if (!year) return fail(400, "Cette année n'existe pas dans cette filière");
        changes.assignedYearId = year.id;
    }

    if (typeof isActive !== 'undefined') {
        if (typeof isActive !== 'boolean') return fail(400, 'Statut invalide');
        changes.isActive = isActive;
    }

    let newEmail: string | null = null;
    if (email !== undefined && email !== '') {
        if (!isValidEmail(email)) return fail(400, 'Adresse email invalide');
        const normalized = email.trim().toLowerCase();
        if (normalized !== user.email) {
            newEmail = normalized;
            // New address = new owner: sessions opened with the old address end.
            // The responsable now signs in with Google using the new address.
            changes.email = normalized;
            changes.passwordChangedAt = new Date();
        }
    }

    let mergedStudentId: string | null = null;
    try {
        mergedStudentId = await inTransaction(async (tx) => {
            let absorbed: string | null = null;
            if (newEmail) {
                const [other] = await tx
                    .select({ id: users.id, role: users.role })
                    .from(users)
                    .where(and(eq(users.email, newEmail), ne(users.id, user.id)));
                if (other && other.role !== 'student') {
                    throw new UserError('Cette adresse est déjà utilisée par un autre responsable ou administrateur');
                }
                if (other) {
                    // Same person already signed in as a student: keep their saved parcours, then remove that account
                    const theirs = await tx.select().from(savedParcours).where(eq(savedParcours.userId, other.id));
                    const [{ n }] = await tx.select({ n: count() }).from(savedParcours).where(eq(savedParcours.userId, user.id));
                    const room = Math.max(0, MAX_SAVED_PARCOURS - n);
                    if (theirs.length && room) {
                        await tx
                            .insert(savedParcours)
                            .values(theirs.slice(0, room).map((p) => ({ userId: user.id, semesterId: p.semesterId, createdAt: p.createdAt })))
                            .onConflictDoNothing();
                    }
                    await tx.delete(users).where(eq(users.id, other.id));
                    absorbed = other.id;
                }
            }
            if (Object.keys(changes).length) {
                await tx.update(users).set({ ...changes, updatedAt: new Date() }).where(eq(users.id, user.id));
            }
            return absorbed;
        });
    } catch (error) {
        if (error instanceof UserError) return fail(400, error.message);
        throw error;
    }

    if (changes.firstName || changes.lastName) revalidateTag(FILES_TAG); // uploader names on file lists
    if (mergedStudentId) {
        invalidateStudentAccess();
        invalidateSavedParcours(user.id);
    }

    const updated = await getResponsable(user.id);
    await logActivity({
        userId: auth.id,
        action: 'USER_UPDATE',
        targetType: 'User',
        targetId: user.id,
        details: {
            email: updated?.email,
            firstName: updated?.firstName,
            lastName: updated?.lastName,
            assignedYear: updated?.assignedYear,
            assignedFiliere: updated?.assignedFiliere,
            isActive: updated?.isActive,
            ...(mergedStudentId && { mergedStudentAccount: true }),
        },
    });

    return json({ success: true, message: 'Responsable mis à jour', user: updated });
}, 'Erreur lors de la mise à jour');

// Delete a responsable (superadmin); their files stay, without uploader
export const DELETE = handler(async (req: NextRequest, { params }: Params) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const [user] = isUuid(id) ? await db.select({ id: users.id, role: users.role, email: users.email }).from(users).where(eq(users.id, id)) : [];
    if (!user) return fail(404, 'User not found');
    if (user.role !== 'responsable') return fail(400, 'Can only delete responsable accounts');

    await db.delete(users).where(eq(users.id, id));
    revalidateTag(FILES_TAG);
    await logActivity({ userId: auth.id, action: 'USER_DELETE', targetType: 'User', targetId: id, details: { email: user.email } });

    return json({ success: true, message: 'User deleted successfully' });
}, 'Error deleting user');
