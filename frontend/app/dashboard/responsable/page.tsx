'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { filesAPI, statsAPI } from '@/lib/api';
import { Upload, FileText, HardDrive, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { generateThumbnailUrl, getFileCategoryColor } from '@/lib/utils/fileHelpers';

export default function ResponsableDashboard() {
    const { user } = useAuthStore();

    // Fetch responsable's files
    const { data: filesData } = useQuery({
        queryKey: ['responsable-files'],
        queryFn: async () => {
            const response = await filesAPI.getFiles({ limit: 5 });
            return response.data;
        },
    });

    // Calculate stats from files
    const totalFiles = filesData?.total || 0;
    const totalSize = filesData?.files?.reduce((acc: number, file: any) => acc + file.fileSize, 0) || 0;
    const recentFiles = filesData?.files || [];

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
        });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="text-gray-600 mt-2">
                    Bienvenue, {user?.firstName} {user?.lastName}
                </p>
                <div className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">Année:</span> {user?.assignedYear} •
                    <span className="font-medium ml-2">Filière:</span> {user?.assignedFiliere}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total fichiers</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{totalFiles}</p>
                        </div>
                        <div className="bg-primary-100 p-3 rounded-full">
                            <FileText className="text-primary-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Espace utilisé</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {formatFileSize(totalSize)}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <HardDrive className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Ce mois</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {recentFiles.filter((f: any) => {
                                    const uploadDate = new Date(f.createdAt);
                                    const now = new Date();
                                    return uploadDate.getMonth() === now.getMonth() &&
                                        uploadDate.getFullYear() === now.getFullYear();
                                }).length}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link href="/dashboard/responsable/upload" className="card hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary-500 p-4 rounded-lg">
                            <Upload className="text-white" size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Uploader un fichier</h3>
                            <p className="text-sm text-gray-600">Ajouter une nouvelle ressource</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/responsable/files" className="card hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="bg-secondary-500 p-4 rounded-lg">
                            <FileText className="text-white" size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Gérer mes fichiers</h3>
                            <p className="text-sm text-gray-600">Voir et modifier vos fichiers</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Files */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Fichiers récents</h2>
                    <Link href="/dashboard/responsable/files" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                        Voir tout →
                    </Link>
                </div>

                {recentFiles.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Aperçu</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nom du fichier</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Module</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taille</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentFiles.map((file: any) => {
                                    const categoryColors = getFileCategoryColor(file.fileCategory || 'Autre');
                                    const thumbnailUrl = generateThumbnailUrl(file.fileUrl, file.fileType, file.thumbnailLink);

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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-600">Aucun fichier uploadé</p>
                        <Link href="/dashboard/responsable/upload" className="btn-primary mt-4 inline-block">
                            Uploader votre premier fichier
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
