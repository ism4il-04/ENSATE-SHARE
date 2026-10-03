'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, structureAPI } from '@/lib/api';
import { UserPlus, Edit, Trash2, X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function UsersPage() {
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        assignedYear: '',
        assignedFiliere: '',
    });
    const [notice, setNotice] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiliere, setSelectedFiliere] = useState('');

    // Fetch users
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await usersAPI.getUsers();
            return response.data.users;
        },
    });

    // Fetch academic structure
    const { data: structureData } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure;
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => usersAPI.createUser(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setNotice(response.data.message);
            closeModal();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => usersAPI.updateUser(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            // Only close modal when it was an edit form submit (variables have more than isActive)
            if (Object.keys(variables.data).length > 1) {
                setNotice('Responsable mis à jour');
                closeModal();
            }
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersAPI.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });


    // Filter and Group Users
    const filteredUsers = usersData?.filter((user: any) => {
        const matchesSearch =
            (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesFiliere = selectedFiliere ? user.assignedFiliere === selectedFiliere : true;

        // Filter out superadmin from display if wanted, observing user.role === 'responsable'
        // For now we show all, but typically this page is for managing responsables
        const isResponsable = user.role === 'responsable';

        return matchesSearch && matchesFiliere && isResponsable;
    }) || [];

    const groupedUsers = filteredUsers.reduce((acc: any, user: any) => {
        const filiere = user.assignedFiliere || 'Non assigné';
        if (!acc[filiere]) {
            acc[filiere] = [];
        }
        acc[filiere].push(user);
        return acc;
    }, {});

    // Sort users within groups by Year Code
    Object.keys(groupedUsers).forEach(key => {
        groupedUsers[key].sort((a: any, b: any) => a.assignedYear?.localeCompare(b.assignedYear));
    });

    const openCreateModal = () => {
        setEditingUser(null);
        createMutation.reset();
        updateMutation.reset();
        setNotice('');
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            assignedYear: '',
            assignedFiliere: '',
        });
        setShowModal(true);
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        createMutation.reset();
        updateMutation.reset();
        setNotice('');
        setFormData({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            assignedYear: user.assignedYear || '',
            assignedFiliere: user.assignedFiliere || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData: any = {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            assignedYear: formData.assignedYear,
            assignedFiliere: formData.assignedFiliere,
        };

        if (editingUser) {
            updateMutation.mutate({ id: editingUser._id, data: submitData });
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleDelete = (user: any) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ?`)) {
            deleteMutation.mutate(user._id);
        }
    };

    const handleToggleActive = (user: any) => {
        const willBeActive = !user.isActive;
        if (willBeActive) {
            updateMutation.mutate({ id: user._id, data: { isActive: true } });
        } else {
            if (confirm(`Désactiver le compte de ${user.firstName} ${user.lastName} ? L'utilisateur ne pourra plus se connecter.`)) {
                updateMutation.mutate({ id: user._id, data: { isActive: false } });
            }
        }
    };

    const selectedCycleData = structureData?.cycles?.find((c: any) => c.name === formData.assignedFiliere);

    const apiError = (error: unknown) =>
        (error as any)?.response?.data?.message || (error ? 'Une erreur est survenue' : '');
    const formError = apiError(createMutation.error || updateMutation.error);
    const pageError = showModal ? '' : apiError(updateMutation.error || deleteMutation.error);
    const emailChanged =
        !!editingUser && formData.email.trim().toLowerCase() !== (editingUser.email || '').toLowerCase();

    return (
        <div className="md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-atlas-800">Gestion des utilisateurs</h1>
                    <p className="text-atlas-600 mt-2">Gérer les comptes responsables</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <UserPlus size={20} />
                    Nouveau responsable
                </button>
            </div>

            {notice && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                    <CheckCircle size={16} />
                    {notice}
                </div>
            )}
            {pageError && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {pageError}
                </div>
            )}

            {/* Filters */}
            <div className="card border border-cream-300/60 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        className="input-field w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="md:w-1/3">
                    <select
                        className="input-field w-full"
                        value={selectedFiliere}
                        onChange={(e) => setSelectedFiliere(e.target.value)}
                    >
                        <option value="">Toutes les filières</option>
                        {structureData?.cycles?.map((c: any) => (
                            <option key={c.name} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Groups */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-12 card border border-cream-300/60">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cream-300 border-t-accent-500" />
                    </div>
                ) : Object.keys(groupedUsers).length > 0 ? (
                    Object.entries(groupedUsers).map(([filiere, users]: [string, any]) => (
                        <div key={filiere} className="card border border-cream-300/60 overflow-hidden">
                            <div className="bg-cream-50/80 px-3 sm:px-6 py-3 border-b border-cream-300/60 flex justify-between items-center">
                                <h3 className="font-semibold text-atlas-800 flex flex-wrap items-center gap-2">
                                    <span className="w-2 h-8 bg-accent-500 rounded-full inline-block" />
                                    {filiere}
                                    <span className="text-xs font-normal text-atlas-600 bg-white px-2 py-1 rounded-full border border-cream-300 ml-2">
                                        {users.length} responsable{users.length > 1 ? 's' : ''}
                                    </span>
                                </h3>
                            </div>
                            {/* Phones: one card per responsable, every action visible */}
                            <ul className="md:hidden divide-y divide-cream-200">
                                {users.map((user: any) => (
                                    <li key={user._id} className="py-3">
                                        <div className="flex items-start gap-3">
                                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold bg-atlas-100 text-atlas-800 min-w-[3rem]">
                                                {user.assignedYear}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-atlas-900">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-atlas-600 font-mono break-all">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 pl-[60px]">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(user)}
                                                disabled={updateMutation.isPending && (updateMutation.variables as { id: string })?.id === user._id}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium disabled:opacity-60 ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`} />
                                                {user.isActive ? 'Actif' : 'Inactif'}
                                            </button>
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 px-3 py-1 text-xs font-medium text-atlas-700"
                                            >
                                                <Edit size={14} />
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                disabled={deleteMutation.isPending}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 disabled:opacity-50"
                                            >
                                                <Trash2 size={14} />
                                                Supprimer
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cream-50/50">
                                        <tr>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Année</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Responsable</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Email</th>
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Statut</th>
                                            <th className="text-right py-3 px-6 text-xs font-semibold text-atlas-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cream-200">
                                        {users.map((user: any) => (
                                            <tr key={user._id} className="hover:bg-cream-50/50 transition-colors">
                                                <td className="py-3 px-6">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold bg-atlas-100 text-atlas-800 min-w-[3rem]">
                                                        {user.assignedYear}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6">
                                                    <div className="font-medium text-atlas-900">{user.firstName} {user.lastName}</div>
                                                </td>
                                                <td className="py-3 px-6 text-sm text-atlas-600 font-mono">{user.email}</td>
                                                <td className="py-3 px-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleActive(user)}
                                                        disabled={updateMutation.isPending && (updateMutation.variables as { id: string })?.id === user._id}
                                                        title={user.isActive ? "Cliquer pour désactiver le compte (l'utilisateur ne pourra plus se connecter)" : 'Cliquer pour réactiver le compte'}
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 disabled:opacity-60 ${user.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`} />
                                                        {user.isActive ? 'Actif' : 'Inactif'}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="text-atlas-500 hover:text-accent-600 p-1.5 rounded-lg hover:bg-accent-50 transition-colors"
                                                            title="Modifier"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="text-atlas-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Supprimer"
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 card border border-dashed border-cream-300">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-cream-200 mb-4">
                            <UserPlus className="h-6 w-6 text-atlas-400" />
                        </div>
                        <h3 className="text-lg font-medium text-atlas-800">Aucun responsable trouvé</h3>
                        <p className="mt-1 text-sm text-atlas-600">Essayez de modifier vos filtres ou créez un nouveau compte.</p>
                        <div className="mt-6">
                            <button onClick={openCreateModal} className="btn-primary inline-flex items-center">
                                <UserPlus size={18} className="mr-2" />
                                Nouveau responsable
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg border border-cream-300/60 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-atlas-800">
                                {editingUser ? 'Modifier le responsable' : 'Nouveau responsable'}
                            </h3>
                            <button onClick={closeModal} className="text-atlas-400 hover:text-atlas-600 p-1 rounded-lg hover:bg-cream-100">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formError && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {formError}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-atlas-700 mb-2">
                                        Prénom <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-atlas-700 mb-2">
                                        Nom <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-atlas-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div className="flex items-start gap-2 rounded-xl bg-cream-50 border border-cream-300/60 px-4 py-3 text-sm text-atlas-600">
                                <Info size={16} className="shrink-0 mt-0.5 text-atlas-500" />
                                <p>
                                    Pas de mot de passe : le responsable se connecte avec « Se connecter avec Google »
                                    en utilisant exactement cette adresse (Gmail ou @etu.uae.ac.ma).
                                    {emailChanged &&
                                        " En changeant l'adresse, l'ancien mot de passe est supprimé et les sessions ouvertes sont fermées."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-atlas-700 mb-2">
                                        Filière (cycle) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.assignedFiliere}
                                        onChange={(e) => setFormData({ ...formData, assignedFiliere: e.target.value, assignedYear: '' })}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Sélectionnez une filière</option>
                                        {structureData?.cycles?.map((c: any) => (
                                            <option key={c.name} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-atlas-700 mb-2">
                                        Année (code) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.assignedYear}
                                        onChange={(e) => setFormData({ ...formData, assignedYear: e.target.value })}
                                        className="input-field"
                                        required
                                        disabled={!formData.assignedFiliere}
                                    >
                                        <option value="">Sélectionnez une année</option>
                                        {selectedCycleData?.years?.map((y: any) => (
                                            <option key={y.code} value={y.code}>
                                                {y.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending
                                        ? 'Enregistrement...'
                                        : editingUser
                                            ? 'Mettre à jour'
                                            : 'Créer'}
                                </button>
                                <button type="button" onClick={closeModal} className="btn-outline flex-1">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
