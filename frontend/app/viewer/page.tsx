 'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const OFFICE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

export default function ViewerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const id = searchParams.get('id');
    const url = searchParams.get('url');
    const name = searchParams.get('name') || 'Document';
    const type = (searchParams.get('type') || '').toLowerCase();

    if (!url) {
        // No URL – just go back home
        router.replace('/');
        return null;
    }

    const isOfficeLike = OFFICE_TYPES.includes(type);

    // For PDFs / Office files, use Google Docs Viewer for a nicer in‑browser experience.
    // For other types, fall back to embedding the raw URL.
    const encodedUrl = encodeURIComponent(url);
    const viewerSrc = isOfficeLike
        ? `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`
        : url;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const downloadHref = id ? `${apiBase}/files/${id}/download` : url;

    return (
        <div className="min-h-screen flex flex-col bg-cream-100">
            <header className="border-b border-cream-300/60 bg-white/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-1.5 text-sm text-atlas-700 hover:text-atlas-900"
                        >
                            <ArrowLeft size={18} />
                            <span>Retour</span>
                        </button>
                        <h1 className="text-sm sm:text-base font-semibold text-atlas-900 truncate" title={name}>
                            {name}
                        </h1>
                    </div>
                    <Link
                        href={downloadHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-accent-500 text-white hover:bg-accent-600"
                    >
                        Télécharger
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-64px)]">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-gray-50 border border-cream-300 shadow-inner">
                        <iframe
                            src={viewerSrc}
                            title={name}
                            className="w-full h-full"
                            style={{ border: 'none' }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

