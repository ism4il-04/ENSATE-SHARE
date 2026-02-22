'use client';

import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '@/lib/api';
import { Users, FileText, HardDrive, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { generateThumbnailUrl, getFileCategoryColor } from '@/lib/utils/fileHelpers';

export default function SuperadminDashboard() {
    // Fetch dashboard stats
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await statsAPI.getDashboardStats();
            return response.data.stats;
        },
    });

    // Fetch file distribution
    const { data: distributionData } = useQuery({
        queryKey: ['file-distribution'],
        queryFn: async () => {
            const response = await statsAPI.getFilesByFiliere();
            return response.data.distribution;
        },
    });

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-cream-300 border-t-accent-500" />
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-atlas-800">Tableau de bord Superadmin</h1>
                <p className="text-atlas-600 mt-2">Vue d'ensemble de la plateforme ENSATE-SHARE</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card border border-cream-300/60 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-atlas-600">Total fichiers</p>
                            <p className="text-3xl font-bold text-atlas-800 mt-1">
                                {statsData?.totalFiles || 0}
                            </p>
                        </div>
                        <div className="bg-accent-100 p-3 rounded-xl">
                            <FileText className="text-accent-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="card border border-cream-300/60 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-atlas-600">Responsables</p>
                            <p className="text-3xl font-bold text-atlas-800 mt-1">
                                {statsData?.totalResponsables || 0}
                            </p>
                        </div>
                        <div className="bg-atlas-100 p-3 rounded-xl">
                            <Users className="text-atlas-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="card border border-cream-300/60 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-atlas-600">Stockage total</p>
                            <p className="text-3xl font-bold text-atlas-800 mt-1">
                                {formatFileSize(statsData?.totalStorage || 0)}
                            </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-xl">
                            <HardDrive className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="card border border-cream-300/60 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-atlas-600">Ce mois</p>
                            <p className="text-3xl font-bold text-atlas-800 mt-1">
                                {statsData?.filesThisMonth || 0}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-xl">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link href="/dashboard/superadmin/users" className="card border border-cream-300/60 hover:shadow-lg hover:border-accent-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="bg-accent-500 p-3 rounded-xl text-white">
                            <Users size={28} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-atlas-800">Gérer les utilisateurs</h3>
                            <p className="text-sm text-atlas-600">Comptes responsables</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/superadmin/files" className="card border border-cream-300/60 hover:shadow-lg hover:border-accent-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="bg-atlas-600 p-3 rounded-xl text-white">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-atlas-800">Tous les fichiers</h3>
                            <p className="text-sm text-atlas-600">Modération globale</p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/superadmin/structure" className="card border border-cream-300/60 hover:shadow-lg hover:border-accent-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="bg-atlas-700 p-3 rounded-xl text-white">
                            <Activity size={28} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-atlas-800">Structure académique</h3>
                            <p className="text-sm text-atlas-600">Années, filières, modules</p>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* File Distribution */}
                <div className="card border border-cream-300/60">
                    <h2 className="text-xl font-semibold text-atlas-800 mb-4">
                        Distribution par filière
                    </h2>
                    {distributionData && distributionData.length > 0 ? (
                        <div className="space-y-4">
                            {distributionData.map((item: any) => (
                                <div key={item._id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-atlas-700">{item._id}</span>
                                        <span className="text-sm text-atlas-600">
                                            {item.count} fichiers ({formatFileSize(item.totalSize)})
                                        </span>
                                    </div>
                                    <div className="w-full bg-cream-200 rounded-full h-2">
                                        <div
                                            className="bg-accent-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${(item.count / (statsData?.totalFiles || 1)) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-atlas-500 text-center py-8">Aucune donnée disponible</p>
                    )}
                </div>

                {/* Recent Uploads */}
                <div className="card border border-cream-300/60">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-atlas-800">Uploads récents</h2>
                        <Link href="/dashboard/superadmin/files" className="text-accent-600 hover:text-accent-700 text-sm font-medium">
                            Voir tout →
                        </Link>
                    </div>
                    {statsData?.recentUploads && statsData.recentUploads.length > 0 ? (
                        <div className="space-y-3">
                            {statsData.recentUploads.map((file: any) => {
                                const categoryColors = getFileCategoryColor(file.fileCategory || 'Autre');
                                const thumbnailUrl = generateThumbnailUrl(file.fileUrl, file.fileType, file.thumbnailLink);

                                return (
                                    <div key={file._id} className="flex items-start gap-3 p-3 bg-cream-50 rounded-lg hover:bg-cream-100 transition-colors border border-cream-300/40">
                                        {file.fileType === 'pdf' ? (
                                            <img
                                                src={thumbnailUrl}
                                                alt="Preview"
                                                className="w-16 h-16 object-cover rounded border border-cream-300 flex-shrink-0"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-white rounded flex items-center justify-center border border-cream-300 flex-shrink-0">
                                                <FileText size={28} className="text-atlas-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-sm font-medium text-atlas-800 truncate">
                                                    {file.displayName || file.fileName}
                                                </p>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text} flex-shrink-0`}>
                                                    {file.fileCategory || 'Autre'}
                                                </span>
                                            </div>
                                            {file.fileLabel && (
                                                <p className="text-xs text-atlas-600 italic mb-1">
                                                    {file.fileLabel}
                                                </p>
                                            )}
                                            <p className="text-xs text-atlas-600">
                                                {file.year} - {file.filiere} - {file.module}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-atlas-500">
                                                    Par {file.uploadedBy?.firstName} {file.uploadedBy?.lastName}
                                                </p>
                                                <span className="text-atlas-400">•</span>
                                                <p className="text-xs text-atlas-500">
                                                    {formatDate(file.createdAt)}
                                                </p>
                                                <span className="text-atlas-400">•</span>
                                                <span className="text-xs text-atlas-500">
                                                    {formatFileSize(file.fileSize)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-atlas-500 text-center py-8">Aucun upload récent</p>
                    )}
                </div>
            </div>
        </div>
    );
}
