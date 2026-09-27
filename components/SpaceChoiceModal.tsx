'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Library } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// Right after a responsable or admin signs in on the home page:
// go to their space, or stay on the public site to browse documents.
export default function SpaceChoiceModal() {
    const router = useRouter();
    const { user, justSignedIn, acknowledgeSignIn } = useAuthStore();
    const primaryRef = useRef<HTMLButtonElement>(null);

    const isStaff = user?.role === 'responsable' || user?.role === 'superadmin';
    const open = justSignedIn && isStaff;

    useEffect(() => {
        if (!open) return;
        primaryRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') acknowledgeSignIn();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, acknowledgeSignIn]);

    // Students are never asked; just clear the flag
    useEffect(() => {
        if (justSignedIn && user && !isStaff) acknowledgeSignIn();
    }, [justSignedIn, user, isStaff, acknowledgeSignIn]);

    if (!open) return null;

    const dashboardHref = user.role === 'superadmin' ? '/dashboard/superadmin' : '/dashboard/responsable';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={acknowledgeSignIn}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="space-choice-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-cream-300/60 bg-white p-6 text-center shadow-lg"
            >
                <h2 id="space-choice-title" className="text-xl font-bold text-atlas-800">
                    Bienvenue, {user.firstName}
                </h2>
                <p className="mt-2 text-sm text-atlas-600">Où souhaitez-vous aller ?</p>

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        ref={primaryRef}
                        type="button"
                        onClick={() => {
                            acknowledgeSignIn();
                            router.push(dashboardHref);
                        }}
                        className="btn-primary inline-flex items-center justify-center gap-2 py-3"
                    >
                        <LayoutDashboard size={18} />
                        Aller à mon espace
                    </button>
                    <button
                        type="button"
                        onClick={acknowledgeSignIn}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cream-300 px-4 py-3 text-sm font-semibold text-atlas-700 hover:border-atlas-400 hover:bg-cream-50 transition-colors"
                    >
                        <Library size={18} />
                        Rester sur l&apos;accueil
                    </button>
                </div>
            </div>
        </div>
    );
}
