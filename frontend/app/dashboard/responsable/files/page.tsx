'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI, structureAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FileText, Download, Edit, Trash2, Search, X, Image as ImageIcon } from 'lucide-react';
import { generateThumbnailUrl, getFileCategoryColor } from '@/lib/utils/fileHelpers';

export default function FilesPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [page, setPage] = useState(1);
    const [editingFile, setEditingFile] = useState<any>(null);
    const [editFileName, setEditFileName] = useState('');
    const [editModule, setEditModule] = useState('');
    const [editFileCategory, setEditFileCategory] = useState<'Cours' | 'TD' | 'TP' | 'EXAM' | 'Autre'>('Autre');
    const [editFileLabel, setEditFileLabel] = useState('');

    // Fetch academic structure for module list
    const { data: structureData } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure;
        },
    });

    const selectedCycle = structureData?.cycles?.find((c: any) => c.name === user?.assignedFiliere);
    const selectedYearData = selectedCycle?.years?.find((y: any) => y.code === user?.assignedYear);
    const modules = (
        selectedYearData?.semesters?.flatMap((s: any) => (s.modules as string[]) || []) || []
    ) as string[];

    // Fetch files
    const { data: filesData, isLoading } = useQuery({
        queryKey: ['responsable-files', searchQuery, selectedModule, selectedCategory, page],
        queryFn: async () => {
            const params: any = { page, limit: 10 };
            if (searchQuery) params.search = searchQuery;
            if (selectedModule) params.module = selectedModule;
            if (selectedCategory) params.fileCategory = selectedCategory;

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
        setEditFileName(file.displayName || file.fileName);
        setEditModule(file.module);
        setEditFileCategory(file.fileCategory || 'Autre');
        setEditFileLabel(file.fileLabel || '');
    };

    const handleSaveEdit = () => {
        if (!editFileName || !editModule) return;

        updateMutation.mutate({
            id: editingFile._id,
            data: {
                fileName: editFileName,
                module: editModule,
                fileCategory: editFileCategory,
                fileLabel: editFileLabel.trim() || undefined,
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
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mes fichiers</h1>
                <p className="text-gray-600 mt-2">
                    Gérer vos ressources pour {user?.assignedYear} - {user?.assignedFiliere}
                </p>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Tous les types</option>
                            <option value="Cours">Cours</option>
                            <option value="TD">TD</option>
                            <option value="TP">TP</option>
                            <option value="EXAM">EXAM</option>
                            <option value="Autre">Autre</option>
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
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Aperçu</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fichier</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Module</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taille</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filesData.files.map((file: any) => {
                                        const categoryColors = getFileCategoryColor(file.fileCategory || 'Autre');
                                        const thumbnailUrl = generateThumbnailUrl(file.fileUrl, file.fileType);

                                        return (
                                            <tr key={file._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    {file.fileType === 'pdf' ? (
                                                        <img
                                                            src={thumbnailUrl}
                                                            alt="Preview"
                                                            className="w-12 h-12 object-cover rounded border border-gray-200"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                                            <FileText size={24} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={16} className="text-gray-400" />
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {file.displayName || file.fileName}
                                                            </span>
                                                        </div>
                                                        {file.fileLabel && (
                                                            <span className="text-xs text-gray-600 italic ml-6">
                                                                {file.fileLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
                                                        {file.fileCategory || 'Autre'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{file.module}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{formatFileSize(file.fileSize)}</td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{formatDate(file.createdAt)}</td>
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
                                                            onClick={() => handleDelete(file._id, file.displayName || file.fileName)}
                                                            className="text-red-500 hover:text-red-600 p-2"
                                                            title="Supprimer"
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                            <button onClick={() => setEditingFile(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du fichier</label>
                                <input
                                    type="text"
                                    value={editFileName}
                                    onChange={(e) => setEditFileName(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                                <select value={editModule} onChange={(e) => setEditModule(e.target.value)} className="input-field">
                                    {modules.map((mod: string) => (
                                        <option key={mod} value={mod}>
                                            {mod}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type de fichier</label>
                                <select
                                    value={editFileCategory}
                                    onChange={(e) => setEditFileCategory(e.target.value as any)}
                                    className="input-field"
                                >
                                    <option value="Cours">Cours</option>
                                    <option value="TD">TD</option>
                                    <option value="TP">TP</option>
                                    <option value="EXAM">EXAM</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Label personnalisé (optionnel)</label>
                                <input
                                    type="text"
                                    value={editFileLabel}
                                    onChange={(e) => setEditFileLabel(e.target.value)}
                                    placeholder='Ex: "Cours n°1", "TD Chapitre 3"'
                                    className="input-field"
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingFile(null)} className="btn-outline flex-1">
                                Annuler
                            </button>
                            <button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="btn-primary flex-1">
                                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
