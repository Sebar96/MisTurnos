/*
 * SERVICE WORKER v6 - MisTurnos
 * Estrategia: Cache First para archivos estáticos, Network First para datos
 */

const CACHE_NAME = 'misturnos-v8';
const CACHE_STATIC = 'misturnos-static-v8';
const CACHE_FONTS = 'misturnos-fonts-v1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/auth.js',
    './js/patients.js',
    './js/appointments.js',
    './js/profile.js',
    './js/messages.js',
    './js/monitor.js',
    './js/billing.js',
    './js/admin.js',
    './js/i18n.js',
    './manifest.json'
];

const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

const FONT_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    console.log('[SW v8] Instalando...');
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_STATIC).then((cache) => {
                console.log('[SW v8] Cacheando archivos estáticos...');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(CACHE_FONTS).then((cache) => {
                console.log('[SW v8] Cacheando CDNs y fuentes...');
                return cache.addAll([...CDN_ASSETS, ...FONT_ASSETS]);
            })
        ])
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW v8] Activando...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) =>
                    key !== CACHE_STATIC && key !== CACHE_FONTS
                ).map((key) => {
                    console.log('[SW v8] Eliminando caché viejo:', key);
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/users/') || url.pathname.includes('firestore')) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cacheName = request.url.includes('fonts.googleapis') ? CACHE_FONTS : CACHE_STATIC;
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
        }
        return new Response('', { status: 408 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('[]', {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
