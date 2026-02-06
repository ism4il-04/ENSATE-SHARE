'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '@/lib/api';
import { Activity, User, Upload, Trash2, LogIn, LogOut, Filter } from 'lucide-react';

export default function LogsPage() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');

    // Fetch activity logs
    const { data: logsData, isLoading } = useQuery({
        queryKey: ['activity-logs', page, actionFilter],
        queryFn: async () => {
            const params: any = { page, limit: 50 };
            if (actionFilter) params.action = actionFilter;

            const response = await statsAPI.getActivityLogs(params);
            return response.data;
        },
    });

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'login':
                return <LogIn size={16} className="text-green-600" />;
            case 'logout':
                return <LogOut size={16} className="text-gray-600" />;
            case 'upload':
                return <Upload size={16} className="text-blue-600" />;
            case 'delete':
                return <Trash2 size={16} className="text-red-600" />;
            default:
                return <Activity size={16} className="text-gray-600" />;
        }
    };

    const getActionLabel = (action: string) => {
        const labels: any = {
            login: 'Connexion',
            logout: 'Déconnexion',
            upload: 'Upload fichier',
            delete: 'Suppression',
            create_user: 'Création utilisateur',
            update_user: 'Modification utilisateur',
            delete_user: 'Suppression utilisateur',
        };
        return labels[action] || action;
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'login':
                return 'bg-green-100 text-green-800';
            case 'logout':
                return 'bg-gray-100 text-gray-800';
            case 'upload':
                return 'bg-blue-100 text-blue-800';
            case 'delete':
            case 'delete_user':
                return 'bg-red-100 text-red-800';
            case 'create_user':
                return 'bg-purple-100 text-purple-800';
            case 'update_user':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Logs d'activité</h1>
                <p className="text-gray-600 mt-2">Historique de toutes les actions sur la plateforme</p>
            </div>

            {/* Filter */}
            <div className="card mb-6">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="input-field max-w-xs"
                    >
                        <option value="">Toutes les actions</option>
                        <option value="login">Connexions</option>
                        <option value="logout">Déconnexions</option>
                        <option value="upload">Uploads</option>
                        <option value="delete">Suppressions</option>
                        <option value="create_user">Créations utilisateur</option>
                        <option value="update_user">Modifications utilisateur</option>
                        <option value="delete_user">Suppressions utilisateur</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : logsData?.logs && logsData.logs.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Utilisateur</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Détails</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logsData.logs.map((log: any) => (
                                        <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {getActionIcon(log.action)}
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900">
                                                {log.user ? (
                                                    <div>
                                                        <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                                                        <p className="text-xs text-gray-500">{log.user.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {log.details || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                {log.ipAddress || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {logsData.pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Précédent
                                </button>
                                <span className="px-4 py-2">
                                    Page {page} sur {logsData.pages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(logsData.pages, p + 1))}
                                    disabled={page === logsData.pages}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <Activity className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-600">Aucun log trouvé</p>
                    </div>
                )}
            </div>
        </div>
    );
}
