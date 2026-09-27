import bcrypt from 'bcryptjs';
import { and, eq, ne } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { requireLogin } from '@/lib/server/auth';
import { FILES_TAG } from '@/lib/server/files';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { loadUser, publicUser, sessionIsPersistent, setSessionCookie } from '@/lib/server/session';
import { checkPasswordStrength, isNonEmptyString, isValidEmail } from '@/lib/server/validation';

// Own profile: names (everyone), email (superadmin), password (accounts that have one)
export const PUT = handler(async (req: NextRequest) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;

    const [account] = await db.select().from(users).where(eq(users.id, auth.id));
    if (!account) return fail(404, 'User not found');

    const { firstName, lastName, email, currentPassword, newPassword } = await readBody(req);
    const emailChanged =
        auth.role === 'superadmin' &&
        email !== undefined &&
        email !== '' &&
        (typeof email !== 'string' || email.trim().toLowerCase() !== account.email);

    // Changing the password or the email requires the current password (when the account has one)
    if (newPassword || (emailChanged && account.passwordHash)) {
        if (!account.passwordHash) return fail(400, 'Ce compte se connecte avec Google et n’a pas de mot de passe');
        if (!isNonEmptyString(currentPassword, 128)) return fail(400, 'Le mot de passe actuel est requis');
        if (!(await bcrypt.compare(currentPassword, account.passwordHash))) {
            return fail(400, 'Mot de passe actuel incorrect');
        }
    }

    const changes: Partial<typeof users.$inferInsert> = {};

    if (newPassword) {
        const passwordError = checkPasswordStrength(newPassword);
        if (passwordError) return fail(400, passwordError);
        changes.passwordHash = await bcrypt.hash(newPassword as string, 10);
        changes.passwordChangedAt = new Date();
    }

    for (const [field, value] of [['firstName', firstName], ['lastName', lastName]] as const) {
        if (value === undefined || value === '') continue;
        if (!isNonEmptyString(value, 100)) return fail(400, 'Nom ou prénom invalide');
        changes[field] = value.trim();
    }

    if (emailChanged) {
        if (!isValidEmail(email)) return fail(400, 'Email invalide');
        const normalizedEmail = email.trim().toLowerCase();
        const [taken] = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.email, normalizedEmail), ne(users.id, account.id)));
        if (taken) return fail(400, 'Cet email est déjà utilisé');
        changes.email = normalizedEmail;
    }

    if (Object.keys(changes).length > 0) {
        await db.update(users).set({ ...changes, updatedAt: new Date() }).where(eq(users.id, account.id));
        if (changes.firstName || changes.lastName) revalidateTag(FILES_TAG); // uploader names on file lists
    }

    const user = (await loadUser(account.id))!;
    const res = json({ success: true, message: 'Profil mis à jour', user: publicUser(user) });

    // A password change ends older sessions, so issue a fresh one for this browser
    if (newPassword) await setSessionCookie(res, user, await sessionIsPersistent(req));
    return res;
}, 'Erreur serveur');
