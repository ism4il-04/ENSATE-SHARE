'use client';

import { Edit, ExternalLink, FileText, Trash2 } from 'lucide-react';
import { formatFileSize, generateThumbnailUrl, getFileCategoryColor } from '@/lib/utils/fileHelpers';

interface MobileFile {
    _id: string;
    fileName: string;
    displayName?: string;
    fileLabel?: string;
    fileCategory?: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    thumbnailLink?: string | null;
    module?: string;
    year?: string;
    filiere?: string;
    createdAt: string;
    uploadedBy?: { firstName?: string; lastName?: string } | null;
}

interface FileListMobileProps {
    files: MobileFile[];
    onPreview: (file: MobileFile) => void;
    onEdit?: (file: MobileFile) => void;
    onDelete?: (file: MobileFile) => void;
    deleting?: boolean;
    showPlace?: boolean; // year and filière (admin: files of every year)
    showUploader?: boolean;
}

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// Phone layout of a file table: one card per file, actions always visible (tables show up from md)
export default function FileListMobile({ files, onPreview, onEdit, onDelete, deleting, showPlace, showUploader }: FileListMobileProps) {
    return (
        <ul className="md:hidden divide-y divide-cream-200">
            {files.map((file) => {
                const colors = getFileCategoryColor(file.fileCategory || 'Autre');
                const thumbnail = generateThumbnailUrl(file.thumbnailLink);
                const title = file.fileLabel || file.displayName || file.fileName;
                return (
                    <li key={file._id} className="py-3">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onPreview(file)}
                                className="relative w-14 h-14 shrink-0 rounded-lg bg-cream-100 border border-cream-300 flex items-center justify-center overflow-hidden"
                                aria-label={`Ouvrir ${title}`}
                            >
                                <FileText size={22} className="text-atlas-400" />
                                {thumbnail && (
                                    <img
                                        src={thumbnail}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                                    />
                                )}
                            </button>
                            <button type="button" onClick={() => onPreview(file)} className="min-w-0 flex-1 text-left">
                                <p className="text-sm font-medium text-atlas-900 break-words">{title}</p>
                                {file.fileLabel && <p className="text-xs text-atlas-500 truncate">{file.displayName || file.fileName}</p>}
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${colors.bg} ${colors.text}`}>
                                        {file.fileCategory || 'Autre'}
                                    </span>
                                    {showPlace && file.year && (
                                        <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-atlas-100 text-atlas-800">{file.year}</span>
                                    )}
                                    {file.module && <span className="text-xs text-atlas-600">{file.module}</span>}
                                </div>
                                <p className="mt-1 text-xs text-atlas-500">
                                    {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                                    {showUploader && file.uploadedBy && ` · ${file.uploadedBy.firstName ?? ''} ${file.uploadedBy.lastName ?? ''}`}
                                </p>
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-accent-700"
                            >
                                <ExternalLink size={14} />
                                Ouvrir
                            </a>
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(file)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-atlas-700"
                                >
                                    <Edit size={14} />
                                    Modifier
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(file)}
                                    disabled={deleting}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                    Supprimer
                                </button>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
