# Migration plan: Express + MongoDB → Next.js route handlers + Neon Postgres

Status: **draft for review**, branch `neon-migration` (local only, not deployed).

## Goal

Replace the Express backend (wrapped in one Vercel function, `api/[...path].ts`) and MongoDB Atlas with
Next.js route handlers and Neon Postgres (Drizzle), the same stack as ENSATE-DOCS, **without changing
anything users see**. Google Drive storage, Google sign-in, direct uploads and every page stay as they are.

## Principles

1. **Same API contract.** Route handlers live at the same URLs (`/api/files`, `/api/auth/me`, …) and
   return the same JSON shapes (including `_id` fields), so the pages and `lib/api.ts` barely change.
   Rewriting pages as server components is a later, separate step.
2. **Keep the database asleep as much as possible** (Neon Free: 100 CU-hours/month, sleeps after 5 min
   without queries). Student traffic must mostly not touch the database (see "Neon compute budget").
3. **Two Neon branches from day one**: `dev` for local work and scripts, `main` (production) known only to
   Vercel. Seed and migration scripts refuse to run against a host they weren't told about.
4. **Secrets never go through the conversation.** The connection strings are pasted by you into
   `.env.development.local` (a file the assistant never opens) and into Vercel.
5. **Next.js stays on 15.5** (App Router, `middleware.ts`). Next 16 renamed middleware; upgrading is separate.
6. **Versioned SQL migrations** (`drizzle-kit generate`, committed in `drizzle/`), never `push`.

## Database schema (Postgres)

The academic structure, today one nested MongoDB document, becomes real tables, so files and responsables
point to rows instead of repeating names. A module rename then updates one row and every file follows.

| Table | Columns (main) | Notes |
|---|---|---|
| `filieres` | id, name (unique), cycle (`CP`/`CI`), position | Today's "cycles" entries (CP has one) |
| `years` | id, filiere_id → filieres, code (unique, trimmed), position | `2AP1`, `GI1`… |
| `semesters` | id, year_id → years, name, position | unique (year_id, name) |
| `modules` | id, semester_id → semesters, name, position | unique (semester_id, name) |
| `users` | id (uuid), email (unique, lowercase), role (`student`/`responsable`/`superadmin`), first_name, last_name, password_hash (nullable), assigned_year_id → years (responsables only), is_active, password_changed_at, last_login_at, created_at, updated_at | Check constraint: responsable ⇔ assigned_year_id set |
| `files` | id (uuid), module_id → modules, category (`Cours`/`TD`/`TP`/`EXAM`/`Autre`), label, file_name, original_name, display_name, file_type, file_size, drive_id (unique), web_view_link, web_content_link, thumbnail_link, uploaded_by → users (set null), created_at, updated_at | Year, filière and semester come from the module |
| `saved_parcours` | user_id → users (cascade), semester_id → semesters (cascade), created_at | PK (user_id, semester_id); max 6 checked in code |
| `student_allowlist` | email (PK), created_at | |
| `activity_logs` | id, user_id → users (set null), action, target_type, target_id, details (jsonb), created_at | Existing entries kept |
| `login_attempts` | key (PK), count, expires_at | Purged on write and by the daily cron |
| `pending_uploads` | id (uuid), user_id, module_id, category, label, folder_id, file_name, original_name, file_type, mime_type, size, expires_at | Purged by the daily cron |

Deleting a module, semester, year or filière that still has files is **refused by the database**
(foreign key), instead of leaving orphan files as today.

## API: route-by-route

All handlers verify the session themselves (a page guard is not an API guard). Same URLs and responses as today.

| Today (Express) | Next.js route handler | Cached? |
|---|---|---|
| `POST /api/auth/login`, `/google`, `/logout`; `GET /me`; `PUT /profile` | `app/api/auth/*` | no |
| `GET /api/structure` | `app/api/structure` | **yes**, tag `structure` |
| `PUT /api/structure` (superadmin) | same; tree with ids, diff by id; Drive folder renames kept | revalidates `structure`, `files` |
| `GET /api/files` | same; filters by filière/year/semester/module/category, search (`ILIKE`), pagination, `scope=mine` | **yes** per filter set, tag `files` (not for `scope=mine`) |
| `GET /api/files/:id`, `/:id/download` | same | **yes**, tag `files` |
| `POST /api/files/upload-session`, `/upload-complete` | same logic, Drive resumable upload | revalidates `files` |
| `PUT`/`DELETE /api/files/:id` | same (owner or superadmin), Drive cleanup kept | revalidates `files` |
| `GET /api/files/sync-thumbnails` (superadmin) | same | |
| `GET/POST/DELETE /api/parcours` | same | per-user cache, tag `parcours:<userId>` |
| `/api/users` (superadmin) | same, incl. student→responsable conversion and email-change rules | revalidates `files` (uploader names) |
| `/api/students` (superadmin) | same | |
| `/api/stats/*` (superadmin) | same, as SQL aggregates | |

