import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db, filieres, modules, semesters, years } from '@/lib/db';

export const STRUCTURE_TAG = 'structure';

export interface StructureTree {
    cycles: {
        id: number;
        name: string;
        cycle: 'CP' | 'CI';
        years: {
            id: number;
            code: string;
            semesters: { id: number; name: string; modules: { id: number; name: string }[] }[];
        }[];
    }[];
}

// The whole tree, ordered as the admin arranged it
export async function loadStructureTree(): Promise<StructureTree> {
    const [f, y, s, m] = await Promise.all([
        db.select().from(filieres).orderBy(asc(filieres.position), asc(filieres.id)),
        db.select().from(years).orderBy(asc(years.position), asc(years.id)),
        db.select().from(semesters).orderBy(asc(semesters.position), asc(semesters.id)),
        db.select().from(modules).orderBy(asc(modules.position), asc(modules.id)),
    ]);
    return {
        cycles: f.map((fi) => ({
            id: fi.id,
            name: fi.name,
            cycle: fi.cycle,
            years: y
                .filter((yr) => yr.filiereId === fi.id)
                .map((yr) => ({
                    id: yr.id,
                    code: yr.code,
                    semesters: s
                        .filter((se) => se.yearId === yr.id)
                        .map((se) => ({
                            id: se.id,
                            name: se.name,
                            modules: m.filter((mo) => mo.semesterId === se.id).map((mo) => ({ id: mo.id, name: mo.name })),
                        })),
                })),
        })),
    };
}

// Cached for everyone; refreshed when the admin saves the structure
export const getCachedStructureTree = unstable_cache(loadStructureTree, [STRUCTURE_TAG], { tags: [STRUCTURE_TAG] });

// Public shape used by the pages (module names as strings, no ids)
export const toPublicStructure = (tree: StructureTree) => ({
    cycles: tree.cycles.map((c) => ({
        name: c.name,
        cycle: c.cycle,
        years: c.years.map((y) => ({
            code: y.code,
            semesters: y.semesters.map((s) => ({ name: s.name, modules: s.modules.map((m) => m.name) })),
        })),
    })),
});

export interface ModulePath {
    moduleId: number;
    semesterId: number;
    filiere: string;
    cycle: 'CP' | 'CI';
    year: string;
    semester: string;
    module: string;
}

const modulePathColumns = {
    moduleId: modules.id,
    semesterId: semesters.id,
    filiere: filieres.name,
    cycle: filieres.cycle,
    year: years.code,
    semester: semesters.name,
    module: modules.name,
};

const withPathJoins = () =>
    db
        .select(modulePathColumns)
        .from(modules)
        .innerJoin(semesters, eq(semesters.id, modules.semesterId))
        .innerJoin(years, eq(years.id, semesters.yearId))
        .innerJoin(filieres, eq(filieres.id, years.filiereId));

// Module by its names (as sent by the upload form); null if it doesn't exist in the structure
export async function findModuleByNames(p: { filiere?: string; year: string; semester: string; module: string }): Promise<ModulePath | null> {
    const conditions = [eq(years.code, p.year), eq(semesters.name, p.semester), eq(modules.name, p.module)];
    if (p.filiere) conditions.push(eq(filieres.name, p.filiere));
    const [row] = await withPathJoins().where(and(...conditions));
    return row ?? null;
}

export async function findModuleById(moduleId: number): Promise<ModulePath | null> {
    const [row] = await withPathJoins().where(eq(modules.id, moduleId));
    return row ?? null;
}

// Semester by filière name + year code + semester name (a saved "parcours")
export async function findSemesterByNames(p: { cycle?: string; filiere: string; year: string; semester: string }) {
    const conditions = [eq(filieres.name, p.filiere), eq(years.code, p.year), eq(semesters.name, p.semester)];
    if (p.cycle === 'CP' || p.cycle === 'CI') conditions.push(eq(filieres.cycle, p.cycle));
    const [row] = await db
        .select({ semesterId: semesters.id })
        .from(semesters)
        .innerJoin(years, eq(years.id, semesters.yearId))
        .innerJoin(filieres, eq(filieres.id, years.filiereId))
        .where(and(...conditions));
    return row ?? null;
}

// Year by code (responsable assignment), optionally checked against its filière
export async function findYear(code: string, filiereName?: string) {
    const conditions = [eq(years.code, code)];
    if (filiereName) conditions.push(eq(filieres.name, filiereName));
    const [row] = await db
        .select({ id: years.id, code: years.code, filiere: filieres.name })
        .from(years)
        .innerJoin(filieres, eq(filieres.id, years.filiereId))
        .where(and(...conditions));
    return row ?? null;
}
