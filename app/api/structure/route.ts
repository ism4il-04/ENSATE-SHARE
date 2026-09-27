import { count, eq, inArray } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { files, filieres, inTransaction, modules, semesters, users, years } from '@/lib/db';
import { logActivity } from '@/lib/server/activity';
import { requireSuperadmin } from '@/lib/server/auth';
import { deleteModuleFolderAndPruneAncestors, DrivePath, renameModuleFolder } from '@/lib/server/drive';
import { FILES_TAG } from '@/lib/server/files';
import { fail, handler, json, readBody } from '@/lib/server/http';
import { getAuthUser } from '@/lib/server/session';
import { getCachedStructureTree, loadStructureTree, STRUCTURE_TAG, toPublicStructure } from '@/lib/server/structure';
import { isNonEmptyString } from '@/lib/server/validation';

// Public: the academic structure (cached). ?withIds=1 (superadmin) returns ids for the editor.
export const GET = handler(async (req: NextRequest) => {
    if (req.nextUrl.searchParams.get('withIds') === '1') {
        const user = await getAuthUser(req);
        if (user?.role === 'superadmin') {
            return json({ success: true, structure: await loadStructureTree() });
        }
    }
    return json({ success: true, structure: toPublicStructure(await getCachedStructureTree()) });
});

interface InModule { id?: number; name: string }
interface InSemester { id?: number; name: string; modules: InModule[] }
interface InYear { id?: number; code: string; semesters: InSemester[] }
interface InFiliere { id?: number; name: string; cycle: 'CP' | 'CI'; years: InYear[] }

class StructureError extends Error {}

const optId = (v: unknown) => (Number.isInteger(v) && (v as number) > 0 ? (v as number) : undefined);

// Validates the editor's tree; module entries may be names (strings) or { id, name }
function parseTree(raw: unknown): InFiliere[] {
    if (!Array.isArray(raw)) throw new StructureError('La structure est invalide');
    return raw.map((c: any) => {
        if (!isNonEmptyString(c?.name) || (c.cycle !== 'CP' && c.cycle !== 'CI')) {
            throw new StructureError('Chaque filière doit avoir un nom et un cycle (CP ou CI)');
        }
        return {
            id: optId(c.id),
            name: c.name.trim(),
            cycle: c.cycle,
            years: (Array.isArray(c.years) ? c.years : []).map((y: any) => {
                if (!isNonEmptyString(y?.code, 50)) throw new StructureError(`Année sans code dans « ${c.name} »`);
                return {
                    id: optId(y.id),
                    code: y.code.trim(),
                    semesters: (Array.isArray(y.semesters) ? y.semesters : []).map((s: any) => {
                        if (!isNonEmptyString(s?.name)) throw new StructureError(`Semestre sans nom dans ${y.code}`);
                        return {
                            id: optId(s.id),
                            name: s.name.trim(),
                            modules: (Array.isArray(s.modules) ? s.modules : [])
                                .map((m: any) => (typeof m === 'string' ? { name: m } : { id: optId(m?.id), name: m?.name }))
                                .filter((m: InModule) => isNonEmptyString(m.name))
                                .map((m: InModule) => ({ id: m.id, name: m.name.trim() })),
                        };
                    }),
                };
            }),
        };
    });
}

