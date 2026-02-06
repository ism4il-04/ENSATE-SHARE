'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

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
            // Redirect based on role
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
        <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">ENSA-SHARE</h1>
                    <p className="text-primary-100">Connexion à votre espace</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-primary-100 p-3 rounded-full">
                            <LogIn className="text-primary-500" size={32} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-field"
                                placeholder="votre.email@ensa.ac.ma"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-primary-500 hover:text-primary-600 text-sm">
                            ← Retour à l'accueil
                        </Link>
                    </div>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
                    <p className="font-semibold mb-2">Comptes de démonstration :</p>
                    <p>Superadmin: admin@ensa.ac.ma / Admin@123</p>
                </div>
            </div>
        </div>
    );
}
