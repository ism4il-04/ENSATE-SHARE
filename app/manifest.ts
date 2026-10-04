import type { MetadataRoute } from 'next';

// Makes the site installable on phones ("Ajouter à l'écran d'accueil")
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ENSATE-SHARE',
        short_name: 'ENSATE-SHARE',
        description: 'Cours, TD, TP et examens de l\'ENSA Tétouan, par parcours et module',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        lang: 'fr',
        background_color: '#faf8f5',
        theme_color: '#0f1828',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
