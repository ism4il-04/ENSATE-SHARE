import 'server-only';
import { and, eq, gt, gte, inArray, lt, or, sql } from 'drizzle-orm';
import { db, loginAttempts } from '@/lib/db';

// Failed password logins: 5 per email, 20 per IP, within 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

const keysFor = (ip: string, email: string) => ({ ipKey: `ip:${ip}`, emailKey: `email:${email}` });

// Seconds until the caller may retry, or 0 if not blocked
export async function getLoginBlock(ip: string, email: string): Promise<number> {
    const { ipKey, emailKey } = keysFor(ip, email);
    const blocked = await db
        .select({ expiresAt: loginAttempts.expiresAt })
        .from(loginAttempts)
        .where(
            and(
                gt(loginAttempts.expiresAt, new Date()),
                or(
                    and(eq(loginAttempts.key, ipKey), gte(loginAttempts.count, MAX_PER_IP)),
                    and(eq(loginAttempts.key, emailKey), gte(loginAttempts.count, MAX_PER_EMAIL))
                )
            )
        );
    const latest = Math.max(0, ...blocked.map((b) => b.expiresAt.getTime()));
    return latest ? Math.ceil((latest - Date.now()) / 1000) : 0;
}

// Single atomic upsert per key; an expired window restarts at 1
export async function recordLoginFailure(ip: string, email: string): Promise<void> {
    const { ipKey, emailKey } = keysFor(ip, email);
    const expiresAt = new Date(Date.now() + WINDOW_MS);
    await db
        .insert(loginAttempts)
        .values([
            { key: ipKey, count: 1, expiresAt },
            { key: emailKey, count: 1, expiresAt },
        ])
        .onConflictDoUpdate({
            target: loginAttempts.key,
            set: {
                count: sql`case when ${loginAttempts.expiresAt} < now() then 1 else ${loginAttempts.count} + 1 end`,
                expiresAt: sql`case when ${loginAttempts.expiresAt} < now() then excluded.expires_at else ${loginAttempts.expiresAt} end`,
            },
        });
}

export async function clearLoginFailures(email: string): Promise<void> {
    await db.delete(loginAttempts).where(inArray(loginAttempts.key, [`email:${email}`]));
}

// Called by the daily cron
export async function purgeExpiredLoginAttempts(): Promise<void> {
    await db.delete(loginAttempts).where(lt(loginAttempts.expiresAt, new Date()));
}
