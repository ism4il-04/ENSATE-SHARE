import { config } from 'dotenv';

/**
 * Database target for command-line scripts.
 *
 * By default scripts use the Neon *dev* branch from .env.local (or .env.development.local).
 * Targeting another database (production) requires its URL in TARGET_DATABASE_URL *and*
 * DB_TARGET=production (or the --production flag), so it can't happen by accident.
 */
// An option, given as a flag (--production) or as an environment variable (DB_TARGET=production,
// APPLY=1, RESET=1). The variable is the reliable way in PowerShell, where `npm run x -- --flag`
// loses the `--` and npm keeps the flag for itself.
const ENV_OPTIONS: Record<string, [string, string]> = {
    production: ['DB_TARGET', 'production'],
    apply: ['APPLY', '1'],
    reset: ['RESET', '1'],
};

export const hasFlag = (argv: string[], name: string): boolean => {
    const [variable, value] = ENV_OPTIONS[name] ?? [];
    return argv.includes(`--${name}`) || (!!variable && process.env[variable] === value);
};

export function resolveTarget(argv: string[]): { url: string; host: string; production: boolean } {
    const production = hasFlag(argv, 'production');

    let url: string | undefined;
    if (production) {
        url = process.env.TARGET_DATABASE_URL;
        if (!url) throw new Error('Production target needs TARGET_DATABASE_URL set in the shell environment');
    } else {
        config({ path: ['.env.local', '.env.development.local'] });
        url = process.env.DATABASE_URL;
        if (!url) throw new Error('DATABASE_URL missing from .env.local (Neon dev branch)');
    }

    const host = new URL(url).host;
    console.log(`Target database: ${host}${production ? '  [PRODUCTION]' : '  [dev]'}`);
    return { url, host, production };
}
