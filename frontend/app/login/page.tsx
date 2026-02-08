'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import Image from 'next/image';

const LOGIN_BG = '#192436';
const LOGIN_GRADIENT_LIGHT = '#243247';
const LOGIN_GRADIENT_DARK = '#0f1622';

export default function LoginPage() {
    const router = useRouter();
    const { login, error, isLoading, clearError } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(email, password);
            const user = useAuthStore.getState().user;
            if (user?.role === 'superadmin') {
                router.push('/dashboard/superadmin');
            } else {
                router.push('/dashboard/responsable');
            }
        } catch (error) {
            // Error is handled by the store
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(160deg, ${LOGIN_GRADIENT_LIGHT}99 0%, ${LOGIN_BG} 40%, ${LOGIN_GRADIENT_DARK} 100%), url(/hero-bg.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="max-w-md w-full relative z-10">
                <div
                    className="rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/10"
                    style={{
                        background: `linear-gradient(180deg, ${LOGIN_GRADIENT_LIGHT} 0%, ${LOGIN_BG} 100%)`,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                    }}
                >
                    <div className="flex flex-col items-center mb-8">
                        <Link href="/" className="block mb-5">
                            <Image
                                src="/ensa-share_logo_white.png"
                                alt="ENSA-SHARE"
                                width={280}
                                height={90}
                                className="h-20 w-auto max-w-[280px]"
                            />
                        </Link>
                        <p className="text-white/70 text-sm tracking-wide">Connexion à votre espace</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/20 border border-red-400/40 text-red-200 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                                placeholder="votre.email@ensa.ac.ma"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 hover:opacity-95"
                            style={{
                                background: `linear-gradient(135deg, ${LOGIN_GRADIENT_LIGHT} 0%, ${LOGIN_BG} 100%)`,
                                boxShadow: '0 4px 14px 0 rgba(0,0,0,0.25), inset 0 1px 0 0 rgba(255,255,255,0.1)',
                            }}
                        >
                            {isLoading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                                    Connexion en cours...
                                </span>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                        >
                            ← Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>

                <div
                    className="mt-6 rounded-xl p-4 border border-white/10"
                    style={{ background: 'rgba(25,36,54,0.6)', backdropFilter: 'blur(12px)' }}
                >
                    <p className="font-semibold mb-3 text-white/90 text-sm">Connexion rapide (test) :</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('admin@ensa.ac.ma');
                                setPassword('Admin@123');
                            }}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/90 transition-colors border border-white/20 hover:bg-white/10"
                        >
                            Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('lyamani.ismail@etu.uae.ac.ma');
                                setPassword('12345678');
                            }}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/90 transition-colors border border-white/20 hover:bg-white/10"
                        >
                            Responsable
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
