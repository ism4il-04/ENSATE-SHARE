'use client';

import { useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import GoogleSignInButton from '@/components/GoogleSignInButton';

// The only sign-in on the site, shown in place of the parcours picker until the visitor signs in.
// Students, responsables and admins all use Google; the password form stays available for
// staff accounts that can't use Google yet.
export default function SignInCard() {
    const { login, loginWithGoogle, error, isLoading, clearError } = useAuthStore();
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleCredential = async (credential: string) => {
        clearError();
        try {
            // Google sessions last 30 days
            await loginWithGoogle(credential, true);
        } catch {
            // Error message is shown from the store
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        try {
            await login(email, password, rememberMe);
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
            </div>

            <div className="mt-6 pt-5 border-t border-cream-200">
                <button
                    type="button"
                    onClick={() => {
                        setShowPasswordForm((v) => !v);
                        clearError();
                    }}
                    aria-expanded={showPasswordForm}
                    className="inline-flex items-center gap-1 text-xs text-atlas-500 hover:text-atlas-700 transition-colors"
                >
                    Accès équipe : connexion par mot de passe
                    <ChevronDown size={14} className={`transition-transform ${showPasswordForm ? 'rotate-180' : ''}`} />
                </button>

                {showPasswordForm && (
                    <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3 text-left">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="Email"
                            aria-label="Email"
                            className="input-field w-full"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="Mot de passe"
                            aria-label="Mot de passe"
                            className="input-field w-full"
                        />
                        <label className="flex items-center gap-2 text-sm text-atlas-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-cream-300 text-accent-500 focus:ring-accent-300"
                            />
                            Rester connecté
                        </label>
                        <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
                            {isLoading ? 'Connexion en cours…' : 'Se connecter'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
