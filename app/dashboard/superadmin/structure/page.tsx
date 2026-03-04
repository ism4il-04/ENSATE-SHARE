'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { structureAPI } from '@/lib/api';
import { Plus, Edit, Trash2, X, Save, ChevronDown, ChevronRight, Layers, GraduationCap, BookOpen, Info } from 'lucide-react';
import Link from 'next/link';
import type { Cycle, YearLevel, Semester } from '@/types';

type CycleWithOpen = Cycle & { _open?: boolean; _yearsOpen?: Record<number, boolean> };

export default function StructurePage() {
    const queryClient = useQueryClient();
    const [editMode, setEditMode] = useState(false);
    const [structureData, setStructureData] = useState<{ cycles: CycleWithOpen[] } | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure;
        },
    });

    useEffect(() => {
        if (data != null && !editMode) {
            const cycles = (data.cycles || []).map((c: Cycle, i: number) => ({
                ...c,
                _open: i === 0,
                _yearsOpen: { 0: true } as Record<number, boolean>,
            }));
            setStructureData({ cycles });
        }
    }, [data, editMode]);

    const updateMutation = useMutation({
        mutationFn: (payload: { cycles: Cycle[] }) => structureAPI.updateStructure(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['structure'] });
            setEditMode(false);
        },
    });

    const handleEdit = () => {
        const cycles = (data?.cycles || []).map((c: Cycle, i: number) => ({
            ...JSON.parse(JSON.stringify(c)),
            _open: i === 0,
            _yearsOpen: { 0: true } as Record<number, boolean>,
        }));
        setStructureData({ cycles });
        setEditMode(true);
    };

    const handleCancel = () => {
        setStructureData(null);
        setEditMode(false);
    };

    const handleSave = () => {
        if (!structureData) return;
        const cycles = structureData.cycles.map(({ _open, _yearsOpen, ...c }) => c);
        updateMutation.mutate({ cycles });
    };

    const toggleCycle = (cycleIndex: number) => {
        if (!structureData) return;
        const cycles = [...structureData.cycles];
        cycles[cycleIndex] = { ...cycles[cycleIndex], _open: !(cycles[cycleIndex]._open) };
        setStructureData({ ...structureData, cycles });
    };

    const toggleYear = (cycleIndex: number, yearIndex: number) => {
        if (!structureData) return;
        const cycles = [...structureData.cycles];
        const c = cycles[cycleIndex];
        const next = { ...c, _yearsOpen: { ...(c._yearsOpen || {}), [yearIndex]: !(c._yearsOpen?.[yearIndex]) } };
        cycles[cycleIndex] = next;
        setStructureData({ ...structureData, cycles });
    };

    // --- Cycle
    const addCycle = () => {
        setStructureData({
            ...structureData!,
            cycles: [...(structureData!.cycles || []), { name: '', cycle: 'CI', years: [] }],
        });
    };

    const removeCycle = (cycleIndex: number) => {
        setStructureData({
            ...structureData!,
            cycles: structureData!.cycles.filter((_, i) => i !== cycleIndex),
        });
    };

    const updateCycle = (cycleIndex: number, field: 'name' | 'cycle', value: string) => {
        const cycles = [...structureData!.cycles];
        const current = cycles[cycleIndex];
        cycles[cycleIndex] = { ...current, [field]: value };
        setStructureData({ ...structureData!, cycles });
    };

    // --- Year
    const addYear = (cycleIndex: number) => {
        const cycles = [...structureData!.cycles];
        cycles[cycleIndex].years = [...(cycles[cycleIndex].years || []), { code: '', semesters: [] }];
        setStructureData({ ...structureData!, cycles });
    };

    const removeYear = (cycleIndex: number, yearIndex: number) => {
        const cycles = [...structureData!.cycles];
        cycles[cycleIndex].years = cycles[cycleIndex].years.filter((_, i) => i !== yearIndex);
        setStructureData({ ...structureData!, cycles });
    };

    const updateYearCode = (cycleIndex: number, yearIndex: number, value: string) => {
        const cycles = [...structureData!.cycles];
        cycles[cycleIndex].years[yearIndex].code = value;
        setStructureData({ ...structureData!, cycles });
    };

    // --- Semester
    const addSemester = (cycleIndex: number, yearIndex: number) => {
        const cycles = [...structureData!.cycles];
        const y = cycles[cycleIndex].years[yearIndex];
        y.semesters = [...(y.semesters || []), { name: '', modules: [] }];
        setStructureData({ ...structureData!, cycles });
    };

    const removeSemester = (cycleIndex: number, yearIndex: number, semesterIndex: number) => {
        const cycles = [...structureData!.cycles];
        const sems = cycles[cycleIndex].years[yearIndex].semesters;
        cycles[cycleIndex].years[yearIndex].semesters = sems.filter((_, i) => i !== semesterIndex);
        setStructureData({ ...structureData!, cycles });
    };

    const updateSemesterName = (cycleIndex: number, yearIndex: number, semesterIndex: number, value: string) => {
        const cycles = [...structureData!.cycles];
        cycles[cycleIndex].years[yearIndex].semesters[semesterIndex].name = value;
        setStructureData({ ...structureData!, cycles });
    };

    // --- Module
    const addModule = (cycleIndex: number, yearIndex: number, semesterIndex: number) => {
        const cycles = [...structureData!.cycles];
        const mods = cycles[cycleIndex].years[yearIndex].semesters[semesterIndex].modules;
        cycles[cycleIndex].years[yearIndex].semesters[semesterIndex].modules = [...(mods || []), ''];
        setStructureData({ ...structureData!, cycles });
    };

    const removeModule = (cycleIndex: number, yearIndex: number, semesterIndex: number, moduleIndex: number) => {
        const cycles = [...structureData!.cycles];
        const mods = cycles[cycleIndex].years[yearIndex].semesters[semesterIndex].modules;
        cycles[cycleIndex].years[yearIndex].semesters[semesterIndex].modules = mods.filter((_, i) => i !== moduleIndex);
        setStructureData({ ...structureData!, cycles });
    };

    const updateModuleName = (cycleIndex: number, yearIndex: number, semesterIndex: number, moduleIndex: number, value: string) => {
        const cycles = [...structureData!.cycles];
        cycles[cycleIndex].years[yearIndex].semesters[semesterIndex].modules[moduleIndex] = value;
        setStructureData({ ...structureData!, cycles });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-cream-100 gap-4">
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-atlas-800/5 flex items-center justify-center">
                        <Layers className="w-7 h-7 text-accent-500 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl border-2 border-accent-500/20 border-t-accent-500 animate-spin" />
                </div>
                <p className="text-sm font-medium text-atlas-600">Chargement de la structure…</p>
            </div>
        );
    }

    // Use structureData when available so expand/collapse state (_open, _yearsOpen) is applied
    const displayData = structureData ?? data;
    const cycles = displayData?.cycles ?? [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200/80">
            {/* Header */}
            <div className="max-w-4xl mx-auto px-6 py-8 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-cream-300 shadow-sm flex items-center justify-center shrink-0">
                            <Layers className="w-6 h-6 text-accent-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-atlas-800 tracking-tight">Structure académique</h1>
                            <p className="text-atlas-600 text-sm mt-0.5">
                                Cycle → Année → Semestre → Modules
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Link
                            href="/dashboard/superadmin/structure/guidelines"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-atlas-700 bg-cream-100 hover:bg-cream-200 border border-cream-300 transition-colors"
                            title="Guide d'édition de la structure"
                        >
                            <Info size={18} />
                            <span className="hidden sm:inline">Guide</span>
                        </Link>
                        {editMode ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="btn-primary inline-flex items-center gap-2"
                                    disabled={updateMutation.isPending}
                                >
                                    <Save size={18} />
                                    {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
                                </button>
                                <button onClick={handleCancel} className="btn-outline">
                                    Annuler
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={handleEdit}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-md bg-[#192436] hover:bg-[#1e2d4a] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#192436]/50 focus:ring-offset-2 focus:ring-offset-cream-100 transition-all duration-200 hover:shadow-lg hover:shadow-[#192436]/20"
                            >
                                <Edit size={18} className="shrink-0" />
                                Modifier
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 pb-8 sm:px-8 space-y-4">
                {cycles.length === 0 && !editMode ? (
                    <div className="rounded-2xl bg-white/80 backdrop-blur border border-cream-300/80 shadow-sm p-12 text-center">
                        <GraduationCap className="w-14 h-14 text-atlas-300 mx-auto mb-4" />
                        <p className="text-atlas-600 font-medium">Aucun cycle pour le moment</p>
                        <p className="text-atlas-500 text-sm mt-1">Passez en mode modification pour ajouter un cycle.</p>
                    </div>
                ) : (
                    <>
                        {cycles.map((cycle: CycleWithOpen, cycleIndex: number) => (
                            <div
                                key={cycleIndex}
                                className="rounded-2xl bg-white shadow-md border border-cream-300/60 overflow-hidden transition-all duration-200 hover:shadow-lg"
                            >
                                {/* Cycle row: accent bar + content */}
                                <div className="flex items-stretch min-h-[56px]">
                                    <div className="w-1 bg-gradient-to-b from-accent-400 to-accent-600 shrink-0" />
                                    <div className="flex-1 flex items-center gap-3 py-4 px-4 sm:px-5">
                                        <button
                                            type="button"
                                            onClick={() => toggleCycle(cycleIndex)}
                                            className="p-2 rounded-lg hover:bg-cream-100 text-atlas-600 hover:text-atlas-800 transition-colors"
                                            aria-expanded={cycle._open}
                                        >
                                            {cycle._open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                        <div className="flex-1 flex flex-wrap items-center gap-3 min-w-0">
                                            {editMode ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={cycle.name}
                                                        onChange={(e) => updateCycle(cycleIndex, 'name', e.target.value)}
                                                        className="input-field flex-1 min-w-[200px] font-semibold"
                                                        placeholder="Nom du cycle"
                                                    />
                                                    <select
                                                        value={cycle.cycle}
                                                        onChange={(e) => updateCycle(cycleIndex, 'cycle', e.target.value)}
                                                        className="input-field w-24"
                                                    >
                                                        <option value="CP">CP</option>
                                                        <option value="CI">CI</option>
                                                    </select>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-semibold text-atlas-800">{cycle.name}</span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-atlas-100 text-atlas-700 text-xs font-medium">
                                                        {cycle.cycle}
                                                    </span>
                                                    <span className="text-sm text-atlas-500">
                                                        {cycle.years?.length ?? 0} année(s)
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {editMode && (
                                            <button
                                                type="button"
                                                onClick={() => removeCycle(cycleIndex)}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Supprimer le cycle"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {cycle._open && (
                                    <div className="border-t border-cream-200 bg-cream-50/50 px-4 pb-4 pt-2 sm:pl-8">
                                        <div className="space-y-3">
                                            {(cycle.years || []).map((year: YearLevel, yearIndex: number) => (
                                                <div
                                                    key={yearIndex}
                                                    className="rounded-xl bg-white border border-cream-300/80 shadow-sm overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-2 px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleYear(cycleIndex, yearIndex)}
                                                            className="p-1.5 rounded-md hover:bg-cream-200 text-atlas-600 hover:text-atlas-800 transition-colors"
                                                            aria-expanded={(cycle as CycleWithOpen)._yearsOpen?.[yearIndex]}
                                                        >
                                                            {(cycle as CycleWithOpen)._yearsOpen?.[yearIndex] ? (
                                                                <ChevronDown size={18} />
                                                            ) : (
                                                                <ChevronRight size={18} />
                                                            )}
                                                        </button>
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={year.code}
                                                                onChange={(e) => updateYearCode(cycleIndex, yearIndex, e.target.value)}
                                                                className="input-field text-sm w-24 font-medium"
                                                                placeholder="ex: GI1"
                                                            />
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 font-medium text-atlas-800">
                                                                <GraduationCap className="w-4 h-4 text-accent-500" />
                                                                {year.code}
                                                            </span>
                                                        )}
                                                        {!editMode && (
                                                            <span className="text-xs text-atlas-500">
                                                                {year.semesters?.length ?? 0} semestre(s)
                                                            </span>
                                                        )}
                                                        {editMode && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeYear(cycleIndex, yearIndex)}
                                                                className="ml-auto p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                title="Supprimer l'année"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {(cycle as CycleWithOpen)._yearsOpen?.[yearIndex] && (
                                                        <div className="border-t border-cream-200 px-4 pb-4 pt-2 space-y-2">
                                                            {(year.semesters || []).map((sem: Semester, semesterIndex: number) => (
                                                                <div
                                                                    key={semesterIndex}
                                                                    className="rounded-lg bg-cream-50/80 border border-cream-300/60 p-3"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                                        {editMode ? (
                                                                            <input
                                                                                type="text"
                                                                                value={sem.name}
                                                                                onChange={(e) =>
                                                                                    updateSemesterName(cycleIndex, yearIndex, semesterIndex, e.target.value)
                                                                                }
                                                                                className="input-field text-sm flex-1"
                                                                                placeholder="ex: S1, S5"
                                                                            />
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-atlas-800">
                                                                                <BookOpen className="w-3.5 h-3.5 text-accent-500" />
                                                                                {sem.name}
                                                                            </span>
                                                                        )}
                                                                        {editMode && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeSemester(cycleIndex, yearIndex, semesterIndex)}
                                                                                className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                                title="Supprimer le semestre"
                                                                            >
                                                                                <X size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {(sem.modules || []).map((mod: string, moduleIndex: number) => (
                                                                            <div key={moduleIndex} className="flex items-center gap-1">
                                                                                {editMode ? (
                                                                                    <>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={mod}
                                                                                            onChange={(e) =>
                                                                                                updateModuleName(cycleIndex, yearIndex, semesterIndex, moduleIndex, e.target.value)
                                                                                            }
                                                                                            className="input-field text-xs w-44 sm:w-48"
                                                                                            placeholder="Module"
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                removeModule(cycleIndex, yearIndex, semesterIndex, moduleIndex)
                                                                                            }
                                                                                            className="p-1.5 rounded text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                                        >
                                                                                            <X size={12} />
                                                                                        </button>
                                                                                    </>
                                                                                ) : (
                                                                                    <span className="text-xs text-atlas-600 bg-white px-2.5 py-1 rounded-md border border-cream-300 shadow-sm">
                                                                                        {mod}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                        {editMode && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => addModule(cycleIndex, yearIndex, semesterIndex)}
                                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 transition-colors"
                                                                            >
                                                                                <Plus size={14} />
                                                                                Module
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {editMode && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addSemester(cycleIndex, yearIndex)}
                                                                    className="inline-flex items-center gap-2 w-full justify-center py-2 rounded-lg text-sm font-medium text-accent-600 bg-accent-50/80 hover:bg-accent-100 border border-dashed border-accent-200 transition-colors"
                                                                >
                                                                    <Plus size={16} />
                                                                    Ajouter un semestre
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {editMode && (
                                                <button
                                                    type="button"
                                                    onClick={() => addYear(cycleIndex)}
                                                    className="inline-flex items-center gap-2 w-full justify-center py-3 rounded-xl text-accent-600 bg-accent-50/80 hover:bg-accent-100 border-2 border-dashed border-accent-200 font-medium transition-colors"
                                                >
                                                    <Plus size={20} />
                                                    Ajouter une année
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {editMode && (
                            <button
                                type="button"
                                onClick={addCycle}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-atlas-300 text-atlas-600 hover:border-accent-400 hover:text-accent-600 hover:bg-accent-50/50 font-medium transition-all duration-200"
                            >
                                <Plus size={22} />
                                Ajouter un cycle
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
