'use client';

import { useState } from 'react';
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
        onSuccess: (data) => {
            if (!editMode) {
                setStructureData(data);
            }
        },
    });

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
            years: [...(structureData.years || []), { name: '', filieres: [] }],
        });
    };

    const removeYear = (yearIndex: number) => {
        const newYears = structureData.years.filter((_: any, i: number) => i !== yearIndex);
        setStructureData({ ...structureData, years: newYears });
    };

    const updateYear = (yearIndex: number, name: string) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].name = name;
        setStructureData({ ...structureData, years: newYears });
    };

    const addFiliere = (yearIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres.push({ name: '', modules: [] });
        setStructureData({ ...structureData, years: newYears });
    };

    const removeFiliere = (yearIndex: number, filiereIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres = newYears[yearIndex].filieres.filter((_: any, i: number) => i !== filiereIndex);
        setStructureData({ ...structureData, years: newYears });
    };

    const updateFiliere = (yearIndex: number, filiereIndex: number, name: string) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].name = name;
        setStructureData({ ...structureData, years: newYears });
    };

    const addModule = (yearIndex: number, filiereIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].modules.push('');
        setStructureData({ ...structureData, years: newYears });
    };

    const removeModule = (yearIndex: number, filiereIndex: number, moduleIndex: number) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].modules = newYears[yearIndex].filieres[filiereIndex].modules.filter(
            (_: any, i: number) => i !== moduleIndex
        );
        setStructureData({ ...structureData, years: newYears });
    };

    const updateModule = (yearIndex: number, filiereIndex: number, moduleIndex: number, value: string) => {
        const newYears = [...structureData.years];
        newYears[yearIndex].filieres[filiereIndex].modules[moduleIndex] = value;
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
                    <p className="text-gray-600 mt-2">Gérer les années, filières et modules</p>
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
                            {editMode ? (
                                <input
                                    type="text"
                                    value={year.name}
                                    onChange={(e) => updateYear(yearIndex, e.target.value)}
                                    className="input-field text-xl font-semibold"
                                    placeholder="Nom de l'année"
                                />
                            ) : (
                                <h2 className="text-xl font-semibold text-gray-900">{year.name}</h2>
                            )}
                            {editMode && (
                                <button onClick={() => removeYear(yearIndex)} className="text-red-500 hover:text-red-600">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {year.filieres?.map((filiere: any, filiereIndex: number) => (
                                <div key={filiereIndex} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        {editMode ? (
                                            <input
                                                type="text"
                                                value={filiere.name}
                                                onChange={(e) => updateFiliere(yearIndex, filiereIndex, e.target.value)}
                                                className="input-field font-medium"
                                                placeholder="Nom de la filière"
                                            />
                                        ) : (
                                            <h3 className="font-medium text-gray-900">{filiere.name}</h3>
                                        )}
                                        {editMode && (
                                            <button onClick={() => removeFiliere(yearIndex, filiereIndex)} className="text-red-500 hover:text-red-600">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Modules:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {filiere.modules?.map((module: string, moduleIndex: number) => (
                                                <div key={moduleIndex} className="flex items-center gap-2">
                                                    {editMode ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={module}
                                                                onChange={(e) => updateModule(yearIndex, filiereIndex, moduleIndex, e.target.value)}
                                                                className="input-field text-sm"
                                                                placeholder="Nom du module"
                                                            />
                                                            <button
                                                                onClick={() => removeModule(yearIndex, filiereIndex, moduleIndex)}
                                                                className="text-red-500 hover:text-red-600"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-600 bg-white px-3 py-2 rounded border border-gray-200">
                                                            {module}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            {editMode && (
                                                <button
                                                    onClick={() => addModule(yearIndex, filiereIndex)}
                                                    className="text-primary-500 hover:text-primary-600 text-sm flex items-center gap-1"
                                                >
                                                    <Plus size={16} />
                                                    Ajouter module
                                                </button>
                                            )}
                                        </div>
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
