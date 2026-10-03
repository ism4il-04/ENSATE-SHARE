import { asc, count, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { accessCodes, db, users } from '@/lib/db';
import { generateCode, normalizeCode } from '@/lib/server/access-codes';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { isNonEmptyString } from '@/lib/server/validation';

const MAX_DAYS = 365;

// Access codes with the number of temporary accounts each created (superadmin)
export const GET = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const rows = await db
        .select({
            id: accessCodes.id,
            code: accessCodes.code,
            label: accessCodes.label,
            expiresAt: accessCodes.expiresAt,
            createdAt: accessCodes.createdAt,
            accounts: count(users.id),
        })
        .from(accessCodes)
        .leftJoin(users, eq(users.accessCodeId, accessCodes.id))
        .groupBy(accessCodes.id)
        .orderBy(asc(accessCodes.expiresAt));

    return json({ success: true, codes: rows.map((r) => ({ ...r, active: r.expiresAt.getTime() > Date.now() })) });
}, 'Erreur lors du chargement des codes');

// Create a code: { label, expiresAt (date), code? } (superadmin)
export const POST = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const { label, expiresAt, code } = await readBody(req);
    if (!isNonEmptyString(label, 100)) return fail(400, 'Indiquez un libellé (ex. « 1re année 2026-2027 »)');

    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : null;
    if (!expiry || Number.isNaN(expiry.getTime())) return fail(400, "Date d'expiration invalide");
    if (expiry.getTime() <= Date.now()) return fail(400, "La date d'expiration doit être dans le futur");
    if (expiry.getTime() > Date.now() + MAX_DAYS * 24 * 60 * 60 * 1000) return fail(400, `Durée maximale : ${MAX_DAYS} jours`);

    const value = code === undefined || code === '' ? generateCode() : isNonEmptyString(code, 40) ? normalizeCode(code) : '';
    if (!/^[A-Z0-9-]{8,40}$/.test(value)) return fail(400, 'Le code doit contenir au moins 8 lettres, chiffres ou tirets');

    const [created] = await db
        .insert(accessCodes)
        .values({ code: value, label: label.trim(), expiresAt: expiry })
        .onConflictDoNothing({ target: accessCodes.code })
        .returning();
    if (!created) return fail(400, 'Ce code existe déjà');

    await logActivity({ userId: auth.id, action: 'ACCESS_CODE_CREATE', details: { label: created.label, expiresAt: created.expiresAt } });
    return json({ success: true, code: { ...created, accounts: 0, active: true } }, 201);
}, 'Erreur lors de la création du code');
