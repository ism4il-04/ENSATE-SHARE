import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, savedParcours } from '@/lib/db';
import { requireLogin } from '@/lib/server/auth';
import { handler, json } from '@/lib/server/http';
import { getSavedParcours, invalidateSavedParcours } from '@/lib/server/parcours';

// Remove one of the signed-in user's saved parcours (id = semester id)
export const DELETE = handler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;

    const semesterId = Number((await params).id);
    if (Number.isInteger(semesterId) && semesterId > 0) {
        await db
            .delete(savedParcours)
            .where(and(eq(savedParcours.userId, auth.id), eq(savedParcours.semesterId, semesterId)));
        invalidateSavedParcours(auth.id);
    }
    return json({ success: true, parcours: await getSavedParcours(auth.id) });
}, 'Error removing parcours');
