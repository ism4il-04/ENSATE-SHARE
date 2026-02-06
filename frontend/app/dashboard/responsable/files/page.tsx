'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI, structureAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FileText, Download, Edit, Trash2, Search, X } from 'lucide-react';

export default function FilesPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [page, setPage] = useState(1);
    const [editingFile, setEditingFile] = useState<any>(null);
    const [editFileName, setEditFileName] = useState('');
    const [editModule, setEditModule] = useState('');

    // Fetch academic structure for module list
    const { data: structureData } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure;
        },
    });

    const modules = structureData?.years
        ?.find((y: any) => y.name === user?.assignedYear)
        ?.filieres?.find((f: any) => f.name === user?.assignedFiliere)
        ?.modules || [];

    // Fetch files
    const { data: filesData, isLoading } = useQuery({
        queryKey: ['responsable-files', searchQuery, selectedModule, page],
        queryFn: async () => {
            const params: any = { page, limit: 10 };
            if (searchQuery) params.search = searchQuery;
            if (selectedModule) params.module = selectedModule;

            const response = await filesAPI.getFiles(params);
            return response.data;
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (fileId: string) => filesAPI.deleteFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['responsable-files'] });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => filesAPI.updateFile(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['responsable-files'] });
            setEditingFile(null);
        },
    });

    const handleDelete = async (fileId: string, fileName: string) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${fileName}" ?`)) {
            deleteMutation.mutate(fileId);
        }
    };

    const handleEdit = (file: any) => {
        setEditingFile(file);
        setEditFileName(file.fileName);
        setEditModule(file.module);
    };

    const handleSaveEdit = () => {
        if (!editFileName || !editModule) return;

        updateMutation.mutate({
            id: editingFile._id,
            data: {
                fileName: editFileName,
                module: editModule,
            },
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mes fichiers</h1>
                <p className="text-gray-600 mt-2">
                    Gérer vos ressources pour {user?.assignedYear} - {user?.assignedFiliere}
                </p>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nom du fichier..."
                                className="input-field pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>

                    {/* Module Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Tous les modules</option>
                            {modules.map((mod: string) => (
                                <option key={mod} value={mod}>
                                    {mod}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Files Table */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {filesData?.total || 0} fichier(s)
                    </h2>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : filesData?.files && filesData.files.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fichier</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Module</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taille</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filesData.files.map((file: any) => (
                                        <tr key={file._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-gray-400" />
                                                    <span className="text-sm text-gray-900">{file.fileName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{file.module}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{formatFileSize(file.fileSize)}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{formatDate(file.uploadedAt)}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={file.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-500 hover:text-primary-600 p-2"
                                                        title="Télécharger"
                                                    >
                                                        <Download size={18} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleEdit(file)}
                                                        className="text-blue-500 hover:text-blue-600 p-2"
                                                        title="Modifier"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(file._id, file.fileName)}
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

                        {/* Pagination */}
                        {filesData.pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Précédent
                                </button>
                                <span className="px-4 py-2">
                                    Page {page} sur {filesData.pages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(filesData.pages, p + 1))}
                                    disabled={page === filesData.pages}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-600">Aucun fichier trouvé</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingFile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Modifier le fichier</h3>
                            <button
                                onClick={() => setEditingFile(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom du fichier
                                </label>
                                <input
                                    type="text"
                                    value={editFileName}
                                    onChange={(e) => setEditFileName(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Module
                                </label>
                                <select
                                    value={editModule}
                                    onChange={(e) => setEditModule(e.target.value)}
                                    className="input-field"
                                >
                                    {modules.map((mod: string) => (
                                        <option key={mod} value={mod}>
                                            {mod}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={updateMutation.isPending}
                                    className="btn-primary flex-1 disabled:opacity-50"
                                >
                                    {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                                <button
                                    onClick={() => setEditingFile(null)}
                                    className="btn-outline flex-1"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
