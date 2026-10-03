import { NextRequest, NextResponse } from 'next/server';

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF guard for the API: a request that changes something must come from this site.
 * Browsers always send Origin on cross-site POST/PUT/DELETE, so a foreign Origin is refused;
 * bodies must be JSON, which an HTML form on another site can't send without a CORS preflight.
 * Requests without Origin (scripts, cron) are left to the routes' own session checks.
 */
export function middleware(req: NextRequest) {
    if (!STATE_CHANGING.has(req.method)) return NextResponse.next();

    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) {
        return NextResponse.json({ success: false, message: 'Origine non autorisée' }, { status: 403 });
    }

    // Body-less requests (logout, deletions) carry no content type
    const hasBody = (req.headers.get('content-length') ?? '0') !== '0' || req.headers.has('transfer-encoding');
    const type = req.headers.get('content-type') ?? '';
    if (hasBody && !type.toLowerCase().startsWith('application/json')) {
        return NextResponse.json({ success: false, message: 'Le corps de la requête doit être du JSON' }, { status: 415 });
    }

    return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
