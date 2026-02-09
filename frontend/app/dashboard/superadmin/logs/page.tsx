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
            const params: Record<string, unknown> = { page, limit: 50 };
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
            case 'LOGIN':
            case 'login':
                return <LogIn size={16} className="text-green-600" />;
            case 'LOGOUT':
            case 'logout':
                return <LogOut size={16} className="text-atlas-500" />;
            case 'upload':
            case 'FILE_UPLOAD':
                return <Upload size={16} className="text-blue-600" />;
            case 'FILE_DELETE':
            case 'USER_DELETE':
            case 'delete':
                return <Trash2 size={16} className="text-red-600" />;
            case 'STRUCTURE_UPDATE':
                return <Activity size={16} className="text-accent-600" />;
            default:
                return <Activity size={16} className="text-atlas-500" />;
        }
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            login: 'Connexion',
            LOGIN: 'Connexion',
            logout: 'Déconnexion',
            LOGOUT: 'Déconnexion',
            upload: 'Upload fichier',
            FILE_UPLOAD: 'Upload fichier',
            delete: 'Suppression',
            FILE_DELETE: 'Suppression fichier',
            create_user: 'Création utilisateur',
            USER_CREATE: 'Création utilisateur',
            update_user: 'Modification utilisateur',
            USER_UPDATE: 'Modification utilisateur',
            delete_user: 'Suppression utilisateur',
            USER_DELETE: 'Suppression utilisateur',
            STRUCTURE_UPDATE: 'Modification structure',
        };
        return labels[action] || action;
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'LOGIN':
            case 'login':
                return 'bg-green-100 text-green-800';
            case 'LOGOUT':
            case 'logout':
                return 'bg-cream-200 text-atlas-700';
            case 'upload':
            case 'FILE_UPLOAD':
                return 'bg-blue-100 text-blue-800';
            case 'FILE_DELETE':
            case 'USER_DELETE':
            case 'delete':
                return 'bg-red-100 text-red-800';
            case 'USER_CREATE':
            case 'create_user':
                return 'bg-purple-100 text-purple-800';
            case 'USER_UPDATE':
            case 'update_user':
                return 'bg-amber-100 text-amber-800';
            case 'STRUCTURE_UPDATE':
                return 'bg-accent-100 text-accent-800';
            case 'FILE_UPDATE':
                return 'bg-sky-100 text-sky-800';
            default:
                return 'bg-cream-200 text-atlas-700';
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-atlas-800">Logs d'activité</h1>
                <p className="text-atlas-600 mt-2">Historique de toutes les actions sur la plateforme</p>
            </div>

            <div className="card mb-6 border border-cream-300/60">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-atlas-400" />
                    <select
                        id="logs-action-filter"
                        aria-label="Filtrer par type d'action"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="input-field max-w-xs"
                    >
                        <option value="">Toutes les actions</option>
                        <option value="LOGIN">Connexions</option>
                        <option value="LOGOUT">Déconnexions</option>
                        <option value="upload">Uploads</option>
                        <option value="FILE_DELETE">Suppressions fichier</option>
                        <option value="FILE_UPDATE">Modifications fichier</option>
                        <option value="USER_CREATE">Créations utilisateur</option>
                        <option value="USER_UPDATE">Modifications utilisateur</option>
                        <option value="USER_DELETE">Suppressions utilisateur</option>
                        <option value="STRUCTURE_UPDATE">Modifications structure</option>
                    </select>
                </div>
            </div>

            <div className="card border border-cream-300/60 overflow-hidden">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cream-300 border-t-accent-500" />
                    </div>
                ) : logsData?.logs && logsData.logs.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-cream-300 bg-cream-50/80">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-atlas-600">Date</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-atlas-600">Action</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-atlas-600">Utilisateur</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-atlas-600">Détails</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-atlas-600">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logsData.logs.map((log: any) => (
                                        <tr key={log._id} className="border-b border-cream-200 hover:bg-cream-50/50">
                                            <td className="py-3 px-4 text-sm text-atlas-600 whitespace-nowrap">
                                                {formatDate(log.timestamp || log.createdAt)}
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
                                                {log.userId ? (
                                                    <div>
                                                        <p className="font-medium">{(log.userId as any).firstName} {(log.userId as any).lastName}</p>
                                                        <p className="text-xs text-gray-500">{(log.userId as any).email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-atlas-600 max-w-xs truncate" title={typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')}>
                                                {typeof log.details === 'string' ? log.details : log.details ? JSON.stringify(log.details) : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-atlas-500">
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
                        <Activity className="mx-auto text-atlas-300 mb-4" size={48} />
                        <p className="text-atlas-600">Aucun log trouvé</p>
                    </div>
                )}
            </div>
        </div>
    );
}
