'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { filesAPI, structureAPI } from '@/lib/api';
import { File as FileType, AcademicStructure } from '@/types';
import { Search, Download, FileText, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedFiliere, setSelectedFiliere] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    // Fetch academic structure
    const { data: structureData } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure as AcademicStructure;
        },
    });

    // Fetch files with filters
    const { data: filesData, isLoading } = useQuery({
        queryKey: ['files', selectedYear, selectedFiliere, selectedModule, searchQuery, page],
        queryFn: async () => {
            const params: any = { page, limit: 12 };
            if (selectedYear) params.year = selectedYear;
            if (selectedFiliere) params.filiere = selectedFiliere;
            if (selectedModule) params.module = selectedModule;
            if (searchQuery) params.search = searchQuery;

            const response = await filesAPI.getFiles(params);
            return response.data;
        },
    });

    const selectedYearData = structureData?.years.find((y) => y.name === selectedYear);
    const selectedFiliereData = selectedYearData?.filieres.find((f) => f.name === selectedFiliere);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-primary-500">ENSA-SHARE</h1>
                            <p className="text-sm text-gray-600">Plateforme de Partage de Ressources Pédagogiques</p>
                        </div>
                        <Link href="/login" className="btn-primary flex items-center gap-2">
                            <LogIn size={20} />
                            Connexion
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters Section */}
                <div className="card mb-8">
                    <h2 className="text-xl font-semibold mb-4">Rechercher des ressources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Year Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value);
                                    setSelectedFiliere('');
                                    setSelectedModule('');
                                }}
                                className="input-field"
                            >
                                <option value="">Toutes les années</option>
                                {structureData?.years.map((year) => (
                                    <option key={year.name} value={year.name}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filiere Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filière</label>
                            <select
                                value={selectedFiliere}
                                onChange={(e) => {
                                    setSelectedFiliere(e.target.value);
                                    setSelectedModule('');
                                }}
                                className="input-field"
                                disabled={!selectedYear}
                            >
                                <option value="">Toutes les filières</option>
                                {selectedYearData?.filieres.map((filiere) => (
                                    <option key={filiere.name} value={filiere.name}>
                                        {filiere.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Module Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                            <select
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="input-field"
                                disabled={!selectedFiliere}
                            >
                                <option value="">Tous les modules</option>
                                {selectedFiliereData?.modules.map((module) => (
                                    <option key={module} value={module}>
                                        {module}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                    </div>
                </div>

                {/* Results Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            {filesData?.total || 0} fichier(s) trouvé(s)
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        </div>
                    ) : filesData?.files && filesData.files.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filesData.files.map((file: FileType) => (
                                    <div key={file._id} className="card hover:shadow-lg transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <FileText className="text-primary-500" size={40} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate mb-1">
                                                    {file.fileName}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-2">{file.module}</p>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>{file.fileType.toUpperCase()}</span>
                                                    <span>{formatFileSize(file.fileSize)}</span>
                                                </div>
                                                <div className="mt-3">
                                                    <a
                                                        href={file.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-primary w-full text-center text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Download size={16} />
                                                        Télécharger
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {filesData.pages > 1 && (
                                <div className="flex justify-center gap-2 mt-8">
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
                        <div className="text-center py-12 card">
                            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
                            <p className="text-gray-600">Aucun fichier trouvé</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-gray-600 text-sm">
                        © 2026 ENSA-SHARE - École Nationale des Sciences Appliquées
                    </p>
                </div>
            </footer>
        </div>
    );
}
