/**
 * Runs during the Vercel build (npm run build): applies pending migrations from drizzle/ to the
 * database in DATABASE_URL, so schema changes reach production with the code that needs them.
 * Does nothing outside Vercel (local builds) or when DATABASE_URL isn't set (e.g. Preview).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

(async () => {
    if (process.env.VERCEL !== '1') {
        console.log('[migrate] not on Vercel: skipped');
        return;
    }
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.log(`[migrate] no DATABASE_URL for ${process.env.VERCEL_ENV ?? 'this'} environment: skipped`);
        return;
    }
    console.log(`[migrate] ${process.env.VERCEL_ENV} -> ${new URL(url).host}`);
    await migrate(drizzle(neon(url)), { migrationsFolder: 'drizzle' });
    console.log('[migrate] up to date');
})().catch((error) => {
    // Fail the build: deploying code that expects a newer schema would break the site
    console.error('[migrate] failed:', error);
    process.exit(1);
});
