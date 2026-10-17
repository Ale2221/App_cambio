/**
 * Archivo: js/app.js
 * Responsabilidad: Punto de entrada ligero y agregador de compatibilidad histórica.
 * Nota: El código ha sido modularizado según principios SOLID y DDD en:
 * - js/servicios/
 * - js/dominio/arbitraje/
 * - js/controladores/arbitraje/
 */

// Si no ha sido inicializado el controlador, se inicializa de forma segura
if (typeof window !== 'undefined' && !window.__ARBITRAJE_APP_INICIALIZADA__) {
    if (typeof ArbitrajeControlador !== 'undefined') {
        window.__ARBITRAJE_APP_INICIALIZADA__ = true;
        new ArbitrajeControlador();
    }
}
