import 'server-only';

import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

export * from './schema';

// Use Neon's *pooled* connection string (host ends in "-pooler"): every serverless
// invocation connects, and a direct connection runs out of slots during a rush.
const databaseUrl = (): string => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set (Neon pooled connection string)');
    return url;
};

const createHttpClient = () => drizzle(neon(databaseUrl()), { schema, casing: 'snake_case' });
let httpClient: ReturnType<typeof createHttpClient> | null = null;

/**
 * Everyday client: one HTTP request per query, no connection to keep open.
 * Lazy, so importing it at build time (without DATABASE_URL) doesn't fail.
 */
export const db = new Proxy({} as ReturnType<typeof createHttpClient>, {
    get(_target, property, receiver) {
        httpClient ??= createHttpClient();
        return Reflect.get(httpClient, property, receiver);
    },
});

type WsDb = ReturnType<typeof drizzleWs<typeof schema>>;
export type Tx = Parameters<Parameters<WsDb['transaction']>[0]>[0];

/**
 * Interactive transaction (read, decide in code, then write, all-or-nothing) over a
 * dedicated WebSocket connection, always closed afterwards. Only where it matters:
 * the HTTP client can't hold a transaction open between queries.
 */
export async function inTransaction<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    // Node 22 has a global WebSocket; the Neon driver needs to be pointed at it outside Edge
    if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') {
        neonConfig.webSocketConstructor = WebSocket;
    }
    const pool = new Pool({ connectionString: databaseUrl() });
    try {
        return await drizzleWs(pool, { schema, casing: 'snake_case' }).transaction(work);
    } finally {
        await pool.end();
    }
}
