/*
 * ============================================================
 * SERVICE WORKER PARA MisTurnos
 * ============================================================
 * Un Service Worker es un script que el navegador ejecuta en
 * segundo plano, separado de la página web. Permite:
 * 1. Cachear archivos estáticos para uso offline
 * 2. Interceptar peticiones de red
 * 3. Servir contenido desde la caché cuando no hay internet
 * ============================================================
 */

// Nombre de la caché donde guardaremos los archivos
const CACHE_NAME = 'misturnos-v1';

// Lista de archivos a cachear cuando se instala el Service Worker
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/auth.js',
    './js/patients.js',
    './js/appointments.js',
    './js/profile.js',
    './manifest.json',
    // Recursos externos (CDN)
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

/*
 * EVENTO: install
 * Se dispara cuando el navegador registra el Service Worker.
 * Acá cacheamos todos los archivos estáticos.
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cacheando archivos estáticos...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Forzar que el nuevo SW active inmediatamente
    self.skipWaiting();
});

/*
 * EVENTO: activate
 * Se dispara después del install. Limpia cachés viejas
 * que ya no necesitamos (por ejemplo, cuando actualizás la versión).
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME) // Cachés que no son la actual
                    .map((name) => caches.delete(name))     // Las borramos
            );
        })
    );
    // Tomar control de todas las pestañas inmediatamente
    self.clients.claim();
});

/*
 * EVENTO: fetch
 * Se dispara CADA VEZ que la página hace una petición de red
 * (imágenes, scripts, fetch a APIs, etc).
 * Estrategia: "Cache First" - primero intentamos desde la caché,
 * si no está, vamos a la red.
 */
self.addEventListener('fetch', (event) => {
    // Solo interceptamos peticiones GET (no POST, PUT, DELETE)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Si está en caché, lo devolvemos directamente
                return cachedResponse;
            }
            // Si no está, vamos a la red
            return fetch(event.request).then((networkResponse) => {
                // Guardamos en caché para la próxima vez
                // (solo si la respuesta es válida)
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si falla la red Y no hay caché, mostramos fallback
                // para páginas HTML
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
