'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { filesAPI, structureAPI } from '@/lib/api';
import { File as FileType, AcademicStructure } from '@/types';
import { BookOpen, ArrowLeft, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { FileCard } from '@/components/FileCard';

const FILE_CATEGORY_ORDER: FileType['fileCategory'][] = ['Cours', 'TD', 'TP', 'EXAM', 'Autre'];

function groupFilesByCategory(files: FileType[]) {
    const groups: Partial<Record<FileType['fileCategory'], FileType[]>> = {};
    for (const cat of FILE_CATEGORY_ORDER) groups[cat] = [];
    for (const file of files) {
        const cat = file.fileCategory || 'Autre';
        if (!groups[cat]) groups[cat] = [];
        groups[cat]!.push(file);
    }
    return FILE_CATEGORY_ORDER.map((cat) => ({ category: cat, files: groups[cat] || [] })).filter(
        (g) => g.files.length > 0
    );
}

function ResourcesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const cycle = searchParams.get('cycle') ?? '';
    const year = searchParams.get('year') ?? '';
    const filiere = searchParams.get('filiere') ?? '';
    const semester = searchParams.get('semester') ?? '';
    const [selectedModule, setSelectedModule] = useState('');
    const [urlSynced, setUrlSynced] = useState(false);

    useEffect(() => {
        setSelectedModule(searchParams.get('module') ?? '');
        setUrlSynced(true);
    }, [searchParams]);

    const replaceUrl = useCallback(
        (moduleName: string) => {
            const params = new URLSearchParams();
            if (cycle) params.set('cycle', cycle);
            if (year) params.set('year', year);
            if (filiere) params.set('filiere', filiere);
            if (semester) params.set('semester', semester);
            if (moduleName) params.set('module', moduleName);
            window.history.replaceState(null, '', `?${params.toString()}`);
        },
        [cycle, year, filiere, semester]
    );

    const { data: structureData } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure as AcademicStructure;
        },
    });

    const selectedYearData = structureData?.years.find((y) => y.name === year);
    const selectedFiliereData = selectedYearData?.filieres?.find((f) => f.name === filiere);
    const selectedSemesterData = selectedFiliereData?.semesters?.find((s) => s.name === semester);
    const modules = selectedSemesterData?.modules ?? [];

    const hasValidContext = cycle && year && filiere && semester;
    const { data: filesData, isLoading } = useQuery({
        queryKey: ['files', year, filiere, semester, selectedModule],
        queryFn: async () => {
            const params: Record<string, unknown> = { limit: 50 };
            params.year = year;
            params.filiere = filiere;
            params.semester = semester;
            if (selectedModule) params.module = selectedModule;
            const response = await filesAPI.getFiles(params);
            return response.data;
        },
        enabled: Boolean(urlSynced && hasValidContext && selectedModule.length > 0),
    });

    useEffect(() => {
        if (urlSynced && hasValidContext && !selectedModule && modules.length > 0) {
            setSelectedModule(modules[0]);
            replaceUrl(modules[0]);
        }
    }, [urlSynced, hasValidContext, modules, selectedModule, replaceUrl]);

    if (urlSynced && !hasValidContext) {
        router.replace('/');
        return null;
    }
    if (urlSynced && hasValidContext && structureData && modules.length === 0) {
        router.replace('/');
        return null;
    }

    const files = (filesData?.files as FileType[]) || [];
    const filesByCategory = groupFilesByCategory(files);

    return (
        <div className="min-h-screen bg-cream-100">
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-atlas-800 via-atlas-700 to-atlas-900" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-cream-200 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Changer de parcours
                        </Link>
                        <Link href="/" className="flex shrink-0">
                            <Image
                                src="/ensa-share_logo_white.png"
                                alt="ENSA-SHARE"
                                width={220}
                                height={82}
                                className="h-14 w-auto drop-shadow-[0_0_12px_rgba(13,148,136,0.2)]"
                            />
                        </Link>
                        <div className="text-cream-50 text-sm w-full sm:w-auto text-center sm:text-right order-last sm:order-none">
                            <span className="font-medium">{year}</span>
                            {filiere && <span className="text-cream-200/90"> · {filiere}</span>}
                            <span className="text-cream-200/90"> · {semester}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-2 mb-6">
                    <FolderOpen className="text-atlas-600" size={24} />
                    <h2 className="text-xl font-semibold text-atlas-800">Modules</h2>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {modules.map((mod) => (
                        <button
                            key={mod}
                            type="button"
                            onClick={() => {
                                setSelectedModule(mod);
                                replaceUrl(mod);
                            }}
                            className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                                selectedModule === mod
                                    ? 'bg-atlas-700 text-cream-50 shadow-lg'
                                    : 'glass-card text-atlas-700 hover:bg-atlas-100/80'
                            }`}
                        >
                            {mod}
                        </button>
                    ))}
                </div>

                {selectedModule && (
                    <section>
                        <h3 className="text-lg font-semibold text-atlas-800 mb-4 flex items-center gap-2">
                            <BookOpen size={20} />
                            Documents — {selectedModule}
                        </h3>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-10 h-10 rounded-full border-2 border-atlas-200 border-t-accent-500 animate-spin" />
                                <p className="mt-3 text-atlas-600">Chargement…</p>
                            </div>
                        ) : filesByCategory.length > 0 ? (
                            filesByCategory.map(({ category, files: categoryFiles }, sectionIndex) => (
                                <div key={category} className="mb-8">
                                    <h4 className="text-base font-semibold text-atlas-800 mb-3">{category}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                        {categoryFiles.map((file: FileType, index: number) => (
                                            <div
                                                key={file._id}
                                                className="animate-slide-up opacity-0"
                                                style={{
                                                    animationDelay: `${Math.min(sectionIndex * 80 + index * 50, 400)}ms`,
                                                    animationFillMode: 'forwards',
                                                }}
                                            >
                                                <FileCard file={file} variant="default" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="glass-card text-center py-12 px-6">
                                <BookOpen className="mx-auto text-atlas-300 mb-3" size={48} />
                                <p className="text-atlas-600 font-medium">Aucun document pour ce module</p>
                            </div>
                        )}
                    </section>
                )}
            </main>

            <footer className="border-t border-cream-300/60 bg-cream-50/50 mt-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-atlas-600 text-sm">
                        © 2026 ENSA-SHARE — École Nationale des Sciences Appliquées
                    </p>
                </div>
            </footer>
        </div>
    );
}

function ResourcesFallback() {
    return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-atlas-200 border-t-accent-500 animate-spin" />
        </div>
    );
}

export default function ResourcesPage() {
    return (
        <Suspense fallback={<ResourcesFallback />}>
            <ResourcesContent />
        </Suspense>
    );
}
