'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, structureAPI } from '@/lib/api';
import { UserPlus, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';

export default function UsersPage() {
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        assignedYear: '',
        assignedFiliere: '',
    });
    const [showPassword, setShowPassword] = useState(false);

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            closeModal();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => usersAPI.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            closeModal();
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersAPI.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            assignedYear: '',
            assignedFiliere: '',
        });
        setShowModal(true);
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
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
        setShowPassword(false);
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

        if (formData.password) {
            submitData.password = formData.password;
        }

        if (editingUser) {
            updateMutation.mutate({ id: editingUser._id, data: submitData });
        } else {
            createMutation.mutate({ ...submitData, password: formData.password });
        }
    };

    const handleDelete = (user: any) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ?`)) {
            deleteMutation.mutate(user._id);
        }
    };

    const selectedCycleData = structureData?.cycles?.find((c: any) => c.name === formData.assignedFiliere);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
                    <p className="text-gray-600 mt-2">Gérer les comptes responsables</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <UserPlus size={20} />
                    Nouveau responsable
                </button>
            </div>

            {/* Users Table */}
            <div className="card">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : usersData && usersData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nom</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Année / Filière</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersData.map((user: any) => (
                                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-medium text-gray-900">
                                                {user.firstName} {user.lastName}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="py-3 px-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">{user.assignedYear}</div>
                                                <div className="text-gray-600">{user.assignedFiliere}</div>
                                            </div>
                                        </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.isActive ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="text-blue-500 hover:text-blue-600 p-2"
                                                        title="Modifier"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="text-red-500 hover:text-red-600 p-2"
                                                        title="Supprimer"
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Aucun responsable trouvé</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {editingUser ? 'Modifier le responsable' : 'Nouveau responsable'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mot de passe {!editingUser && <span className="text-red-500">*</span>}
                                    {editingUser && <span className="text-gray-500 text-xs">(laisser vide pour ne pas changer)</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input-field pr-10"
                                        required={!editingUser}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
