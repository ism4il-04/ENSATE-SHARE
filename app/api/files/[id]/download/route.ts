import { NextRequest, NextResponse } from 'next/server';
import { requireLogin } from '@/lib/server/auth';
import { getCachedFileRow } from '@/lib/server/files';
import { fail, handler } from '@/lib/server/http';
import { isUuid } from '@/lib/server/validation';

// Redirects to the Google Drive download link (the file itself never goes through our server)
export const GET = handler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireLogin(req);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const file = isUuid(id) ? await getCachedFileRow(id) : null;
    if (!file) return fail(404, 'File not found');

    const target = file.webContentLink || file.webViewLink;
    if (!target) return fail(404, 'File URL not found');
    return NextResponse.redirect(target);
}, 'Error downloading file');
