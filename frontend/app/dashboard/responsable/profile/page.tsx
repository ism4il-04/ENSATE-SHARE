'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api';
import {
    Mail,
    User,
    Calendar,
    BookOpen,
    Shield,
    Lock,
    Save,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Pencil,
} from 'lucide-react';

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();

    // Info editing
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.email || '');

    // Password editing
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    // Feedback
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const isSuperadmin = user?.role === 'superadmin';

    const handleSaveInfo = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload: any = { firstName, lastName };
            if (isSuperadmin) payload.email = email;
            const res = await authAPI.updateProfile(payload);
            setUser(res.data.user);
            setSuccess('Informations mises à jour avec succès');
            setIsEditingInfo(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await authAPI.updateProfile({ currentPassword, newPassword });
            setSuccess('Mot de passe mis à jour avec succès');
            setIsEditingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const cancelEditInfo = () => {
        setIsEditingInfo(false);
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setEmail(user?.email || '');
        setError('');
    };

    const cancelEditPassword = () => {
        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    };

    return (
        <div className="p-6 sm:p-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-atlas-800">Mon profil</h1>
                <p className="text-atlas-500 mt-1">Gérer vos informations personnelles</p>
            </div>

            {/* Feedback messages */}
            {success && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm animate-in fade-in">
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

            {/* Profile Header Card */}
            <div className="card border border-cream-300/60 shadow-sm mb-6">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-200/50">
                        <span className="text-white font-bold text-2xl">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-atlas-900">
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-sm text-atlas-500 mt-0.5">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
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

            {/* Personal Info Card */}
            <div className="card border border-cream-300/60 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <User size={18} className="text-atlas-500" />
                        <h3 className="text-lg font-semibold text-atlas-800">Informations personnelles</h3>
                    </div>
                    {!isEditingInfo && (
                        <button
                            onClick={() => { setIsEditingInfo(true); setSuccess(''); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent-600 hover:bg-accent-50 border border-accent-200 transition-colors"
                        >
                            <Pencil size={14} />
                            Modifier
                        </button>
                    )}
                </div>

                {isEditingInfo ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-1.5">Prénom</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-atlas-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-1.5">Nom</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-atlas-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-all"
                                />
                            </div>
                        </div>
                        {isSuperadmin && (
                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-atlas-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-all"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSaveInfo}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Save size={16} />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                            <button
                                onClick={cancelEditInfo}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-atlas-600 hover:bg-cream-100 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50/60">
                                <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center">
                                    <User size={16} className="text-atlas-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-atlas-400 font-medium">Prénom</p>
                                    <p className="text-sm text-atlas-900 font-medium">{user?.firstName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50/60">
                                <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center">
                                    <User size={16} className="text-atlas-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-atlas-400 font-medium">Nom</p>
                                    <p className="text-sm text-atlas-900 font-medium">{user?.lastName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50/60">
                            <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center">
                                <Mail size={16} className="text-atlas-500" />
                            </div>
                            <div>
                                <p className="text-xs text-atlas-400 font-medium">Email</p>
                                <p className="text-sm text-atlas-900 font-medium">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Card */}
            <div className="card border border-cream-300/60 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Lock size={18} className="text-atlas-500" />
                        <h3 className="text-lg font-semibold text-atlas-800">Sécurité</h3>
                    </div>
                    {!isEditingPassword && (
                        <button
                            onClick={() => { setIsEditingPassword(true); setSuccess(''); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent-600 hover:bg-accent-50 border border-accent-200 transition-colors"
                        >
                            <Pencil size={14} />
                            Modifier
                        </button>
                    )}
                </div>

                {isEditingPassword ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-atlas-700 mb-1.5">Mot de passe actuel</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPw ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-300 bg-white text-atlas-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-atlas-400 hover:text-atlas-600 transition-colors"
                                >
                                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-1.5">Nouveau mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showNewPw ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-300 bg-white text-atlas-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-all"
                                        placeholder="Min. 6 caractères"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPw(!showNewPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-atlas-400 hover:text-atlas-600 transition-colors"
                                    >
                                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-1.5">Confirmer</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-white text-atlas-900 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSavePassword}
                                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Save size={16} />
                                {saving ? 'Enregistrement...' : 'Mettre à jour'}
                            </button>
                            <button
                                onClick={cancelEditPassword}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-atlas-600 hover:bg-cream-100 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-50/60">
                        <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center">
                            <Lock size={16} className="text-atlas-500" />
                        </div>
                        <div>
                            <p className="text-xs text-atlas-400 font-medium">Mot de passe</p>
                            <p className="text-sm text-atlas-900 font-medium">••••••••</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
