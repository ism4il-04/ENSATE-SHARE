'use client';

import Link from 'next/link';
import { Star, X } from 'lucide-react';
import { MAX_SAVED_PARCOURS, parcoursHref, useSavedParcours } from '@/hooks/useSavedParcours';

// "Mes parcours": one-click shortcuts to the user's saved parcours
export default function SavedParcoursList() {
    const { saved, remove, isSaving } = useSavedParcours();

    if (saved.length === 0) {
        return (
            <p className="mb-10 text-center text-sm text-atlas-500">
                <Star size={14} className="inline -mt-0.5 mr-1" />
                Enregistrez jusqu&apos;à {MAX_SAVED_PARCOURS} parcours pour y accéder en un clic.
            </p>
        );
    }

    return (
        <div className="mb-12">
            <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-lg font-semibold text-atlas-800 flex items-center gap-2">
                    <Star size={18} className="text-accent-500 fill-accent-500" />
                    Mes parcours
                </h3>
                <span className="text-xs text-atlas-500">
                    {saved.length}/{MAX_SAVED_PARCOURS}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {saved.map((p) => (
                    <div
                        key={p.id}
                        className="group relative rounded-xl border-2 border-cream-300 bg-white hover:border-atlas-400 hover:shadow-glass-lg transition-all"
                    >
                        <Link href={parcoursHref(p)} className="block px-4 py-3 pr-10">
                            <p className="font-semibold text-atlas-800">
                                {p.year} · {p.semester}
                            </p>
                            <p className="text-xs text-atlas-500 truncate">{p.filiere}</p>
                        </Link>
                        <button
                            type="button"
                            onClick={() => remove(p.id)}
                            disabled={isSaving}
                            aria-label={`Retirer ${p.year} ${p.semester} de mes parcours`}
                            className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-lg text-atlas-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
