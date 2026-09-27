import { inArray } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { db, studentAllowlist } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { invalidateStudentAccess, isStudentDomainEmail } from '@/lib/server/student-access';
import { isValidEmail } from '@/lib/server/validation';

const MAX_IMPORT_BATCH = 1000;

// Add emails to the student allowlist (the page sends large lists in batches of 1000)
export const POST = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    const { emails } = await readBody(req);
    if (!Array.isArray(emails) || emails.length === 0 || emails.length > MAX_IMPORT_BATCH) {
        return fail(400, `Envoyez entre 1 et ${MAX_IMPORT_BATCH} adresses à la fois`);
    }

    const valid = new Set<string>();
    const invalid: string[] = [];
    for (const raw of emails) {
        const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
        if (isValidEmail(email) && isStudentDomainEmail(email)) valid.add(email);
        else if (email) invalid.push(email.slice(0, 100));
    }

    const existing = valid.size
        ? (await db.select({ email: studentAllowlist.email }).from(studentAllowlist).where(inArray(studentAllowlist.email, [...valid]))).map((r) => r.email)
        : [];
    const toInsert = [...valid].filter((e) => !existing.includes(e));

    if (toInsert.length) {
        await db.insert(studentAllowlist).values(toInsert.map((email) => ({ email }))).onConflictDoNothing();
        invalidateStudentAccess();
        await logActivity({ userId: auth.id, action: 'STUDENT_LIST_IMPORT', details: { added: toInsert.length } });
    }

    return json({
        success: true,
        added: toInsert.length,
        alreadyPresent: existing.length,
        invalidCount: invalid.length,
        invalid: invalid.slice(0, 20),
    });
}, "Erreur lors de l'import");
