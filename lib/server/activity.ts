import 'server-only';
import { activityLogs, db } from '@/lib/db';

// Audit trail shown on the admin Logs page (never put passwords in `details`)
export async function logActivity(entry: {
    userId: string | null;
    action: string;
    targetType?: 'File' | 'User' | 'AcademicStructure';
    targetId?: string;
    details?: unknown;
}): Promise<void> {
    await db.insert(activityLogs).values({
        userId: entry.userId,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        details: entry.details ?? null,
    });
}
