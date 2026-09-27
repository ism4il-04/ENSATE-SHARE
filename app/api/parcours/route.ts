import { count, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, savedParcours } from '@/lib/db';
import { requireLogin } from '@/lib/server/auth';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { getSavedParcours, invalidateSavedParcours, MAX_SAVED_PARCOURS } from '@/lib/server/parcours';
import { findSemesterByNames } from '@/lib/server/structure';
import { isNonEmptyString } from '@/lib/server/validation';

// The signed-in user's saved parcours
export const GET = handler(async (req: NextRequest) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;
    return json({ success: true, max: MAX_SAVED_PARCOURS, parcours: await getSavedParcours(auth.id) });
}, 'Error fetching saved parcours');

// Save a parcours (cycle + filière + year + semester), at most 6
export const POST = handler(async (req: NextRequest) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;

    const { cycle, filiere, year, semester } = await readBody(req);
    if ((cycle !== 'CP' && cycle !== 'CI') || ![filiere, year, semester].every((v) => isNonEmptyString(v))) {
        return fail(400, 'Parcours invalide');
    }

    // Only parcours that exist in the academic structure can be saved
    const target = await findSemesterByNames({
        cycle,
        filiere: filiere as string,
        year: year as string,
        semester: semester as string,
    });
    if (!target) return fail(400, "Ce parcours n'existe pas");

    const current = await getSavedParcours(auth.id);
    if (current.some((p) => p.id === String(target.semesterId))) {
        return json({ success: true, parcours: current });
    }

    const [{ n }] = await db.select({ n: count() }).from(savedParcours).where(eq(savedParcours.userId, auth.id));
    if (n >= MAX_SAVED_PARCOURS) {
        return fail(400, `Vous pouvez enregistrer au maximum ${MAX_SAVED_PARCOURS} parcours`);
    }

    await db.insert(savedParcours).values({ userId: auth.id, semesterId: target.semesterId }).onConflictDoNothing();
    invalidateSavedParcours(auth.id);
    return json({ success: true, parcours: await getSavedParcours(auth.id) }, 201);
}, 'Error saving parcours');
