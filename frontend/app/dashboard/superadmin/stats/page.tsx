'use client';

import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '@/lib/api';
import { BarChart3 } from 'lucide-react';

export default function StatsPage() {
    // Fetch file distribution by year
    const { data: yearDistribution } = useQuery({
        queryKey: ['stats-by-year'],
        queryFn: async () => {
            const response = await statsAPI.getFilesByYear();
            return response.data.distribution;
        },
    });

    // Fetch file distribution by filiere
    const { data: filiereDistribution } = useQuery({
        queryKey: ['stats-by-filiere'],
        queryFn: async () => {
            const response = await statsAPI.getFilesByFiliere();
            return response.data.distribution;
        },
    });

    // Fetch dashboard stats
    const { data: dashboardStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await statsAPI.getDashboardStats();
            return response.data.stats;
        },
    });

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };

    const maxYearCount = Math.max(...(yearDistribution?.map((y: any) => y.count) || [1]));
    const maxFiliereCount = Math.max(...(filiereDistribution?.map((f: any) => f.count) || [1]));

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-atlas-800">Statistiques détaillées</h1>
                <p className="text-atlas-600 mt-2">Analyse et visualisation des données</p>
            </div>

            <div className="card mb-6 border border-cream-300/60">
                <h2 className="text-xl font-semibold text-atlas-800 mb-6 flex items-center gap-2">
                    <BarChart3 size={24} className="text-accent-500" />
                    Distribution par année
                </h2>
                <div className="space-y-4">
                    {yearDistribution && yearDistribution.length > 0 ? (
                        yearDistribution.map((item: any) => (
                            <div key={item._id}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-atlas-700">{item._id}</span>
                                    <div className="text-sm text-atlas-600">
                                        <span className="font-semibold">{item.count}</span> fichiers
                                        <span className="mx-2">•</span>
                                        <span>{formatFileSize(item.totalSize)}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-cream-200 rounded-full h-3">
                                    <div
                                        className="bg-accent-500 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${(item.count / maxYearCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-atlas-500 text-center py-8">Aucune donnée disponible</p>
                    )}
                </div>
            </div>

            <div className="card mb-6 border border-cream-300/60">
                <h2 className="text-xl font-semibold text-atlas-800 mb-6 flex items-center gap-2">
                    <BarChart3 size={24} className="text-atlas-500" />
                    Distribution par filière
                </h2>
                <div className="space-y-4">
                    {filiereDistribution && filiereDistribution.length > 0 ? (
                        filiereDistribution.map((item: any) => (
                            <div key={item._id}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-atlas-700">{item._id}</span>
                                    <div className="text-sm text-atlas-600">
                                        <span className="font-semibold">{item.count}</span> fichiers
                                        <span className="mx-2">•</span>
                                        <span>{formatFileSize(item.totalSize)}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-cream-200 rounded-full h-3">
                                    <div
                                        className="bg-atlas-500 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${(item.count / maxFiliereCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-atlas-500 text-center py-8">Aucune donnée disponible</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center border border-cream-300/60">
                    <p className="text-sm text-atlas-600 mb-2">Moyenne fichiers/année</p>
                    <p className="text-3xl font-bold text-atlas-800">
                        {yearDistribution && yearDistribution.length > 0
                            ? Math.round(yearDistribution.reduce((acc: number, y: any) => acc + y.count, 0) / yearDistribution.length)
                            : 0}
                    </p>
                </div>
                <div className="card text-center border border-cream-300/60">
                    <p className="text-sm text-atlas-600 mb-2">Moyenne fichiers/filière</p>
                    <p className="text-3xl font-bold text-atlas-800">
                        {filiereDistribution && filiereDistribution.length > 0
                            ? Math.round(filiereDistribution.reduce((acc: number, f: any) => acc + f.count, 0) / filiereDistribution.length)
                            : 0}
                    </p>
                </div>
                <div className="card text-center border border-cream-300/60">
                    <p className="text-sm text-atlas-600 mb-2">Taille moyenne/fichier</p>
                    <p className="text-3xl font-bold text-atlas-800">
                        {dashboardStats?.totalFiles && dashboardStats?.totalStorage
                            ? formatFileSize(dashboardStats.totalStorage / dashboardStats.totalFiles)
                            : '0 B'}
                    </p>
                </div>
            </div>
        </div>
    );
}
