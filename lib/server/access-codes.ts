import 'server-only';
import { randomInt } from 'crypto';
import { and, eq, gt, gte, inArray, lt, lte, or, sql } from 'drizzle-orm';
import { accessCodes, codeAttempts, db } from '@/lib/db';
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

// Brute-force limit on codes: 5 wrong codes per Google account, 20 per IP, within 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;
const attemptKeys = (ip: string, email: string) => [`ip:${ip}`, `email:${email}`];

// Seconds until the caller may try a code again, or 0
export async function getCodeAttemptBlock(ip: string, email: string): Promise<number> {
    const [ipKey, emailKey] = attemptKeys(ip, email);
    const blocked = await db
        .select({ expiresAt: codeAttempts.expiresAt })
        .from(codeAttempts)
        .where(
            and(
                gt(codeAttempts.expiresAt, new Date()),
                or(
                    and(eq(codeAttempts.key, ipKey), gte(codeAttempts.count, MAX_PER_IP)),
                    and(eq(codeAttempts.key, emailKey), gte(codeAttempts.count, MAX_PER_EMAIL))
                )
            )
        );
    const latest = Math.max(0, ...blocked.map((b) => b.expiresAt.getTime()));
    return latest ? Math.ceil((latest - Date.now()) / 1000) : 0;
}

// One atomic upsert per key; an expired window restarts at 1
export async function recordWrongCode(ip: string, email: string): Promise<void> {
    const expiresAt = new Date(Date.now() + ATTEMPT_WINDOW_MS);
    await db
        .insert(codeAttempts)
        .values(attemptKeys(ip, email).map((key) => ({ key, count: 1, expiresAt })))
        .onConflictDoUpdate({
            target: codeAttempts.key,
            set: {
                count: sql`case when ${codeAttempts.expiresAt} < now() then 1 else ${codeAttempts.count} + 1 end`,
                expiresAt: sql`case when ${codeAttempts.expiresAt} < now() then excluded.expires_at else ${codeAttempts.expiresAt} end`,
            },
        });
}

export async function clearCodeAttempts(email: string): Promise<void> {
    await db.delete(codeAttempts).where(inArray(codeAttempts.key, [`email:${email}`]));
}

// Daily cron
export async function purgeExpiredCodeAttempts(): Promise<void> {
    await db.delete(codeAttempts).where(lt(codeAttempts.expiresAt, new Date()));
}

