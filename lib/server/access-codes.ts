import 'server-only';
import { randomInt } from 'crypto';
import { and, eq, gt, lte } from 'drizzle-orm';
import { accessCodes, db } from '@/lib/db';
import { invalidateStudentAccess } from './student-access';

// No 0/O or 1/I, so a code read aloud or typed from a photo isn't ambiguous
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '');

export const generateCode = (prefix = 'ENSA') =>
    `${prefix}-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;

export async function hasActiveCode(): Promise<boolean> {
    const [row] = await db.select({ id: accessCodes.id }).from(accessCodes).where(gt(accessCodes.expiresAt, new Date())).limit(1);
    return !!row;
}

// The active (not expired) code matching what the student typed, or null
export async function findActiveCode(input: string) {
    const [row] = await db
        .select()
        .from(accessCodes)
        .where(and(eq(accessCodes.code, normalizeCode(input)), gt(accessCodes.expiresAt, new Date())));
    return row ?? null;
}

// Daily cron: expired codes are deleted, and with them the temporary accounts they created
export async function deleteExpiredCodes(): Promise<number> {
    const deleted = await db.delete(accessCodes).where(lte(accessCodes.expiresAt, new Date())).returning({ id: accessCodes.id });
    if (deleted.length) invalidateStudentAccess();
    return deleted.length;
}
