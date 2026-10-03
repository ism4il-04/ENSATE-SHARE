'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import GoogleSignInButton from '@/components/GoogleSignInButton';

// The only sign-in on the site, shown in place of the parcours picker until the visitor signs in.
// Students, responsables and admins all sign in with Google. The access-code field only appears when
// the server asks for it (non-university address while a temporary code is active).
export default function SignInCard() {
    const { loginWithGoogle, error, isLoading, clearError } = useAuthStore();
    const [pendingCredential, setPendingCredential] = useState<string | null>(null);
    const [accessCode, setAccessCode] = useState('');

    const signIn = async (credential: string, code?: string) => {
        clearError();
        try {
            await loginWithGoogle(credential, code);
            setPendingCredential(null);
        } catch (err: any) {
            // Keep the Google sign-in: the code is sent along with it, no need to click Google again
            if (err?.response?.data?.needsAccessCode) setPendingCredential(credential);
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

            {pendingCredential ? (
                <form
                    className="mt-6 space-y-3 text-left"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (accessCode.trim()) signIn(pendingCredential, accessCode.trim());
                    }}
                >
                    <label htmlFor="access-code" className="flex items-center gap-2 text-sm font-medium text-atlas-700">
                        <KeyRound size={16} />
                        Code d&apos;accès temporaire
                    </label>
                    <input
                        id="access-code"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        placeholder="ENSA-XXXXXX"
                        autoComplete="off"
                        autoFocus
                        className="input-field w-full font-mono tracking-wider"
                    />
                    <button type="submit" disabled={isLoading || !accessCode.trim()} className="btn-primary w-full disabled:opacity-50">
                        {isLoading ? 'Connexion en cours…' : 'Valider le code'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPendingCredential(null);
                            setAccessCode('');
                            clearError();
                        }}
                        className="w-full text-xs text-atlas-500 hover:text-atlas-700"
                    >
                        Utiliser un autre compte Google
                    </button>
                </form>
            ) : (
                <div className="mt-6">
                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                        <GoogleSignInButton onCredential={(credential) => signIn(credential)} />
                    ) : (
                        <p className="text-sm text-atlas-500">La connexion Google n&apos;est pas encore configurée.</p>
                    )}
                    {isLoading && <p className="mt-3 text-sm text-atlas-500">Connexion en cours…</p>}
                </div>
            )}

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
    );
}
