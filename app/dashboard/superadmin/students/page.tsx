'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsAPI } from '@/lib/api';
import AccessCodesPanel from '@/components/AccessCodesPanel';
import {
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    FileUp,
    ShieldCheck,
    Trash2,
    Upload,
} from 'lucide-react';

const IMPORT_BATCH_SIZE = 1000;
const EMAIL_PATTERN = /[^\s,;"'<>()]+@[^\s,;"'<>()]+\.[a-z]{2,}/gi;

interface AllowlistEntry {
    id: string;
    email: string;
    addedAt: string;
    account: { firstName: string; lastName: string; lastLoginAt?: string; isActive: boolean } | null;
}

interface AllowlistResponse {
    domain: string;
    enforced: boolean;
    allowlistCount: number;
    registeredStudents: number;
    registeredOutsideList: number;
    total: number;
    page: number;
    pages: number;
    entries: AllowlistEntry[];
}

const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [importText, setImportText] = useState('');
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState('');
    const [importResult, setImportResult] = useState<{ added: number; alreadyPresent: number; invalidCount: number; invalid: string[] } | null>(null);
    const [error, setError] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['studentAllowlist', search, page],
        queryFn: async () => (await studentsAPI.getList({ search: search || undefined, page })).data as AllowlistResponse,
    });

    // Every email-looking token in the pasted text or file (one per line, CSV, separated by commas…)
    const detectedEmails = useMemo(() => {
        const found = importText.match(EMAIL_PATTERN) ?? [];
        return [...new Set(found.map((e) => e.toLowerCase()))];
    }, [importText]);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['studentAllowlist'] });

    const removeMutation = useMutation({
        mutationFn: (id: string) => studentsAPI.remove(id),
        onSuccess: refresh,
    });

    const clearMutation = useMutation({
        mutationFn: () => studentsAPI.clearAll(),
        onSuccess: () => {
            setPage(1);
            refresh();
        },
    });

    const handleFile = async (file: File) => {
        setImportText(await file.text());
        setImportResult(null);
    };

    const handleImport = async () => {
        if (detectedEmails.length === 0) return;
        if (
            data && !data.enforced &&
            !confirm(
                `Dès cet import, seuls les étudiants de la liste pourront se connecter. ` +
                `Les autres comptes @${data.domain} perdront l'accès. Continuer ?`
            )
        ) {
            return;
        }

        setImporting(true);
        setError('');
        setImportResult(null);
        const total = { added: 0, alreadyPresent: 0, invalidCount: 0, invalid: [] as string[] };
        try {
            for (let i = 0; i < detectedEmails.length; i += IMPORT_BATCH_SIZE) {
                setImportProgress(`${Math.min(i + IMPORT_BATCH_SIZE, detectedEmails.length)} / ${detectedEmails.length}`);
                const res = await studentsAPI.importEmails(detectedEmails.slice(i, i + IMPORT_BATCH_SIZE));
                total.added += res.data.added;
                total.alreadyPresent += res.data.alreadyPresent;
                total.invalidCount += res.data.invalidCount;
                total.invalid.push(...res.data.invalid);
            }
            setImportResult({ ...total, invalid: total.invalid.slice(0, 20) });
            setImportText('');
        } catch (err: any) {
            setError(err.response?.data?.message || "Erreur lors de l'import");
        } finally {
            setImporting(false);
            setImportProgress('');
            refresh();
        }
    };

    const handleClear = () => {
        if (
            confirm(
                `Vider la liste des ${data?.allowlistCount} adresses ? ` +
                `Tout compte @${data?.domain} (tous les étudiants de l'UAE) pourra de nouveau se connecter.`
            )
        ) {
            clearMutation.mutate();
        }
    };

    return (
        <div className="md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-atlas-800">Étudiants autorisés</h1>
                <p className="text-atlas-600 mt-2">
                    Liste des adresses universitaires autorisées à se connecter et à consulter les documents
                </p>
            </div>

            {/* Status */}
            {data && (
                <div
                    className={`card border mb-6 flex items-start gap-4 ${data.enforced ? 'border-green-200 bg-green-50/60' : 'border-amber-200 bg-amber-50/60'}`}
                >
                    {data.enforced ? (
                        <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={24} />
                    ) : (
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
                    )}
                    <div className="text-sm">
                        {data.enforced ? (
                            <p className="font-semibold text-green-800">
                                Liste active : {data.allowlistCount} adresse{data.allowlistCount > 1 ? 's' : ''} autorisée
                                {data.allowlistCount > 1 ? 's' : ''}. Seuls ces étudiants peuvent se connecter.
                            </p>
                        ) : (
                            <p className="font-semibold text-amber-800">
                                Liste vide : tout compte Google @{data.domain} peut se connecter, y compris les
                                étudiants des autres établissements de l&apos;UAE.
                            </p>
                        )}
                        <p className="mt-1 text-atlas-600">
                            {data.registeredStudents} compte{data.registeredStudents > 1 ? 's' : ''} étudiant
                            {data.registeredStudents > 1 ? 's' : ''} créé{data.registeredStudents > 1 ? 's' : ''}.
                            {data.registeredOutsideList > 0 &&
                                ` Dont ${data.registeredOutsideList} hors liste, sans accès.`}
                        </p>
                    </div>
                </div>
            )}

            <AccessCodesPanel />

            {/* Import */}
            <div className="card border border-cream-300/60 mb-6">
                <h2 className="text-lg font-semibold text-atlas-800 flex items-center gap-2 mb-1">
                    <Upload size={18} />
                    Importer des adresses
                </h2>
                <p className="text-sm text-atlas-600 mb-4">
                    Collez les adresses (une par ligne, ou séparées par des virgules) ou chargez un fichier CSV/TXT.
                    Seules les adresses @{data?.domain ?? 'etu.uae.ac.ma'} sont acceptées ; les doublons sont ignorés.
                </p>
                <textarea
                    value={importText}
                    onChange={(e) => {
                        setImportText(e.target.value);
                        setImportResult(null);
                    }}
                    rows={6}
                    placeholder={'prenom.nom@etu.uae.ac.ma\nprenom2.nom2@etu.uae.ac.ma'}
                    className="input-field w-full font-mono text-sm"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt,text/csv,text/plain"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                            e.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-atlas-700 border border-cream-300 hover:bg-cream-100 transition-colors"
                    >
                        <FileUp size={16} />
                        Charger un fichier
                    </button>
                    <button
                        type="button"
                        onClick={handleImport}
                        disabled={importing || detectedEmails.length === 0}
                        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                    >
                        <Upload size={16} />
                        {importing
                            ? `Import en cours… ${importProgress}`
                            : `Importer ${detectedEmails.length} adresse${detectedEmails.length > 1 ? 's' : ''}`}
                    </button>
                </div>

                {importResult && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <p className="flex items-center gap-2 font-medium">
                            <CheckCircle size={16} />
                            {importResult.added} ajoutée{importResult.added > 1 ? 's' : ''},{' '}
                            {importResult.alreadyPresent} déjà présente{importResult.alreadyPresent > 1 ? 's' : ''}
                            {importResult.invalidCount > 0 && `, ${importResult.invalidCount} refusée${importResult.invalidCount > 1 ? 's' : ''}`}
                        </p>
                        {importResult.invalid.length > 0 && (
                            <p className="mt-1 text-xs text-green-700">
                                Refusées (pas @{data?.domain}) : {importResult.invalid.join(', ')}
                                {importResult.invalidCount > importResult.invalid.length && '…'}
                            </p>
                        )}
                    </div>
                )}
                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                )}
            </div>

            {/* List */}
            <div className="card border border-cream-300/60 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Rechercher une adresse..."
                        className="input-field flex-1"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                    {data?.enforced && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={clearMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                            <Trash2 size={16} />
                            Vider la liste
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-cream-300 border-t-accent-500" />
                    </div>
                ) : data && data.entries.length > 0 ? (
                    <>
                        {/* Phones: one card per address */}
                        <ul className="md:hidden divide-y divide-cream-200">
                            {data.entries.map((entry) => (
                                <li key={entry.id} className="py-3 flex items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-atlas-800 font-mono break-all">{entry.email}</p>
                                        <p className="text-xs text-atlas-500">
                                            {entry.account
                                                ? `${entry.account.firstName} ${entry.account.lastName} · dernière connexion ${formatDate(entry.account.lastLoginAt) || '—'}`
                                                : 'Jamais connecté'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm(`Retirer ${entry.email} de la liste ? Cet étudiant n'aura plus accès.`)) {
                                                removeMutation.mutate(entry.id);
                                            }
                                        }}
                                        disabled={removeMutation.isPending}
                                        aria-label={`Retirer ${entry.email}`}
                                        className="p-2 rounded-lg text-atlas-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-cream-50/50">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Email</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Compte</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Ajoutée le</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cream-200">
                                    {data.entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-cream-50/50 transition-colors">
                                            <td className="py-3 px-4 text-sm text-atlas-800 font-mono">{entry.email}</td>
                                            <td className="py-3 px-4 text-sm">
                                                {entry.account ? (
                                                    <div>
                                                        <p className="font-medium text-atlas-900">
                                                            {entry.account.firstName} {entry.account.lastName}
                                                        </p>
                                                        <p className="text-xs text-atlas-500">
                                                            Dernière connexion : {formatDate(entry.account.lastLoginAt) || '—'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-atlas-400">Jamais connecté</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-atlas-600">{formatDate(entry.addedAt)}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm(`Retirer ${entry.email} de la liste ? Cet étudiant n'aura plus accès.`)) {
                                                            removeMutation.mutate(entry.id);
                                                        }
                                                    }}
                                                    disabled={removeMutation.isPending}
                                                    aria-label={`Retirer ${entry.email}`}
                                                    className="p-2 rounded-lg text-atlas-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {data.pages > 1 && (
                            <div className="flex items-center justify-between pt-4 text-sm text-atlas-600">
                                <span>
                                    {data.total} adresse{data.total > 1 ? 's' : ''} · page {data.page}/{data.pages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="p-2 rounded-lg border border-cream-300 hover:bg-cream-100 disabled:opacity-40"
                                        aria-label="Page précédente"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                                        disabled={page >= data.pages}
                                        className="p-2 rounded-lg border border-cream-300 hover:bg-cream-100 disabled:opacity-40"
                                        aria-label="Page suivante"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-center py-12 text-atlas-500">
                        {search ? 'Aucune adresse ne correspond à la recherche.' : 'Aucune adresse dans la liste pour le moment.'}
                    </p>
                )}
            </div>
        </div>
    );
}
