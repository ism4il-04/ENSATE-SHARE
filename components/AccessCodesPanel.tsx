'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accessCodesAPI } from '@/lib/api';
import { Check, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';

interface AccessCode {
    id: number;
    code: string;
    label: string;
    expiresAt: string;
    accounts: number;
    active: boolean;
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

// Temporary access codes (Étudiants page): students without a university address yet sign in with
// any Google account plus the code. Deleting a code deletes the accounts created with it.
export default function AccessCodesPanel() {
    const queryClient = useQueryClient();
    const [label, setLabel] = useState('1re année');
    const [expiresOn, setExpiresOn] = useState(inDays(60));
    const [customCode, setCustomCode] = useState('');
    const [copied, setCopied] = useState<number | null>(null);

    const { data: codes = [] } = useQuery({
        queryKey: ['accessCodes'],
        queryFn: async () => (await accessCodesAPI.list()).data.codes as AccessCode[],
    });
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['accessCodes'] });
        queryClient.invalidateQueries({ queryKey: ['studentAllowlist'] });
    };

    const createMutation = useMutation({
        // End of the chosen day, local time
        mutationFn: () =>
            accessCodesAPI.create({
                label,
                expiresAt: new Date(`${expiresOn}T23:59:59`).toISOString(),
                code: customCode.trim() || undefined,
            }),
        onSuccess: () => {
            setCustomCode('');
            refresh();
        },
    });
    const removeMutation = useMutation({ mutationFn: (id: number) => accessCodesAPI.remove(id), onSuccess: refresh });

    const copy = async (c: AccessCode) => {
        try {
            await navigator.clipboard.writeText(c.code);
            setCopied(c.id);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            /* clipboard unavailable: the code is visible anyway */
        }
    };

    const error = (createMutation.error || removeMutation.error) as any;

    return (
        <div className="card border border-cream-300/60 mb-6">
            <h2 className="text-lg font-semibold text-atlas-800 flex items-center gap-2 mb-1">
                <KeyRound size={18} />
                Accès temporaire (code)
            </h2>
            <p className="text-sm text-atlas-600 mb-4">
                Pour les étudiants qui n&apos;ont pas encore d&apos;adresse @etu.uae.ac.ma (ex. 1re année) : ils se connectent avec
                n&apos;importe quel compte Google puis saisissent le code. Le champ n&apos;apparaît que si un code est actif.
                Supprimer un code, ou atteindre sa date d&apos;expiration, supprime les comptes créés avec lui.
            </p>

            {codes.length > 0 && (
                <ul className="mb-5 divide-y divide-cream-200 rounded-xl border border-cream-300/60">
                    {codes.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <button
                                type="button"
                                onClick={() => copy(c)}
                                title="Copier le code"
                                className="inline-flex items-center gap-2 rounded-lg bg-cream-100 px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-atlas-800 hover:bg-cream-200"
                            >
                                {c.code}
                                {copied === c.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                            </button>
                            <div className="flex-1 min-w-[180px] text-sm">
                                <p className="font-medium text-atlas-800">{c.label}</p>
                                <p className="text-xs text-atlas-500">
                                    {c.active ? `Expire le ${formatDate(c.expiresAt)}` : 'Expiré (suppression automatique cette nuit)'} ·{' '}
                                    {c.accounts} compte{c.accounts > 1 ? 's' : ''} créé{c.accounts > 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (
                                        confirm(
                                            `Supprimer le code ${c.code} ? ${c.accounts} compte${c.accounts > 1 ? 's' : ''} temporaire${c.accounts > 1 ? 's' : ''} ser${c.accounts > 1 ? 'ont' : 'a'} supprimé${c.accounts > 1 ? 's' : ''} et perdr${c.accounts > 1 ? 'ont' : 'a'} l'accès immédiatement.`
                                        )
                                    ) {
                                        removeMutation.mutate(c.id);
                                    }
                                }}
                                disabled={removeMutation.isPending}
                                aria-label={`Supprimer le code ${c.code}`}
                                className="p-2 rounded-lg text-atlas-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <form
                className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
                onSubmit={(e) => {
                    e.preventDefault();
                    createMutation.mutate();
                }}
            >
                <label className="text-sm text-atlas-700">
                    Libellé
                    <input value={label} onChange={(e) => setLabel(e.target.value)} className="input-field mt-1 w-full" maxLength={100} required />
                </label>
                <label className="text-sm text-atlas-700">
                    Expire le
                    <input type="date" value={expiresOn} min={inDays(1)} max={inDays(365)} onChange={(e) => setExpiresOn(e.target.value)} className="input-field mt-1 w-full" required />
                </label>
                <label className="text-sm text-atlas-700">
                    Code (facultatif)
                    <input
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        placeholder="généré si vide"
                        className="input-field mt-1 w-full font-mono"
                        maxLength={40}
                    />
                </label>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50">
                    <Plus size={16} />
                    Créer
                </button>
            </form>

            {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error.response?.data?.message || 'Une erreur est survenue'}
                </div>
            )}
        </div>
    );
}
