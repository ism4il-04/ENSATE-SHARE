import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'ENSATE-SHARE',
    description: 'Application web de gestion et partage de documents académiques',
    appleWebApp: { capable: true, title: 'ENSATE-SHARE', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
    themeColor: '#0f1828',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <Providers>{children}</Providers>
                <ServiceWorkerRegister />
            </body>
        </html>
    );
}
