import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import LegalFooterLinks from '@/components/LegalFooterLinks';

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

// Shared layout for the Mentions légales and Politique de confidentialité pages
export default function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
    return (
        <div className="min-h-screen bg-cream-100 flex flex-col">
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-atlas-800 via-atlas-700 to-atlas-900" />
                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-cream-200 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Accueil
                        </Link>
                        <Link href="/" className="flex shrink-0">
                            <Image
                                src="/ensa-share_logo_white.png"
                                alt="ENSATE-SHARE"
                                width={220}
                                height={82}
                                className="h-12 w-auto"
                            />
                        </Link>
                    </div>
                    <h1 className="mt-8 text-3xl sm:text-4xl font-bold text-cream-50">{title}</h1>
                    <p className="mt-2 text-sm text-cream-200/90">Dernière mise à jour : {lastUpdated}</p>
                </div>
            </header>

            <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <article className="card border border-cream-300/60 shadow-sm space-y-8 text-atlas-700 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-atlas-800 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:text-atlas-800 [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p+p]:mt-3 [&_a]:text-accent-600 [&_a]:underline [&_a:hover]:text-accent-700">
                    {children}
                </article>
            </main>

            <footer className="border-t border-cream-300/60 bg-cream-50/50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-2 text-center">
                    <LegalFooterLinks />
                    <p className="text-atlas-600 text-sm">
                        © 2026 ENSATE-SHARE — École Nationale des Sciences Appliquées
                    </p>
                </div>
            </footer>
        </div>
    );
}
