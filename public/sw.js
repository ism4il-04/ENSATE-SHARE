// Minimal service worker: makes the app installable and shows a friendly page when offline.
// Nothing else is cached, so documents and accounts always come fresh from the server.
const CACHE = 'ensate-share-offline-v1';
const OFFLINE_URL = '/offline.html';
const OFFLINE_ICON = '/icons/icon-192.png';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, OFFLINE_ICON])));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { pathname } = new URL(event.request.url);
    // The offline page's logo, available without a connection
    if (pathname === OFFLINE_ICON) {
        event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_ICON)));
        return;
    }
    // Otherwise page loads only; API calls, scripts and files go straight to the network
    if (event.request.mode !== 'navigate') return;
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
