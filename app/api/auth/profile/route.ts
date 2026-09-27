import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { requireLogin } from '@/lib/server/auth';
import { FILES_TAG } from '@/lib/server/files';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { loadUser, publicUser } from '@/lib/server/session';
import { isNonEmptyString } from '@/lib/server/validation';

// Own profile: first and last name. The email is the Google account used to sign in,
// so it's changed by an admin (Users page), not here.
export const PUT = handler(async (req: NextRequest) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;

    const { firstName, lastName } = await readBody(req);
    const changes: Partial<typeof users.$inferInsert> = {};

    for (const [field, value] of [['firstName', firstName], ['lastName', lastName]] as const) {
        if (value === undefined || value === '') continue;
        if (!isNonEmptyString(value, 100)) return fail(400, 'Nom ou prénom invalide');
        changes[field] = value.trim();
    }

    if (Object.keys(changes).length > 0) {
        await db.update(users).set({ ...changes, updatedAt: new Date() }).where(eq(users.id, auth.id));
        revalidateTag(FILES_TAG); // uploader names on file lists
    }

    const user = await loadUser(auth.id);
    if (!user) return fail(404, 'User not found');
    return json({ success: true, message: 'Profil mis à jour', user: publicUser(user) });
}, 'Erreur serveur');
