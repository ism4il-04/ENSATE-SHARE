import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Local tooling talks to the Neon *dev* branch only; production credentials live in Vercel
config({ path: ['.env.local', '.env.development.local'] }); // first file wins

// Versioned SQL migrations committed in drizzle/ (generate + migrate), never `push`
export default defineConfig({
    schema: './lib/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    casing: 'snake_case',
    verbose: true,
    strict: true,
});
