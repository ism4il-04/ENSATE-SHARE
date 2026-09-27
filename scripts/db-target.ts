import { config } from 'dotenv';

/**
 * Database target for command-line scripts.
 *
 * By default scripts use the Neon *dev* branch from .env.local (or .env.development.local).
 * Targeting another database (production on switch day) requires passing its URL
 * explicitly as TARGET_DATABASE_URL *and* the --production flag, so it can't happen by accident.
 */
export function resolveTarget(argv: string[]): { url: string; host: string; production: boolean } {
    const production = argv.includes('--production');

    let url: string | undefined;
    if (production) {
        url = process.env.TARGET_DATABASE_URL;
        if (!url) throw new Error('--production needs TARGET_DATABASE_URL set in the shell environment');
    } else {
        config({ path: ['.env.local', '.env.development.local'] });
        url = process.env.DATABASE_URL;
        if (!url) throw new Error('DATABASE_URL missing from .env.local (Neon dev branch)');
    }

    const host = new URL(url).host;
    console.log(`Target database: ${host}${production ? '  [PRODUCTION]' : '  [dev]'}`);
    return { url, host, production };
}
