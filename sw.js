/**
 * Archivo: sw.js
 * Responsabilidad: Service Worker para funcionamiento Offline y cumplimiento de PWABuilder (PWA / APK).
 */

const NOMBRE_CACHE = 'arbitraje-frontera-v2';
const RECURSOS_PRECACHEAR = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/layout.css',
    './css/componentes.css',
    './css/componentes/tarjetas.css',
    './css/componentes/formularios.css',
    './css/componentes/metricas.css',
    './css/componentes/paneles.css',
    './css/componentes/pizarra.css',
    './css/componentes/tablas.css',
    './css/componentes/pasos.css',
    './js/servicios/FormateadorMonedaServicio.js',
    './js/servicios/ManejadorFormatoEntrada.js',
    './js/servicios/ProveedorTasasServicio.js',
    './js/dominio/arbitraje/PoliticaBillete.js',
    './js/dominio/arbitraje/EvaluadorBilletes.js',
    './js/dominio/arbitraje/OperacionCambiariaBase.js',
    './js/dominio/arbitraje/CalculadoraRutaDolares.js',
    './js/dominio/arbitraje/CalculadoraRutaPesos.js',
    './js/dominio/arbitraje/AnalizadorCompetenciaDenver.js',
    './js/dominio/arbitraje/CalculadoraCruceDivisas.js',
    './js/dominio/arbitraje/ArbitrajeEntidad.js',
    './js/controladores/arbitraje/ArbitrajeControlador.js',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/icon-maskable-192.png',
    './assets/icon-maskable-512.png',
    './assets/captura-movil.png',
    './assets/captura-escritorio.png'
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
                return caches.match('./index.html');
            });
        })
    );
});
