import 'server-only';
import { findModuleByNames, ModulePath } from './structure';
import { AuthUser } from './session';
import { isNonEmptyString } from './validation';

export const FILE_CATEGORIES = ['Cours', 'TD', 'TP', 'EXAM', 'Autre'] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];

export interface UploadTarget {
    module: ModulePath;
    category: FileCategory;
    label?: string;
}

// Where an upload goes, and whether this user may put it there. Returns an error message when not allowed.
export async function resolveUploadTarget(user: AuthUser, body: Record<string, unknown>): Promise<UploadTarget | string> {
    const { semester, module, fileCategory = 'Autre', fileLabel, year, filiere } = body;

    for (const [field, value] of Object.entries({ semester, module, fileCategory, year, filiere })) {
        if (value !== undefined && value !== '' && !isNonEmptyString(value)) return `Champ invalide : ${field}`;
    }
    if (fileLabel !== undefined && fileLabel !== '' && !isNonEmptyString(fileLabel, 100)) return 'Label invalide';
    if (!semester) return 'Le semestre est requis';
    if (!module) return 'Le module est requis';
    if (!FILE_CATEGORIES.includes(fileCategory as FileCategory)) return 'Type de fichier invalide';

    let target: ModulePath | null;
    if (user.role === 'responsable') {
        // Responsable: only their assigned year (and filière), only modules of the structure
        if (!user.assignedYear || !user.assignedFiliere) {
            return "Votre année ou filière n'est pas dans la structure académique. Contactez l'administrateur.";
        }
        target = await findModuleByNames({
            filiere: user.assignedFiliere,
            year: user.assignedYear,
            semester: semester as string,
            module: module as string,
        });
        if (!target) return `Le module « ${module} » n'existe pas dans le semestre ${semester} de votre année (${user.assignedYear}).`;
    } else {
        // Superadmin: any existing module, named by filière + year + semester + module
        if (!year || !filiere) return "L'année et la filière sont requises";
        target = await findModuleByNames({
            filiere: filiere as string,
            year: year as string,
            semester: semester as string,
            module: module as string,
        });
        if (!target) return "Ce module n'existe pas dans la structure académique";
    }

    return { module: target, category: fileCategory as FileCategory, label: (fileLabel as string) || undefined };
}
