'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { structureAPI } from '@/lib/api';
import { AcademicStructure, Cycle } from '@/types';
import {
    LogIn,
    ArrowRight,
    BookOpen,
    ChevronDown,
    ChevronLeft,
    Library,
    Share2,
    Sparkles,
    Upload,
    Download,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const CYCLE_LABELS: Record<string, string> = {
    CP: 'Cycle préparatoire',
    CI: "Cycle d'ingénieur",
};

const CYCLE_DESCRIPTIONS: Record<string, string> = {
    CP: '1ère et 2ème année — tronc commun',
    CI: '3ème, 4ème et 5ème année — par filière',
};

function WelcomeContent() {
    const router = useRouter();
    const parcoursRef = useRef<HTMLElement>(null);
    const [cycle, setCycle] = useState<'CP' | 'CI' | ''>('');
    const [filiere, setFiliere] = useState('');
    const [year, setYear] = useState('');
    const [semester, setSemester] = useState('');
    const [parcoursVisible, setParcoursVisible] = useState(false);

    const { data: structureData } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure as AcademicStructure;
        },
    });

    const cyclesForCycle: Cycle[] = (structureData?.cycles ?? []).filter((c) => c.cycle === cycle);
    const cpCycle = cycle === 'CP' ? cyclesForCycle[0] : null;
    const selectedFiliereCycle =
        cycle === 'CI' && filiere ? cyclesForCycle.find((c) => c.name === filiere) : cpCycle;
    const yearsForDisplay = selectedFiliereCycle?.years ?? [];
    const selectedYearData = yearsForDisplay.find((y) => y.code === year);
    const semesters = selectedYearData?.semesters ?? [];
    const filieresForCycle: Cycle[] = cyclesForCycle;
    const canGoToResources = year && semester && (cycle === 'CP' || (cycle === 'CI' && filiere));

    // What to show: only the next choice (progressive disclosure)
    const showCycle = !cycle;
    const showFiliere = cycle === 'CI' && !filiere;
    const showYear = (cycle === 'CP' || (cycle === 'CI' && filiere)) && !year;
    const showSemester = Boolean(selectedYearData) && !semester;
    const showCTA = canGoToResources;

    const canGoBack = cycle && (showFiliere || showYear || showSemester || showCTA);

    const goBack = () => {
        if (showCTA) {
            setSemester('');
            return;
        }
        if (showSemester) {
            setYear('');
            setSemester('');
            return;
        }
        if (showYear) {
            if (cycle === 'CP') {
                setCycle('');
                setYear('');
                setSemester('');
            } else {
                setYear('');
                setFiliere('');
            }
            return;
        }
        if (showFiliere) {
            setCycle('');
            setFiliere('');
            setYear('');
            setSemester('');
        }
    };

    useEffect(() => {
        const el = parcoursRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => setParcoursVisible(e.isIntersecting),
            { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const scrollToParcours = () => {
        parcoursRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const goToResources = () => {
        const f = cycle === 'CP' ? cpCycle?.name : filiere;
        const params = new URLSearchParams();
        params.set('cycle', cycle);
        params.set('year', year);
        params.set('semester', semester);
        if (f) params.set('filiere', f);
        router.push(`/resources?${params.toString()}`);
    };

    // Breadcrumb items (clickable to go back to that step)
    const breadcrumbItems: { label: string; onClick: () => void }[] = [];
    if (cycle) {
        breadcrumbItems.push({
            label: CYCLE_LABELS[cycle] || cycle,
            onClick: () => {
                setCycle('');
                setFiliere('');
                setYear('');
                setSemester('');
            },
        });
    }
    if (cycle === 'CI' && filiere) {
        breadcrumbItems.push({
            label: filiere,
            onClick: () => {
                setFiliere('');
                setYear('');
                setSemester('');
            },
        });
    }
    if (year) {
        breadcrumbItems.push({
            label: year,
            onClick: () => {
                setYear('');
                setSemester('');
            },
        });
    }
    if (semester) {
        breadcrumbItems.push({
            label: semester,
            onClick: () => setSemester(''),
        });
    }

    const yearsForCurrentStep = yearsForDisplay;

    return (
        <div className="min-h-screen bg-cream-100 scroll-smooth">
            {/* Hero: full screen. For hero-bg.png, 1920×1080 (16:9) is recommended for sharp full-screen display. */}
            <header
                className="relative min-h-screen flex flex-col overflow-hidden bg-atlas-900"
                style={{
                    backgroundImage: 'linear-gradient(to bottom, rgba(15,24,40,0.78) 0%, rgba(8,13,20,0.92) 100%), url(/hero-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <nav className="relative z-10 flex justify-end p-4 sm:p-6">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-cream-50 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
                    >
                        <LogIn size={18} />
                        Connexion
                    </Link>
                </nav>

                <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center sm:text-left pb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-cream-200/90 text-sm font-medium mb-6 w-fit mx-auto sm:mx-0">
                        <Sparkles size={14} />
                        Plateforme ENSA
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-cream-50 tracking-tight leading-tight">
                        ENSA-SHARE
                    </h1>
                    <p className="mt-4 text-lg sm:text-xl text-cream-200/90 max-w-2xl leading-relaxed">
                        Les délégués déposent cours, TD, TP et examens ; vous les retrouvez par parcours et module, puis vous consultez et téléchargez en un clic.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-cream-300/90 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            <Upload size={16} />
                            Dépôt par les délégués
                        </span>
                        <span className="text-cream-500/80" aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Library size={16} />
                            Parcours & modules
                        </span>
                        <span className="text-cream-500/80" aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Download size={16} />
                            Consultation & téléchargement
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={scrollToParcours}
                        className="mt-14 inline-flex flex-col items-center gap-2 text-cream-400 hover:text-cream-50 transition-colors group"
                        aria-label="Choisir mon parcours"
                    >
                        <span className="text-sm font-medium">Choisir mon parcours</span>
                        <span className="rounded-full border-2 border-current p-2 group-hover:scale-110 transition-transform">
                            <ChevronDown size={20} />
                        </span>
                    </button>
                </div>
            </header>

            {/* ——— Parcours: one step at a time, breadcrumb + back ——— */}
            <main className="relative">
                <section
                    ref={parcoursRef}
                    id="parcours"
                    className="scroll-mt-8 py-12 sm:py-20 px-4 sm:px-6 lg:px-8"
                    style={{ scrollMarginTop: '2rem' }}
                >
                    <div
                        className={`max-w-4xl mx-auto transition-all duration-500 ${
                            parcoursVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                        }`}
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-atlas-800 text-center mb-8">
                            Choisissez votre parcours
                        </h2>

                        {/* Progress: breadcrumb (pills) + back button */}
                        {(breadcrumbItems.length > 0 || canGoBack) && (
                            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    {breadcrumbItems.map((item, i) => (
                                        <span key={i} className="flex items-center gap-1.5 shrink-0">
                                            {i > 0 && (
                                                <ChevronDown
                                                    className="text-atlas-400 rotate-[-90deg] flex-shrink-0"
                                                    size={16}
                                                    aria-hidden
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={item.onClick}
                                                className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-atlas-800/90 text-cream-50 hover:bg-atlas-700 hover:shadow-[0_0_20px_-4px_rgba(13,148,136,0.3)] transition-all duration-200 truncate max-w-[160px] sm:max-w-[200px] border border-atlas-600/50"
                                            >
                                                {item.label}
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {canGoBack && (
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-atlas-700 bg-white border-2 border-atlas-300 hover:border-accent-500 hover:text-accent-600 hover:shadow-[0_0_16px_-4px_rgba(13,148,136,0.2)] transition-all duration-200 shrink-0"
                                    >
                                        <ChevronLeft size={18} />
                                        Retour
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Progress bar: smooth single bar */}
                        {cycle && (
                            <div className="mb-10">
                                <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-[width] duration-500 ease-out"
                                        style={{
                                            width: showCTA ? '100%' : showSemester ? '75%' : showYear ? '50%' : '25%',
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-atlas-500 text-center">
                                    {showCycle && 'Choisissez votre cycle'}
                                    {showFiliere && 'Choisissez votre filière'}
                                    {showYear && 'Choisissez l\'année'}
                                    {showSemester && 'Choisissez le semestre'}
                                    {showCTA && 'Parcours sélectionné'}
                                </p>
                            </div>
                        )}

                        {/* Step: show only current choice */}
                        {showCycle && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {(['CP', 'CI'] as const).map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCycle(c)}
                                        className="group relative rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 border-2 border-cream-300 bg-white hover:border-atlas-400 hover:shadow-glass-lg overflow-hidden"
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-accent-500/5 to-transparent" />
                                        <div className="relative">
                                            <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-cream-200 text-atlas-600 group-hover:bg-accent-100 group-hover:text-accent-700 transition-colors">
                                                <BookOpen size={24} />
                                            </span>
                                            <h3 className="text-lg font-bold text-atlas-800">
                                                {CYCLE_LABELS[c] || c}
                                            </h3>
                                            <p className="mt-1 text-sm text-atlas-600">
                                                {CYCLE_DESCRIPTIONS[c] || ''}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showFiliere && (
                            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                {filieresForCycle.map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setFiliere(c.name)}
                                        className="rounded-xl px-5 py-3.5 text-sm font-medium border-2 border-cream-300 bg-white text-atlas-700 hover:border-atlas-400 hover:bg-atlas-50/50 transition-all"
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {showYear && (
                            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                {yearsForCurrentStep.map((y) => (
                                    <button
                                        key={y.code}
                                        type="button"
                                        onClick={() => {
                                            setYear(y.code);
                                            if (cycle === 'CP') setFiliere(cpCycle?.name ?? '');
                                        }}
                                        className="rounded-xl px-5 py-3.5 text-sm font-medium border-2 border-cream-300 bg-white text-atlas-700 hover:border-atlas-400 hover:bg-atlas-50/50 transition-all"
                                    >
                                        {y.code}
                                    </button>
                                ))}
                            </div>
                        )}

                        {showSemester && (
                            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                {semesters.map((s) => (
                                    <button
                                        key={s.name}
                                        type="button"
                                        onClick={() => setSemester(s.name)}
                                        className="rounded-xl px-5 py-3.5 text-sm font-medium border-2 border-cream-300 bg-white text-atlas-700 hover:border-accent-200 hover:bg-accent-50/50 transition-all"
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {showCTA && (
                            <div className="text-center py-6">
                                <p className="text-atlas-600 mb-6">
                                    Parcours sélectionné. Accédez aux modules et documents.
                                </p>
                                <button
                                    type="button"
                                    onClick={goToResources}
                                    className="btn-primary inline-flex items-center justify-center gap-2 min-w-[260px] py-4 text-base"
                                >
                                    Voir les modules et ressources
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <footer className="border-t border-cream-300/60 bg-cream-50/50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-3 text-center">
                    <Link href="/">
                        <Image
                            src="/ensa-share_logo.png"
                            alt="ENSA-SHARE"
                            width={140}
                            height={44}
                            className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity"
                        />
                    </Link>
                    <p className="text-atlas-600 text-sm">
                        © 2026 ENSA-SHARE — École Nationale des Sciences Appliquées
                    </p>
                </div>
            </footer>
        </div>
    );
}

function WelcomeFallback() {
    return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-atlas-200 border-t-accent-500 animate-spin" />
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={<WelcomeFallback />}>
            <WelcomeContent />
        </Suspense>
    );
}