The structure editor gets module/semester/year ids from `GET /api/structure?withIds=1` so renames are
detected by id instead of by guessing from names. The public shape (module names as strings) is unchanged.

## Sign-in and sessions

- Same behaviour as today: Google (students `@etu.uae.ac.ma` Workspace accounts, list-restricted; staff by
  email), password fallback for staff, rate limiting, same messages.
- Session: signed JWT (HS256, `jose`) in the same httpOnly `token` cookie. It carries the user id, role,
  and the time it was issued.
- **Staff requests** (responsables, admins) are checked against the database on every request, as today:
  deactivation, email change and password change take effect immediately.
- **Student requests** don't query the database. Instead they are checked against a small **access
  snapshot** kept in the Next.js data cache (tag `student-access`): the ids of deactivated students and,
  when the student list is active, the allowed emails. Removing a student from the list, emptying or
  importing the list, or deactivating an account clears that cache, so the next request reloads the
  snapshot once and the change applies **immediately**. The database is only touched when that list
  actually changes. Emergency lever: changing `SESSION_SECRET` on Vercel ends every session at once.
- All existing sessions end at the switch (new signing secret); everyone signs in again once.

## Neon compute budget

The database runs from a query until 5 minutes after the last one. What wakes it after the migration:

- **Wakes it:** sign-in, the first request after the student list or an account status changed, saving/removing a parcours, anything staff do
  (uploads, admin pages), cache refresh after an upload or structure change.
- **Doesn't wake it:** a signed-in student opening the home page, a parcours, a module's file list, a
  preview or a download (served from the Next.js cache and Google Drive).
- Compute capped at 0.25 CU in the Neon console. Usage checked weekly during the first month.
  If exam weeks exceed the free allowance, the paid plan is usage-based.

## Backups

Neon Free keeps 6 hours of history. A daily Vercel cron exports all tables as JSON to a private
`_backups` folder in the ADE Google Drive (keeping the last 30), plus the same cron purges expired
`login_attempts` and `pending_uploads`. MongoDB Atlas is kept read-only for one month after the switch.

## What gets removed

`backend/` (Express, Mongoose), `api/[...path].ts`, the `/api` rewrite in `vercel.json`, and the
Express/Mongoose/Cloudinary-era dependencies from the root `package.json`. The dev setup becomes a single
`npm run dev`.

## Steps

1. **Setup** (you): create the Neon project with a `dev` branch; paste its pooled connection string in
   `.env.development.local` as `DATABASE_URL`. I generate `SESSION_SECRET` for dev with a script that
   writes to a file and prints only the path.
2. **Schema** (me): Drizzle schema + first migration, applied to the Neon `dev` branch.
3. **Data migration script** (me): reads MongoDB (read-only), writes Postgres, idempotent, with a
   count-and-sample report (547 files, 24 users, 273 modules, 986 logs today). Run against `dev` first.
4. **Route handlers** (me): port every route, shared helpers (`lib/db`, `lib/session`, `lib/drive`,
   `lib/rate-limit`, `lib/student-access`), caching with tags.
5. **Tests** (me): port the scenario tests already run on Express (login/rate limit/injection, student
   sign-in and allowlist, parcours, responsables, direct upload against a test Drive folder), run on `dev`.
6. **You test locally** on the Neon `dev` branch with a copy of production data.
7. **Switch day** (together, on a quiet day):
   - Vercel: add `DATABASE_URL` (Neon `main`) and a new production `SESSION_SECRET`.
   - Run migrations + data migration against Neon `main` from the live MongoDB (the site keeps running
     on Mongo meanwhile; uploads paused for ~15 minutes).
   - Merge `neon-migration` into `main` → Vercel deploys.
   - Smoke test: sign-in (student, responsable, admin), a parcours, a preview, a download, an upload.
   - Rollback if needed: revert the merge commit; MongoDB still has everything up to the switch.

## Decisions

1. Student access checked on every request against a cached snapshot, so removals apply **immediately**.
2. Neon project created in the Neon console (region AWS Europe, Frankfurt), branches `main` and `dev`,
   compute capped at 0.25 CU. Vercel functions pinned to the Frankfurt region (`fra1`) to sit next to it.
3. Daily JSON backup to a private `_backups` folder in the ADE Drive (last 30 kept).
