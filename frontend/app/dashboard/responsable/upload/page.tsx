'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { filesAPI, structureAPI } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [selectedFiles, setSelectedFiles] = useState<{ file: File; label: string }[]>([]);
    const [semester, setSemester] = useState('');
    const [module, setModule] = useState('');
    const [fileCategory, setFileCategory] = useState<'Cours' | 'TD' | 'TP' | 'EXAM' | 'Autre'>('Autre');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch academic structure
    const { data: structureData } = useQuery({
        queryKey: ['structure'],
        queryFn: async () => {
            const response = await structureAPI.getStructure();
            return response.data.structure;
        },
    });

    // Get semesters and modules for responsable's assigned cycle (filiere) and year code
    const selectedCycle = structureData?.cycles?.find((c: any) => c.name === user?.assignedFiliere);
    const selectedYearData = selectedCycle?.years?.find((y: any) => y.code === user?.assignedYear);
    const semesters = selectedYearData?.semesters || [];

    const modules = semesters
        ?.find((s: any) => s.name === semester)
        ?.modules || [];

    // Upload mutation (supports multiple files)
    const uploadMutation = useMutation({
        mutationFn: async ({ forms }: { forms: FormData[] }) => {
            setUploadStatus('uploading');
            setUploadProgress(0);
            setErrorMessage('');

            for (let i = 0; i < forms.length; i++) {
                await filesAPI.uploadFile(forms[i]);
                const progress = Math.round(((i + 1) / forms.length) * 100);
                setUploadProgress(progress);
            }

            return true;
        },
        onSuccess: () => {
            setUploadStatus('success');
            queryClient.invalidateQueries({ queryKey: ['responsable-files'] });
            setTimeout(() => {
                router.push('/dashboard/responsable/files');
            }, 2000);
        },
        onError: (error: any) => {
            setUploadStatus('error');
            setErrorMessage(error.response?.data?.message || 'Erreur lors de l\'upload');
        },
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/zip': ['.zip'],
            'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
        multiple: true,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setSelectedFiles((prev) => [
                    ...prev,
                    ...acceptedFiles.map((file) => ({ file, label: '' })),
                ]);
                setUploadStatus('idle');
                setErrorMessage('');
            }
        },
        onDropRejected: (rejections) => {
            const error = rejections[0]?.errors[0];
            if (error?.code === 'file-too-large') {
                setErrorMessage('Le fichier est trop volumineux (max 50MB)');
            } else if (error?.code === 'file-invalid-type') {
                setErrorMessage('Type de fichier non autorisé');
            }
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFiles.length || !semester || !module) {
            setErrorMessage('Veuillez sélectionner au moins un fichier, un semestre et un module');
            return;
        }

        const forms = selectedFiles.map(({ file, label }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('semester', semester);
            formData.append('module', module);
            formData.append('fileCategory', fileCategory);
            if (label.trim()) {
                formData.append('fileLabel', label.trim());
            }
            return formData;
        });

        uploadMutation.mutate({ forms });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
{/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-atlas-800">Uploader un fichier</h1>
                <p className="text-atlas-600 mt-2">
                    Ajouter une ressource pour {user?.assignedYear} - {user?.assignedFiliere}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dropzone */}
                <div className="card border border-cream-300/60">
                    <label className="block text-sm font-medium text-atlas-700 mb-3">
                        Fichier <span className="text-red-500">*</span>
                    </label>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-accent-500 bg-accent-50'
                            : selectedFiles.length
                                ? 'border-green-500 bg-green-50'
                                : 'border-cream-300 hover:border-accent-400'
                        }`}
                    >
                        <input {...getInputProps()} />

                        {selectedFiles.length > 0 ? (
                            <div className="space-y-4 text-left">
                                {selectedFiles.map((item, index) => (
                                    <div
                                        key={`${item.file.name}-${item.file.lastModified}-${index}`}
                                        className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4"
                                    >
                                        <div className="flex items-center gap-3 md:min-w-[220px]">
                                            <FileText className="text-green-600" size={40} />
                                            <div>
                                                <p className="font-medium text-atlas-900 line-clamp-1">
                                                    {item.file.name}
                                                </p>
                                                <p className="text-xs text-atlas-600">
                                                    {formatFileSize(item.file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className="flex-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="text"
                                                value={item.label}
                                                onChange={(e) => {
                                                    const next = [...selectedFiles];
                                                    next[index] = {
                                                        ...next[index],
                                                        label: e.target.value,
                                                    };
                                                    setSelectedFiles(next);
                                                }}
                                                placeholder='Label pour ce fichier (ex: "Cours n°1", "Cours n°2")'
                                                className="input-field"
                                                maxLength={100}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFiles((prev) =>
                                                    prev.filter((_, i) => i !== index),
                                                );
                                            }}
                                            title="Retirer ce fichier de la sélection"
                                            className="self-start text-red-500 hover:text-red-600"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-xs text-atlas-500">
                                    Vous pouvez ajouter plusieurs fichiers pour le même module et type,
                                    en donnant un label différent à chacun.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <Upload className="mx-auto text-atlas-400 mb-4" size={48} />
                                <p className="text-lg font-medium text-atlas-900 mb-2">
                                    {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier'}
                                </p>
                                <p className="text-sm text-atlas-600">
                                    ou cliquez pour sélectionner
                                </p>
                                <p className="text-xs text-atlas-500 mt-2">
                                    PDF, DOCX, PPTX, XLS, XLSX, ZIP, Images (max 50MB)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Semester Selection - all semesters of the responsable's assigned year */}
                <div className="card border border-cream-300/60">
                    <label htmlFor="semester" className="block text-sm font-medium text-atlas-700 mb-3">
                        Semestre <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-atlas-500 mb-2">
                        Vous pouvez déposer des ressources dans tous les semestres de votre année ({user?.assignedYear}).
                    </p>
                    <select
                        id="semester"
                        value={semester}
                        onChange={(e) => {
                            setSemester(e.target.value);
                            setModule(''); // Reset module when semester changes
                        }}
                        className="input-field"
                        required
                    >
                        <option value="">
                            {semesters.length === 0 && structureData
                                ? 'Aucun semestre configuré pour votre année'
                                : 'Sélectionnez un semestre'}
                        </option>
                        {semesters.map((sem: any) => (
                            <option key={sem.name} value={sem.name}>
                                {sem.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Module Selection */}
                <div className="card border border-cream-300/60">
                    <label htmlFor="module" className="block text-sm font-medium text-atlas-700 mb-3">
                        Module <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="module"
                        value={module}
                        onChange={(e) => setModule(e.target.value)}
                        className="input-field"
                        disabled={!semester}
                        required
                    >
                        <option value="">{semester ? 'Sélectionnez un module' : 'Sélectionnez d\'abord un semestre'}</option>
                        {modules.map((mod: string) => (
                            <option key={mod} value={mod}>
                                {mod}
                            </option>
                        ))}
                    </select>
                </div>

                {/* File Category Selection */}
                <div className="card border border-cream-300/60">
                    <label htmlFor="fileCategory" className="block text-sm font-medium text-atlas-700 mb-3">
                        Type de fichier <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="fileCategory"
                        value={fileCategory}
                        onChange={(e) => setFileCategory(e.target.value as any)}
                        className="input-field"
                        required
                    >
                        <option value="Cours">Cours</option>
                        <option value="TD">TD</option>
                        <option value="TP">TP</option>
                        <option value="EXAM">EXAM</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Upload Progress */}
                {uploadStatus === 'uploading' && (
                    <div className="card border border-cream-300/60">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-atlas-700">Upload en cours...</span>
                            <span className="text-sm text-atlas-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-cream-200 rounded-full h-2">
                            <div
                                className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {uploadStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <CheckCircle size={20} />
                        <span>Fichier uploadé avec succès! Redirection...</span>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={!selectedFiles.length || !semester || !module || uploadStatus === 'uploading'}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadStatus === 'uploading' ? 'Upload en cours...' : 'Uploader'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-outline"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
}
