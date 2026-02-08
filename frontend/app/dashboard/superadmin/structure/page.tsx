'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { structureAPI } from '@/lib/api';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';

export default function StructurePage() {
    const queryClient = useQueryClient();

    const [editMode, setEditMode] = useState(false);
    const [structureData, setStructureData] = useState<any>(null);

    // Fetch structure
    const { data, isLoading } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure;
        },
    });

    useEffect(() => {
        if (data != null && !editMode) {
            setStructureData(data);
        }
    }, [data, editMode]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (newStructure: any) => structureAPI.updateStructure(newStructure),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['structure'] });
            setEditMode(false);
        },
    });

    const handleEdit = () => {
        setStructureData(JSON.parse(JSON.stringify(data)));
        setEditMode(true);
    };

    const handleCancel = () => {
        setStructureData(data);
        setEditMode(false);
    };

    const handleSave = () => {
        updateMutation.mutate(structureData);
    };

    const addYear = () => {
        setStructureData({
            ...structureData,
            years: [...(structureData.years || []), { name: '', cycle: '', filieres: [] }],
        });
    };

    const removeYear = (yearIndex: number) => {
        const newYears = structureData.years.filter((_: any, i: number) => i !== yearIndex);
        setStructureData({ ...structureData, years: newYears });
    };

    const updateYear = (yearIndex: number, field: string, value: string) => {
        const newYears = [...structureData.years];
        newYears[yearIndex][field] = value;
        setStructureData({ ...structureData, years: newYears });
    };

    const addFiliere = (yearIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres.push({ name: '', code: '', semesters: [] });
        setStructureData({ ...structureData, years: newYears });
    };

    const removeFiliere = (yearIndex: number, filiereIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres = newYears[yearIndex].filieres.filter((_: any, i: number) => i !== filiereIndex);
        setStructureData({ ...structureData, years: newYears });
    };

    const updateFiliere = (yearIndex: number, filiereIndex: number, field: string, value: string) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex][field] = value;
        setStructureData({ ...structureData, years: newYears });
    };

    const addSemester = (yearIndex: number, filiereIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].semesters.push({ name: '', modules: [] });
        setStructureData({ ...structureData, years: newYears });
    };

    const removeSemester = (yearIndex: number, filiereIndex: number, semesterIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].semesters = newYears[yearIndex].filieres[filiereIndex].semesters.filter(
            (_: any, i: number) => i !== semesterIndex
        );
        setStructureData({ ...structureData, years: newYears });
    };

    const updateSemester = (yearIndex: number, filiereIndex: number, semesterIndex: number, value: string) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].semesters[semesterIndex].name = value;
        setStructureData({ ...structureData, years: newYears });
    };

    const addModule = (yearIndex: number, filiereIndex: number, semesterIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].semesters[semesterIndex].modules.push('');
        setStructureData({ ...structureData, years: newYears });
    };

    const removeModule = (yearIndex: number, filiereIndex: number, semesterIndex: number, moduleIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].semesters[semesterIndex].modules = newYears[yearIndex].filieres[filiereIndex].semesters[semesterIndex].modules.filter(
            (_: any, i: number) => i !== moduleIndex
        );
        setStructureData({ ...structureData, years: newYears });
    };

    const updateModule = (yearIndex: number, filiereIndex: number, semesterIndex: number, moduleIndex: number, value: string) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].semesters[semesterIndex].modules[moduleIndex] = value;
        setStructureData({ ...structureData, years: newYears });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    const displayData = editMode ? structureData : data;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Structure académique</h1>
                    <p className="text-gray-600 mt-2">Gérer les années, filières, semestres et modules</p>
                </div>
                <div className="flex gap-3">
                    {editMode ? (
                        <>
                            <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={updateMutation.isPending}>
                                <Save size={20} />
                                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                            <button onClick={handleCancel} className="btn-outline">
                                Annuler
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEdit} className="btn-primary flex items-center gap-2">
                            <Edit size={20} />
                            Modifier
                        </button>
                    )}
                </div>
            </div>

            {/* Structure Display/Edit */}
            <div className="space-y-6">
                {displayData?.years?.map((year: any, yearIndex: number) => (
                    <div key={yearIndex} className="card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                {editMode ? (
                                    <>
                                        <input
                                            type="text"
                                            value={year.name}
                                            onChange={(e) => updateYear(yearIndex, 'name', e.target.value)}
                                            className="input-field text-xl font-semibold"
                                            placeholder="Nom de l'année"
                                        />
                                        <input
                                            type="text"
                                            value={year.cycle || ''}
                                            onChange={(e) => updateYear(yearIndex, 'cycle', e.target.value)}
                                            className="input-field"
                                            placeholder="Cycle (CP/CI)"
                                        />
                                    </>
                                ) : (
                                    <div className="col-span-2">
                                        <h2 className="text-xl font-semibold text-gray-900">{year.name}</h2>
                                        {year.cycle && <span className="text-sm text-gray-600">Cycle: {year.cycle}</span>}
                                    </div>
                                )}
                            </div>
                            {editMode && (
                                <button onClick={() => removeYear(yearIndex)} className="text-red-500 hover:text-red-600 ml-4">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {year.filieres?.map((filiere: any, filiereIndex: number) => (
                                <div key={filiereIndex} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            {editMode ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={filiere.name}
                                                        onChange={(e) => updateFiliere(yearIndex, filiereIndex, 'name', e.target.value)}
                                                        className="input-field font-medium"
                                                        placeholder="Nom de la filière"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={filiere.code || ''}
                                                        onChange={(e) => updateFiliere(yearIndex, filiereIndex, 'code', e.target.value)}
                                                        className="input-field"
                                                        placeholder="Code (ex: GI, 2AP)"
                                                    />
                                                </>
                                            ) : (
                                                <div className="col-span-2">
                                                    <h3 className="font-medium text-gray-900">
                                                        {filiere.name} {filiere.code && `(${filiere.code})`}
                                                    </h3>
                                                </div>
                                            )}
                                        </div>
                                        {editMode && (
                                            <button onClick={() => removeFiliere(yearIndex, filiereIndex)} className="text-red-500 hover:text-red-600 ml-4">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Semesters */}
                                    <div className="space-y-3 mt-4">
                                        {filiere.semesters?.map((semester: any, semesterIndex: number) => (
                                            <div key={semesterIndex} className="bg-white p-3 rounded border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    {editMode ? (
                                                        <input
                                                            type="text"
                                                            value={semester.name}
                                                            onChange={(e) => updateSemester(yearIndex, filiereIndex, semesterIndex, e.target.value)}
                                                            className="input-field text-sm font-medium"
                                                            placeholder="Nom du semestre (ex: S1)"
                                                        />
                                                    ) : (
                                                        <h4 className="text-sm font-medium text-gray-900">{semester.name}</h4>
                                                    )}
                                                    {editMode && (
                                                        <button onClick={() => removeSemester(yearIndex, filiereIndex, semesterIndex)} className="text-red-500 hover:text-red-600">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-gray-700">Modules:</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {semester.modules?.map((module: string, moduleIndex: number) => (
                                                            <div key={moduleIndex} className="flex items-center gap-2">
                                                                {editMode ? (
                                                                    <>
                                                                        <input
                                                                            type="text"
                                                                            value={module}
                                                                            onChange={(e) => updateModule(yearIndex, filiereIndex, semesterIndex, moduleIndex, e.target.value)}
                                                                            className="input-field text-xs"
                                                                            placeholder="Nom du module"
                                                                        />
                                                                        <button
                                                                            onClick={() => removeModule(yearIndex, filiereIndex, semesterIndex, moduleIndex)}
                                                                            className="text-red-500 hover:text-red-600"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                                        {module}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {editMode && (
                                                            <button
                                                                onClick={() => addModule(yearIndex, filiereIndex, semesterIndex)}
                                                                className="text-primary-500 hover:text-primary-600 text-xs flex items-center gap-1"
                                                            >
                                                                <Plus size={14} />
                                                                Ajouter module
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {editMode && (
                                            <button
                                                onClick={() => addSemester(yearIndex, filiereIndex)}
                                                className="text-primary-500 hover:text-primary-600 text-sm flex items-center gap-1"
                                            >
                                                <Plus size={16} />
                                                Ajouter un semestre
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {editMode && (
                                <button
                                    onClick={() => addFiliere(yearIndex)}
                                    className="text-primary-500 hover:text-primary-600 flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Ajouter une filière
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {editMode && (
                    <button onClick={addYear} className="btn-outline w-full flex items-center justify-center gap-2">
                        <Plus size={20} />
                        Ajouter une année
                    </button>
                )}
            </div>
        </div>
    );
}
