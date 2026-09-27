import { NextRequest } from 'next/server';
import { requireSuperadmin } from '@/lib/server/auth';
import { filesGroupedBy } from '@/lib/server/files';
import { handler, json } from '@/lib/server/http';

export const GET = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;
    return json({ success: true, distribution: await filesGroupedBy('filiere') });
}, 'Error fetching files distribution');
