/**
 * Applies the SQL migrations in drizzle/ to the target database.
 *   npm run db:migrate                      → Neon dev branch
 *   TARGET_DATABASE_URL=… npm run db:migrate -- --production
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { resolveTarget } from './db-target';

(async () => {
    const { url } = resolveTarget(process.argv);
    await migrate(drizzle(neon(url)), { migrationsFolder: 'drizzle' });
    console.log('Migrations applied.');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
