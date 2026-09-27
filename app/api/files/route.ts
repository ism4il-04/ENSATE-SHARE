import { NextRequest } from 'next/server';
import { requireLogin } from '@/lib/server/auth';
import { listFiles } from '@/lib/server/files';
import { handler, json } from '@/lib/server/http';

const FILE_CATEGORIES = ['Cours', 'TD', 'TP', 'EXAM', 'Autre'];

// Documents list (any signed-in user). ?scope=mine: a responsable's own year/filière (dashboard).
export const GET = handler(async (req: NextRequest) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;

    const q = req.nextUrl.searchParams;
    const text = (name: string, max = 200) => {
        const v = q.get(name);
        return v && v.length <= max ? v : undefined;
    };
    const category = text('fileCategory');

    const mine = auth.role === 'responsable' && q.get('scope') === 'mine';
    const filters = {
        year: text('year'),
        filiere: text('filiere'),
        semester: text('semester'),
        module: text('module'),
        fileCategory: category && FILE_CATEGORIES.includes(category) ? category : undefined,
        search: text('search')?.trim() || undefined,
        uploadedYearId: mine ? auth.assignedYearId ?? -1 : undefined,
        page: Math.max(1, parseInt(q.get('page') ?? '') || 1),
        limit: Math.min(100, Math.max(1, parseInt(q.get('limit') ?? '') || 20)),
    };

    // Public listings come from the cache (the database stays asleep); a responsable's own view doesn't
    return json(await listFiles(filters, { cached: !mine }));
}, 'Error fetching files');
