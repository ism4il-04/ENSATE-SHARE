import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db, filieres, users, years } from '@/lib/db';

const responsableColumns = {
    id: users.id,
    email: users.email,
    role: users.role,
    firstName: users.firstName,
    lastName: users.lastName,
    isActive: users.isActive,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    assignedYear: years.code,
    assignedFiliere: filieres.name,
};

type ResponsableRow = { [K in keyof typeof responsableColumns]: (typeof responsableColumns)[K]['_']['data'] | null };

// Same shape as the former MongoDB documents (_id, assignedYear code, assignedFiliere name)
export const serializeResponsable = (u: ResponsableRow) => ({
    _id: u.id,
    id: u.id,
    email: u.email,
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    assignedYear: u.assignedYear ?? undefined,
    assignedFiliere: u.assignedFiliere ?? undefined,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
});

const selectResponsables = () =>
    db
        .select(responsableColumns)
        .from(users)
        .leftJoin(years, eq(years.id, users.assignedYearId))
        .leftJoin(filieres, eq(filieres.id, years.filiereId));

export async function listResponsables() {
    const rows = await selectResponsables().where(eq(users.role, 'responsable')).orderBy(asc(years.code));
    return rows.map(serializeResponsable);
}

export async function getResponsable(id: string) {
    const [row] = await selectResponsables().where(eq(users.id, id));
    return row ? serializeResponsable(row) : null;
}
