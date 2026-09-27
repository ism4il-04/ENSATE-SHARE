import { Response } from 'express';
import StudentAllowlist from '../models/StudentAllowlist.model';
import User from '../models/User.model';
import ActivityLog from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { isValidEmail } from '../utils/authHelpers';
import { clearAllowlistCache, isStudentDomainEmail, STUDENT_EMAIL_DOMAIN } from '../utils/studentAccess';

const MAX_IMPORT_BATCH = 1000;
const PAGE_SIZE = 50;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Student allowlist overview, one page of entries with their account status
// @route   GET /api/students?search=&page=
// @access  Private (Superadmin only)
export const getStudentAllowlist = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase().slice(0, 100) : '';
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const filter = search ? { email: { $regex: escapeRegex(search) } } : {};

        const [total, allowlistCount, registeredStudents, registeredOutsideList, entries] = await Promise.all([
            StudentAllowlist.countDocuments(filter),
            StudentAllowlist.countDocuments(),
            User.countDocuments({ role: 'student' }),
            // Student accounts created before the list existed (or removed from it): blocked while the list is active
            User.aggregate([
                { $match: { role: 'student' } },
                { $lookup: { from: 'studentallowlists', localField: 'email', foreignField: 'email', as: 'listed' } },
                { $match: { listed: { $size: 0 } } },
                { $count: 'n' },
            ]).then((r) => r[0]?.n ?? 0),
            StudentAllowlist.find(filter)
                .sort({ email: 1 })
                .skip((page - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .lean(),
        ]);

        const accounts = await User.find({ role: 'student', email: { $in: entries.map((e) => e.email) } })
            .select('email firstName lastName lastLoginAt isActive')
            .lean();
        const accountByEmail = new Map(accounts.map((a) => [a.email, a]));

        res.status(200).json({
            success: true,
            domain: STUDENT_EMAIL_DOMAIN,
            enforced: allowlistCount > 0,
            allowlistCount,
            registeredStudents,
            registeredOutsideList: allowlistCount > 0 ? registeredOutsideList : 0,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
            entries: entries.map((e) => {
                const account = accountByEmail.get(e.email);
                return {
                    id: String(e._id),
                    email: e.email,
                    addedAt: e.createdAt,
                    account: account
                        ? {
                              firstName: account.firstName,
                              lastName: account.lastName,
                              lastLoginAt: account.lastLoginAt,
                              isActive: account.isActive,
                          }
                        : null,
                };
            }),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching student list' });
    }
};

// @desc    Add emails to the student allowlist (the page sends large lists in batches)
// @route   POST /api/students/import  { emails: string[] }
// @access  Private (Superadmin only)
export const importStudentEmails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { emails } = req.body;
        if (!Array.isArray(emails) || emails.length === 0 || emails.length > MAX_IMPORT_BATCH) {
            res.status(400).json({
                success: false,
                message: `Envoyez entre 1 et ${MAX_IMPORT_BATCH} adresses à la fois`,
            });
            return;
        }

        const valid = new Set<string>();
        const invalid: string[] = [];
        for (const raw of emails) {
            const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
            if (isValidEmail(email) && isStudentDomainEmail(email)) {
                valid.add(email);
            } else if (email) {
                invalid.push(email.slice(0, 100));
            }
        }

        const existing = await StudentAllowlist.find({ email: { $in: [...valid] } }).distinct('email');
        const existingSet = new Set(existing);
        const toInsert = [...valid].filter((e) => !existingSet.has(e));

        if (toInsert.length > 0) {
            try {
                await StudentAllowlist.insertMany(toInsert.map((email) => ({ email })), { ordered: false });
            } catch (error: any) {
                // Duplicates inserted concurrently are fine; anything else is a real failure
                if (error?.code !== 11000 && !error?.writeErrors?.every((e: any) => e.code === 11000)) throw error;
            }
            clearAllowlistCache();

            await ActivityLog.create({
                userId: req.user!._id,
                action: 'STUDENT_LIST_IMPORT',
                details: { added: toInsert.length },
            });
        }

        res.status(200).json({
            success: true,
            added: toInsert.length,
            alreadyPresent: existingSet.size,
            invalidCount: invalid.length,
            invalid: invalid.slice(0, 20),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Erreur lors de l'import" });
    }
};

// @desc    Remove one email from the student allowlist
// @route   DELETE /api/students/:id
// @access  Private (Superadmin only)
export const removeStudentEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const entry = await StudentAllowlist.findByIdAndDelete(req.params.id);
        if (!entry) {
            res.status(404).json({ success: false, message: 'Adresse introuvable' });
            return;
        }
        clearAllowlistCache();

        await ActivityLog.create({
            userId: req.user!._id,
            action: 'STUDENT_LIST_DELETE',
            details: { email: entry.email },
        });

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
};

// @desc    Empty the student allowlist (every @etu.uae.ac.ma account is allowed again)
// @route   DELETE /api/students?all=true
// @access  Private (Superadmin only)
export const clearStudentAllowlist = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.query.all !== 'true') {
            res.status(400).json({ success: false, message: 'Confirmation manquante' });
            return;
        }
        const { deletedCount } = await StudentAllowlist.deleteMany({});
        clearAllowlistCache();

        await ActivityLog.create({
            userId: req.user!._id,
            action: 'STUDENT_LIST_DELETE',
            details: { all: true, deleted: deletedCount },
        });

        res.status(200).json({ success: true, deleted: deletedCount });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
    }
};