// Superadmin: save the whole tree. Rows are matched by id, so renames keep every file attached.
export const PUT = handler(async (req: NextRequest) => {
    const auth = await requireSuperadmin(req);
    if (auth instanceof Response) return auth;

    let tree: InFiliere[];
    try {
        tree = parseTree((await readBody(req)).cycles);
    } catch (error) {
        return fail(400, error instanceof StructureError ? error.message : 'La structure est invalide');
    }

    const before = await loadStructureTree();
    const oldModules = new Map<number, DrivePath>();
    for (const c of before.cycles)
        for (const y of c.years)
            for (const s of y.semesters)
                for (const m of s.modules)
                    oldModules.set(m.id, { filiere: c.name, cycle: c.cycle, year: y.code, semester: s.name, module: m.name });

    let keptModules: Map<number, string>;
    try {
        keptModules = await inTransaction(async (tx) => {
            const kept = { filieres: new Set<number>(), years: new Set<number>(), semesters: new Set<number>(), modules: new Map<number, string>() };

            for (const [fi, c] of tree.entries()) {
                const values = { name: c.name, cycle: c.cycle, position: fi };
                const [f] = c.id
                    ? await tx.update(filieres).set(values).where(eq(filieres.id, c.id)).returning({ id: filieres.id })
                    : await tx.insert(filieres).values(values).returning({ id: filieres.id });
                if (!f) throw new StructureError(`Filière introuvable : ${c.name}`);
                kept.filieres.add(f.id);

                for (const [yi, y] of c.years.entries()) {
                    const yValues = { filiereId: f.id, code: y.code, position: yi };
                    const [yr] = y.id
                        ? await tx.update(years).set(yValues).where(eq(years.id, y.id)).returning({ id: years.id })
                        : await tx.insert(years).values(yValues).returning({ id: years.id });
                    if (!yr) throw new StructureError(`Année introuvable : ${y.code}`);
                    kept.years.add(yr.id);

                    for (const [si, s] of y.semesters.entries()) {
                        const sValues = { yearId: yr.id, name: s.name, position: si };
                        const [se] = s.id
                            ? await tx.update(semesters).set(sValues).where(eq(semesters.id, s.id)).returning({ id: semesters.id })
                            : await tx.insert(semesters).values(sValues).returning({ id: semesters.id });
                        if (!se) throw new StructureError(`Semestre introuvable : ${y.code} ${s.name}`);
                        kept.semesters.add(se.id);

                        for (const [mi, m] of s.modules.entries()) {
                            const mValues = { semesterId: se.id, name: m.name, position: mi };
                            const [mo] = m.id
                                ? await tx.update(modules).set(mValues).where(eq(modules.id, m.id)).returning({ id: modules.id })
                                : await tx.insert(modules).values(mValues).returning({ id: modules.id });
                            if (!mo) throw new StructureError(`Module introuvable : ${m.name}`);
                            kept.modules.set(mo.id, m.name);
                        }
                    }
                }
            }

            // Anything no longer in the tree is removed, unless files or responsables still use it
            const removedModules = [...oldModules.keys()].filter((id) => !kept.modules.has(id));
            if (removedModules.length) {
                const used = await tx
                    .select({ moduleId: files.moduleId, n: count() })
                    .from(files)
                    .where(inArray(files.moduleId, removedModules))
                    .groupBy(files.moduleId);
                if (used.length) {
                    const names = used.map((u) => `« ${oldModules.get(u.moduleId)?.module} » (${u.n} fichier${u.n > 1 ? 's' : ''})`);
                    throw new StructureError(`Impossible de supprimer ces modules, ils contiennent des fichiers : ${names.join(', ')}`);
                }
                await tx.delete(modules).where(inArray(modules.id, removedModules));
            }

            const allSemesters = before.cycles.flatMap((c) => c.years.flatMap((y) => y.semesters.map((s) => s.id)));
            const removedSemesters = allSemesters.filter((id) => !kept.semesters.has(id));
            if (removedSemesters.length) await tx.delete(semesters).where(inArray(semesters.id, removedSemesters));

            const allYears = before.cycles.flatMap((c) => c.years.map((y) => y.id));
            const removedYears = allYears.filter((id) => !kept.years.has(id));
            if (removedYears.length) {
                const assigned = await tx.select({ email: users.email }).from(users).where(inArray(users.assignedYearId, removedYears));
                if (assigned.length) {
                    throw new StructureError(
                        `Impossible de supprimer une année encore attribuée à un responsable : ${assigned.map((a) => a.email).join(', ')}`
                    );
                }
                await tx.delete(years).where(inArray(years.id, removedYears));
            }

            const removedFilieres = before.cycles.map((c) => c.id).filter((id) => !kept.filieres.has(id));
            if (removedFilieres.length) await tx.delete(filieres).where(inArray(filieres.id, removedFilieres));

            return kept.modules;
        });
    } catch (error: any) {
        if (error instanceof StructureError) return fail(400, error.message);
        if (error?.code === '23505') return fail(400, 'Deux éléments portent le même nom ou le même code (ex. deux années « GI1 »)');
        if (error?.code === '23503') return fail(400, 'Un élément supprimé est encore utilisé (fichiers ou responsables)');
        throw error;
    }

    // Keep Google Drive folders in line: renamed modules keep their folder, removed empty ones are pruned
    for (const [id, oldPath] of oldModules) {
        const newName = keptModules.get(id);
        if (newName === undefined) await deleteModuleFolderAndPruneAncestors(oldPath);
        else if (newName !== oldPath.module) await renameModuleFolder(oldPath, newName);
    }

    revalidateTag(STRUCTURE_TAG);
    revalidateTag(FILES_TAG); // file lists show filière/year/semester/module names
    await logActivity({ userId: auth.id, action: 'STRUCTURE_UPDATE', targetType: 'AcademicStructure' });

    return json({ success: true, message: 'Academic structure updated successfully', structure: await loadStructureTree() });
}, 'Error updating academic structure');
