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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [semester, setSemester] = useState('');
    const [module, setModule] = useState('');
    const [fileCategory, setFileCategory] = useState<'Cours' | 'TD' | 'TP' | 'EXAM' | 'Autre'>('Autre');
    const [fileLabel, setFileLabel] = useState('');
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

    // Get semesters and modules for responsable's assigned year/filiere
    const semesters = structureData?.years
        ?.find((y: any) => y.name === user?.assignedYear)
        ?.filieres?.find((f: any) => f.name === user?.assignedFiliere)
        ?.semesters || [];

    const modules = semesters
        ?.find((s: any) => s.name === semester)
        ?.modules || [];

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            setUploadStatus('uploading');
            setUploadProgress(0);

            // Simulate progress (in real app, use axios onUploadProgress)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            try {
                const response = await filesAPI.uploadFile(formData);
                clearInterval(progressInterval);
                setUploadProgress(100);
                return response.data;
            } catch (error) {
                clearInterval(progressInterval);
                throw error;
            }
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
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setSelectedFile(acceptedFiles[0]);
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

        if (!selectedFile || !semester || !module) {
            setErrorMessage('Veuillez sélectionner un fichier, un semestre et un module');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('semester', semester);
        formData.append('module', module);
        formData.append('fileCategory', fileCategory);
        if (fileLabel.trim()) {
            formData.append('fileLabel', fileLabel.trim());
        }

        uploadMutation.mutate(formData);
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
                <h1 className="text-3xl font-bold text-gray-900">Uploader un fichier</h1>
                <p className="text-gray-600 mt-2">
                    Ajouter une ressource pour {user?.assignedYear} - {user?.assignedFiliere}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dropzone */}
                <div className="card">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Fichier <span className="text-red-500">*</span>
                    </label>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-primary-500 bg-primary-50'
                            : selectedFile
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-primary-400'
                            }`}
                    >
                        <input {...getInputProps()} />

                        {selectedFile ? (
                            <div className="flex items-center justify-center gap-4">
                                <FileText className="text-green-600" size={48} />
                                <div className="text-left">
                                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                    <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    ou cliquez pour sélectionner
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    PDF, DOCX, PPTX, XLS, XLSX, ZIP, Images (max 50MB)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Semester Selection */}
                <div className="card">
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-3">
                        Semestre <span className="text-red-500">*</span>
                    </label>
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
                        <option value="">Sélectionnez un semestre</option>
                        {semesters.map((sem: any) => (
                            <option key={sem.name} value={sem.name}>
                                {sem.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Module Selection */}
                <div className="card">
                    <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-3">
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
                <div className="card">
                    <label htmlFor="fileCategory" className="block text-sm font-medium text-gray-700 mb-3">
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

                {/* File Label Input */}
                <div className="card">
                    <label htmlFor="fileLabel" className="block text-sm font-medium text-gray-700 mb-3">
                        Label personnalisé (optionnel)
                    </label>
                    <input
                        id="fileLabel"
                        type="text"
                        value={fileLabel}
                        onChange={(e) => setFileLabel(e.target.value)}
                        placeholder='Ex: "Cours n°1", "TD Chapitre 3"'
                        className="input-field"
                        maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ajoutez un titre personnalisé pour identifier facilement ce fichier
                    </p>
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
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Upload en cours...</span>
                            <span className="text-sm text-gray-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
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
                        disabled={!selectedFile || !semester || !module || uploadStatus === 'uploading'}
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
