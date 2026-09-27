import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { db, filieres, savedParcours, semesters, years } from '@/lib/db';

export const MAX_SAVED_PARCOURS = 6;

const tagFor = (userId: string) => `parcours:${userId}`;

async function loadSavedParcours(userId: string) {
    const rows = await db
        .select({ semesterId: semesters.id, cycle: filieres.cycle, filiere: filieres.name, year: years.code, semester: semesters.name })
        .from(savedParcours)
        .innerJoin(semesters, eq(semesters.id, savedParcours.semesterId))
        .innerJoin(years, eq(years.id, semesters.yearId))
        .innerJoin(filieres, eq(filieres.id, years.filiereId))
        .where(eq(savedParcours.userId, userId))
        .orderBy(asc(savedParcours.createdAt));
    return rows.map((r) => ({ id: String(r.semesterId), cycle: r.cycle, filiere: r.filiere, year: r.year, semester: r.semester }));
}

// Per-user cache: a signed-in student opening the home page doesn't wake the database
export const getSavedParcours = (userId: string) =>
    unstable_cache(() => loadSavedParcours(userId), ['saved-parcours', userId], { tags: [tagFor(userId), 'structure'] })();

export const invalidateSavedParcours = (userId: string) => revalidateTag(tagFor(userId));
