/**
 * Archivo: sw.js
 * Responsabilidad: Service Worker para funcionamiento Offline y cumplimiento de PWABuilder (PWA / APK).
 */

const NOMBRE_CACHE = 'arbitraje-frontera-v1';
const RECURSOS_PRECACHEAR = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/layout.css',
    './css/componentes.css',
    './js/controladores/arbitraje/ArbitrajeControlador.js',
    './js/dominio/arbitraje/ArbitrajeEntidad.js',
    './js/dominio/arbitraje/EvaluadorBilletes.js',
    './js/utilidades/FormateadorMoneda.js'
];

// Instalación: Guardar recursos críticos en caché
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(NOMBRE_CACHE).then((cache) => {
            return cache.addAll(RECURSOS_PRECACHEAR);
        }).then(() => self.skipWaiting())
    );
});

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((claves) => {
            return Promise.all(
                claves.filter((clave) => clave !== NOMBRE_CACHE).map((clave) => caches.delete(clave))
            );
        }).then(() => self.clients.claim())
    );
});

// Intercepción de peticiones (Estrategia: Cache primero, luego red)
self.addEventListener('fetch', (evento) => {
    evento.respondWith(
        caches.match(evento.request).then((respuestaCache) => {
            if (respuestaCache) {
                return respuestaCache;
            }
            return fetch(evento.request).catch(() => {
                // Fallback offline si aplica
                return caches.match('./index.html');
            });
        })
    );
});
