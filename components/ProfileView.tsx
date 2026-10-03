'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { Mail, User, Calendar, BookOpen, Shield, Save, CheckCircle, AlertCircle, Pencil, KeyRound } from 'lucide-react';

const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-atlas-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-all';

// "Mon profil" for responsables and superadmins: names are editable; the email is the Google
// account used to sign in, so it's shown read-only (an admin changes it from the Users page).
export default function ProfileView() {
    const { user, setUser } = useAuthStore();
    const isSuperadmin = user?.role === 'superadmin';

    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await authAPI.updateProfile({ firstName, lastName });
            setUser(res.data.user);
            setSuccess('Informations mises à jour avec succès');
            setIsEditing(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setError('');
    };

    const InfoRow = ({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string }) => (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50/60">
            <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center">
                <Icon size={16} className="text-atlas-500" />
            </div>
            <div>
                <p className="text-xs text-atlas-400 font-medium">{label}</p>
                <p className="text-sm text-atlas-900 font-medium">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="md:p-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-atlas-800">Mon profil</h1>
                <p className="text-atlas-500 mt-1">Gérer vos informations personnelles</p>
            </div>

            {success && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                    <CheckCircle size={16} />
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="card border border-cream-300/60 shadow-sm mb-6">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-200/50">
                        <span className="text-white font-bold text-2xl">
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-atlas-900">
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-sm text-atlas-500 mt-0.5">{user?.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent-50 text-accent-700 border border-accent-200">
                                <Shield size={12} />
                                {isSuperadmin ? 'Superadmin' : 'Responsable'}
                            </span>
                            {!isSuperadmin && user?.assignedYear && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cream-100 text-atlas-600 border border-cream-300">
                                    <Calendar size={12} />
                                    {user.assignedYear}
                                </span>
                            )}
                            {!isSuperadmin && user?.assignedFiliere && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cream-100 text-atlas-600 border border-cream-300">
                                    <BookOpen size={12} />
                                    {user.assignedFiliere}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal information */}
            <div className="card border border-cream-300/60 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <User size={18} className="text-atlas-500" />
                        <h3 className="text-lg font-semibold text-atlas-800">Informations personnelles</h3>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setIsEditing(true);
                                setSuccess('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent-600 hover:bg-accent-50 border border-accent-200 transition-colors"
                        >
                            <Pencil size={14} />
                            Modifier
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-1.5">Prénom</label>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-1.5">Nom</label>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Save size={16} />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                            <button onClick={cancelEdit} className="px-5 py-2.5 rounded-xl text-sm font-medium text-atlas-600 hover:bg-cream-100 transition-colors">
                                Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow icon={User} label="Prénom" value={user?.firstName} />
                            <InfoRow icon={User} label="Nom" value={user?.lastName} />
                        </div>
                        <InfoRow icon={Mail} label="Email" value={user?.email} />
                    </div>
                )}
            </div>

            {/* Sign-in */}
            <div className="card border border-cream-300/60 shadow-sm">
                <div className="flex items-start gap-3">
                    <KeyRound size={18} className="text-atlas-500 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-atlas-800">Connexion</h3>
                        <p className="mt-1 text-sm text-atlas-600">
                            Vous vous connectez avec « Se connecter avec Google », en utilisant l&apos;adresse{' '}
                            <span className="font-medium text-atlas-800">{user?.email}</span>. Il n&apos;y a pas de mot de
                            passe sur ENSATE-SHARE.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
