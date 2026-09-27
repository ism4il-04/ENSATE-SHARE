import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export const fail = (status: number, message: string) => NextResponse.json({ success: false, message }, { status });

// Request body as a plain object (never throws; invalid JSON becomes {})
export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
    try {
        const body = await req.json();
        return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
    } catch {
        return {};
    }
}

// Client IP as reported by Vercel's proxy (not spoofable there); "unknown" locally
export const clientIp = (req: NextRequest): string =>
    req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

// Wraps a route handler so an unexpected error becomes a generic 500 (details only in server logs)
export function handler<Args extends unknown[]>(
    fn: (...args: Args) => Promise<Response>,
    message = 'Erreur serveur'
): (...args: Args) => Promise<Response> {
    return async (...args: Args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(error);
            return fail(500, message);
        }
    };
}
