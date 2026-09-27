'use client';

import { Star } from 'lucide-react';
import { MAX_SAVED_PARCOURS, useSavedParcours } from '@/hooks/useSavedParcours';
import { SavedParcours } from '@/types';

interface SaveParcoursButtonProps {
    parcours: Omit<SavedParcours, 'id'>;
    variant?: 'light' | 'dark';
}

// Toggles a parcours in "Mes parcours" (disabled once the maximum is reached)
export default function SaveParcoursButton({ parcours, variant = 'light' }: SaveParcoursButtonProps) {
    const { findSaved, isFull, save, remove, isSaving, error } = useSavedParcours();
    const existing = findSaved(parcours);
    const blocked = !existing && isFull;

    const toggle = async () => {
        try {
            if (existing) {
                await remove(existing.id);
            } else {
                await save(parcours);
            }
        } catch {
            // Message shown below from the mutation error
        }
    };

    const styles =
        variant === 'dark'
            ? 'border-white/25 text-cream-50 hover:bg-white/10'
            : 'border-atlas-300 text-atlas-700 bg-white hover:border-accent-500 hover:text-accent-600';

    return (
        <div className="inline-flex flex-col items-center">
            <button
                type="button"
                onClick={toggle}
                disabled={isSaving || blocked}
                title={blocked ? `Maximum ${MAX_SAVED_PARCOURS} parcours enregistrés` : undefined}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles}`}
            >
                <Star size={16} className={existing ? 'fill-current text-accent-500' : ''} />
                {existing ? 'Parcours enregistré' : 'Enregistrer ce parcours'}
            </button>
            {blocked && (
                <span className={`mt-1 text-xs ${variant === 'dark' ? 'text-cream-200/80' : 'text-atlas-500'}`}>
                    Maximum {MAX_SAVED_PARCOURS} atteint : retirez-en un depuis l&apos;accueil
                </span>
            )}
            {error?.response?.data?.message && (
                <span className="mt-1 text-xs text-red-500">{error.response.data.message}</span>
            )}
        </div>
    );
}
