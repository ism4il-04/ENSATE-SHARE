import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { findYear } from '@/lib/server/structure';
import { invalidateStudentAccess } from '@/lib/server/student-access';
import { getResponsable, listResponsables } from '@/lib/server/users';
import { isNonEmptyString, isValidEmail } from '@/lib/server/validation';

// All responsables (superadmin)
export const GET = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;
    const list = await listResponsables();
    return json({ success: true, count: list.length, users: list });
}, 'Error fetching users');

// Create a responsable: signs in with Google using this email, no password
export const POST = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const { email, firstName, lastName, assignedYear, assignedFiliere } = await readBody(req);
    if (![firstName, lastName, assignedYear, assignedFiliere].every((v) => isNonEmptyString(v)) || !isValidEmail(email)) {
        return fail(400, 'Tous les champs sont requis (avec une adresse email valide)');
    }

    const year = await findYear((assignedYear as string).trim(), (assignedFiliere as string).trim());
    if (!year) return fail(400, "Cette année n'existe pas dans cette filière");

    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, normalizedEmail));
    if (existing && existing.role !== 'student') {
        return fail(400, 'Cette adresse est déjà utilisée par un autre responsable ou administrateur');
    }

    const values = {
        role: 'responsable' as const,
        firstName: (firstName as string).trim(),
        lastName: (lastName as string).trim(),
        assignedYearId: year.id,
        isActive: true,
        updatedAt: new Date(),
    };

    // A student who already signed in with this address becomes the responsable (saved parcours kept)
    const [saved] = existing
        ? await db.update(users).set(values).where(eq(users.id, existing.id)).returning({ id: users.id })
        : await db.insert(users).values({ ...values, email: normalizedEmail }).returning({ id: users.id });
    if (existing) invalidateStudentAccess();

    await logActivity({
        userId: auth.id,
        action: 'USER_CREATE',
        targetType: 'User',
        targetId: saved.id,
        details: { email: normalizedEmail, assignedYear: year.code, assignedFiliere: year.filiere, ...(existing && { promotedFromStudent: true }) },
    });

    return json(
        {
            success: true,
            message: existing ? 'Le compte étudiant existant a été converti en responsable' : 'Responsable créé',
            user: await getResponsable(saved.id),
        },
        201
    );
}, 'Erreur lors de la création du responsable');
