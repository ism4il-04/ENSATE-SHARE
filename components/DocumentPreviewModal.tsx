'use client';

import { X, Download, ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: {
        id: string;
        name: string;
        url: string;
        type: string;
    } | null;
}

const OFFICE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

export default function DocumentPreviewModal({ isOpen, onClose, file }: DocumentPreviewModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !file) return null;

    const { id, name, url, type } = file;
    const isOfficeLike = OFFICE_TYPES.includes(type.toLowerCase());

    // Helper to check for Google Drive URL and extract ID
    const getDrivePreviewUrl = (url: string) => {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        return null;
    };

    const drivePreviewUrl = getDrivePreviewUrl(url);

    // Determine the source for the iframe
    let viewerSrc = url;

    if (drivePreviewUrl) {
        viewerSrc = drivePreviewUrl;
    } else if (isOfficeLike && type.toLowerCase() !== 'pdf') { // PDF usually renders fine in iframe directly, but office docs need viewer
        const encodedUrl = encodeURIComponent(url);
        viewerSrc = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
    const downloadHref = id ? `${apiBase}/files/${id}/download` : url;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
            <div
                ref={modalRef}
                className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-4 flex-1" title={name}>
                        {name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ouvrir dans un nouvel onglet"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <a
                            href={downloadHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Télécharger</span>
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Fermer"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 relative">
                    {type.toLowerCase() === 'pdf' ? (
                        <iframe
                            src={viewerSrc}
                            title={name}
                            className="w-full h-full border-0"
                        />
                    ) : (displayOfficeOrOther(viewerSrc, name))}
                </div>
            </div>
        </div>
    );

    function displayOfficeOrOther(src: string, title: string) {
        return (
            <iframe
                src={src}
                title={title}
                className="w-full h-full border-0"
            />
        );
    }
}
