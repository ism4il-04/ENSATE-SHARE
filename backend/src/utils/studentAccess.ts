import StudentAllowlist from '../models/StudentAllowlist.model';

// University Google Workspace domain whose accounts may sign in as students
export const STUDENT_EMAIL_DOMAIN = 'etu.uae.ac.ma';

export const isStudentDomainEmail = (email: string): boolean => email.endsWith(`@${STUDENT_EMAIL_DOMAIN}`);

// `hd` is set by Google only for Workspace accounts of that domain, so a personal Google
// account can't pass for a student address.
export const isStudentGoogleAccount = (email: string, hostedDomain?: string): boolean =>
    isStudentDomainEmail(email) && hostedDomain === STUDENT_EMAIL_DOMAIN;

// Size of the allowlist, cached briefly per server instance: this runs on every student request
const CACHE_MS = 30 * 1000;
let cachedCount: { value: number; at: number } | null = null;

const getAllowlistCount = async (): Promise<number> => {
    if (cachedCount && Date.now() - cachedCount.at < CACHE_MS) {
        return cachedCount.value;
    }
    const value = await StudentAllowlist.estimatedDocumentCount();
    cachedCount = { value, at: Date.now() };
    return value;
};

export const clearAllowlistCache = (): void => {
    cachedCount = null;
};

export const isAllowlistEnforced = async (): Promise<boolean> => (await getAllowlistCount()) > 0;

// An empty list lets every student-domain account in; once filled, only listed emails pass
export const isStudentAllowed = async (email: string): Promise<boolean> => {
    if (!(await isAllowlistEnforced())) {
        return true;
    }
    return !!(await StudentAllowlist.exists({ email: email.toLowerCase() }));
};
