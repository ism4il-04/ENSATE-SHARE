'use client';

import { useEffect } from 'react';

// Registers the service worker that makes the site installable (production only: no stale pages in dev)
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Not fatal: the site works the same without it
        });
    }, []);
    return null;
}
