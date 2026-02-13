'use client';

import { File as FileType } from '@/types';
import { generateThumbnailUrl, getFileCategoryColor, getFileTypeColor } from '@/lib/utils/fileHelpers';
import { Download, FileText } from 'lucide-react';
import Link from 'next/link';

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

interface FileCardProps {
    file: FileType;
    /** Bento grid: 'default' | 'compact' (smaller tile) | 'featured' (larger) */
    variant?: 'default' | 'compact' | 'featured';
    /** Optional animation delay for stagger (ms) */
    animationDelay?: number;
    /** Optional handler for previewing file instead of navigating */
    onPreview?: (file: FileType) => void;
}

export function FileCard({ file, variant = 'default', animationDelay = 0, onPreview }: FileCardProps) {
    const categoryColors = getFileCategoryColor(file.fileCategory || 'Autre');
    const thumbnailUrl = generateThumbnailUrl(file.fileUrl, file.fileType, file.thumbnailLink);
    const isPdf = file.fileType.toLowerCase() === 'pdf';

    const thumbHeight = variant === 'compact' ? 'h-28' : variant === 'featured' ? 'h-56' : 'h-44';

    const mainTitle = file.fileLabel || file.displayName || file.fileName;
    const secondaryTitle =
        file.fileLabel && (file.displayName || file.fileName)
            ? (file.displayName || file.fileName)
            : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const downloadHref = `${apiBase}/files/${file._id}/download`;

    const CardContent = (
        <article
            className="group relative rounded-2xl overflow-hidden glass-card p-0
                        transition-all duration-300 ease-out
                        hover:shadow-glass-lg hover:-translate-y-1 hover:scale-[1.02]
                        focus-within:ring-2 focus-within:ring-accent-500/50 focus-within:ring-offset-2 focus-within:ring-offset-cream-100"
            style={{ animationDelay: animationDelay ? `${animationDelay}ms` : undefined }}
        >
            {/* Thumbnail */}
            <div className={`relative w-full ${thumbHeight} overflow-hidden bg-cream-200/60`}>
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                                target.style.display = 'none';
                                const fallback = parent.querySelector('.file-card-fallback');
                                if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                            }
                        }}
                    />
                ) : null}
                <div
                    className={`file-card-fallback w-full h-full flex flex-col items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}
                >
                    <FileText
                        size={variant === 'compact' ? 40 : 56}
                        className={getFileTypeColor(file.fileType) + ' transition-transform duration-300 group-hover:scale-110'}
                    />
                    <span className="mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/80 text-atlas-700 border border-cream-400/60">
                        {file.fileType.toUpperCase()}
                    </span>
                </div>
                {/* Hover overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-atlas-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Category pill */}
                <span
                    className={`absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-md ${categoryColors.bg} ${categoryColors.text}`}
                >
                    {file.fileCategory || 'Autre'}
                </span>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3
                    className="font-semibold text-atlas-900 truncate pr-8 group-hover:text-atlas-800"
                    title={mainTitle}
                >
                    {mainTitle}
                </h3>
                {secondaryTitle && variant !== 'compact' && (
                    <p className="text-xs text-atlas-600 mt-0.5 line-clamp-1">
                        {secondaryTitle}
                    </p>
                )}
                <div className="flex items-center justify-between mt-3 gap-2">
                    <span className="text-xs text-atlas-500">{formatFileSize(file.fileSize)}</span>
                    <a
                        href={downloadHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-500 text-white text-sm font-medium
                                       hover:bg-accent-600 hover:shadow-glow active:scale-95 transition-all duration-200"
                    >
                        <Download size={16} className="shrink-0" />
                        <span>Télécharger</span>
                    </a>
                </div>
            </div>
        </article>
    ); // End of CardContent

    if (onPreview) {
        return (
            <button
                type="button"
                onClick={() => onPreview(file)}
                className="block w-full text-left focus:outline-none"
                title={mainTitle}
            >
                {CardContent}
            </button>
        );
    }

    return (
        <a
            href={file.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block focus:outline-none"
            title={mainTitle}
        >
            {CardContent}
        </a>
    );
}
