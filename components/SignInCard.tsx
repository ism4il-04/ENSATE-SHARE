'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import GoogleSignInButton from '@/components/GoogleSignInButton';

// The only sign-in on the site, shown in place of the parcours picker until the visitor signs in.
// Students, responsables and admins all sign in with Google.
export default function SignInCard() {
    const { loginWithGoogle, error, isLoading, clearError } = useAuthStore();

    const handleCredential = async (credential: string) => {
        clearError();
        try {
            await loginWithGoogle(credential);
        } catch {
            // Error message is shown from the store
        }
    };

    return (
        <div className="max-w-md mx-auto rounded-2xl border-2 border-cream-300 bg-white p-8 text-center shadow-sm">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-cream-200 text-atlas-600">
                <GraduationCap size={28} />
            </span>
            <h3 className="text-xl font-bold text-atlas-800">Connectez-vous pour accéder aux documents</h3>
            <p className="mt-2 text-sm text-atlas-600">
                Réservé aux étudiants de l&apos;ENSA Tétouan. Utilisez votre compte Google universitaire{' '}
                <span className="font-semibold text-atlas-700">@etu.uae.ac.ma</span>.
            </p>

            {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="mt-6">
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                    <GoogleSignInButton onCredential={handleCredential} />
                ) : (
                    <p className="text-sm text-atlas-500">La connexion Google n&apos;est pas encore configurée.</p>
                )}
                {isLoading && <p className="mt-3 text-sm text-atlas-500">Connexion en cours…</p>}
                <p className="mt-4 text-xs text-atlas-500">
                    En vous connectant, vous acceptez les{' '}
                    <Link href="/conditions" className="underline hover:text-accent-600">
                        conditions d&apos;utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link href="/confidentialite" className="underline hover:text-accent-600">
                        politique de confidentialité
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
