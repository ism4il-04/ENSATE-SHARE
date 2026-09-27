import { sql } from 'drizzle-orm';
import {
    bigserial,
    boolean,
    check,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    primaryKey,
    serial,
    text,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core';

const timestamptz = () => timestamp({ withTimezone: true, mode: 'date' });

export const cycleEnum = pgEnum('cycle', ['CP', 'CI']);
export const roleEnum = pgEnum('role', ['student', 'responsable', 'superadmin']);
export const fileCategoryEnum = pgEnum('file_category', ['Cours', 'TD', 'TP', 'EXAM', 'Autre']);
export const fileTypeEnum = pgEnum('file_type', ['pdf', 'docx', 'pptx', 'xls', 'xlsx', 'zip', 'jpg', 'jpeg', 'png', 'gif']);

// ---------------------------------------------------------------------------
// Academic structure: filière → year → semester → module
// (the Cycle Préparatoire is a single "filière" with cycle CP)
// ---------------------------------------------------------------------------

export const filieres = pgTable('filieres', {
    id: serial().primaryKey(),
    name: text().notNull().unique(),
    cycle: cycleEnum().notNull(),
    position: integer().notNull().default(0),
});

export const years = pgTable(
    'years',
    {
        id: serial().primaryKey(),
        filiereId: integer()
            .notNull()
            .references(() => filieres.id, { onDelete: 'restrict' }),
        code: text().notNull().unique(), // "2AP1", "GI1", …
        position: integer().notNull().default(0),
    },
    (t) => [index().on(t.filiereId)]
);

export const semesters = pgTable(
    'semesters',
    {
        id: serial().primaryKey(),
        yearId: integer()
            .notNull()
            .references(() => years.id, { onDelete: 'restrict' }),
        name: text().notNull(), // "S1" … "S10", or a longer label
        position: integer().notNull().default(0),
    },
    (t) => [unique().on(t.yearId, t.name)]
);

export const modules = pgTable(
    'modules',
    {
        id: serial().primaryKey(),
        semesterId: integer()
            .notNull()
            .references(() => semesters.id, { onDelete: 'restrict' }),
        name: text().notNull(),
        position: integer().notNull().default(0),
    },
    (t) => [unique().on(t.semesterId, t.name)]
);

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const users = pgTable(
    'users',
    {
        id: uuid().primaryKey().defaultRandom(),
        email: text().notNull().unique(), // always stored lowercase
        role: roleEnum().notNull(),
        firstName: text().notNull(),
        lastName: text().notNull(),
        // Only staff accounts that still sign in with a password have one (bcrypt)
        passwordHash: text(),
        // Responsables only: the year (and through it the filière) they manage
        assignedYearId: integer().references(() => years.id, { onDelete: 'restrict' }),
        isActive: boolean().notNull().default(true),
        // Sessions issued before this date are rejected
        passwordChangedAt: timestamptz(),
        lastLoginAt: timestamptz(),
        createdAt: timestamptz().notNull().defaultNow(),
        updatedAt: timestamptz().notNull().defaultNow(),
    },
    (t) => [
        check('users_email_lowercase', sql`${t.email} = lower(${t.email})`),
        check(
            'users_responsable_has_year',
            sql`(${t.role} = 'responsable') = (${t.assignedYearId} is not null)`
        ),
    ]
);

// ---------------------------------------------------------------------------
// Documents (stored on Google Drive)
// ---------------------------------------------------------------------------

export const files = pgTable(
    'files',
    {
        id: uuid().primaryKey().defaultRandom(),
        moduleId: integer()
            .notNull()
            .references(() => modules.id, { onDelete: 'restrict' }),
        category: fileCategoryEnum().notNull().default('Autre'),
        label: text(),
        fileName: text().notNull(), // Drive-safe name
        originalName: text().notNull(),
        displayName: text().notNull(), // original name with accents, shown to users
        fileType: fileTypeEnum().notNull(),
        fileSize: integer().notNull(),
        driveId: text().notNull().unique(),
        webViewLink: text(),
        webContentLink: text(),
        thumbnailLink: text(),
        uploadedBy: uuid().references(() => users.id, { onDelete: 'set null' }),
        createdAt: timestamptz().notNull().defaultNow(),
        updatedAt: timestamptz().notNull().defaultNow(),
    },
    (t) => [index().on(t.moduleId, t.category), index().on(t.uploadedBy), index().on(t.createdAt)]
);

// Uploads authorized by the server, waiting for the browser to finish sending the file to Drive
export const pendingUploads = pgTable(
    'pending_uploads',
    {
        id: uuid().primaryKey().defaultRandom(),
        userId: uuid()
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        moduleId: integer()
            .notNull()
            .references(() => modules.id, { onDelete: 'cascade' }),
        category: fileCategoryEnum().notNull(),
        label: text(),
        folderId: text().notNull(),
        fileName: text().notNull(),
        originalName: text().notNull(),
        fileType: fileTypeEnum().notNull(),
        mimeType: text().notNull(),
        size: integer().notNull(),
        expiresAt: timestamptz().notNull(),
    },
    (t) => [index().on(t.expiresAt)]
);

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

// "Mes parcours": a parcours is a semester of a year of a filière
export const savedParcours = pgTable(
    'saved_parcours',
    {
        userId: uuid()
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        semesterId: integer()
            .notNull()
            .references(() => semesters.id, { onDelete: 'cascade' }),
        createdAt: timestamptz().notNull().defaultNow(),
    },
    (t) => [primaryKey({ columns: [t.userId, t.semesterId] })]
);

// Emails allowed to sign in as students. Empty = every @etu.uae.ac.ma Workspace account.
export const studentAllowlist = pgTable('student_allowlist', {
    email: text().primaryKey(),
    createdAt: timestamptz().notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Security and audit
// ---------------------------------------------------------------------------

export const activityLogs = pgTable(
    'activity_logs',
    {
        id: bigserial({ mode: 'number' }).primaryKey(),
        userId: uuid().references(() => users.id, { onDelete: 'set null' }),
        action: text().notNull(),
        targetType: text(),
        targetId: text(),
        details: jsonb(),
        createdAt: timestamptz().notNull().defaultNow(),
    },
    (t) => [index().on(t.createdAt), index().on(t.action, t.createdAt), index().on(t.userId)]
);

// Failed password logins, keyed "ip:<addr>" or "email:<addr>"
export const loginAttempts = pgTable('login_attempts', {
    key: text().primaryKey(),
    count: integer().notNull().default(0),
    expiresAt: timestamptz().notNull(),
});
