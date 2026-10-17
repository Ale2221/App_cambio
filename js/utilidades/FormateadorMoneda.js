/**
 * Archivo: js/utilidades/FormateadorMoneda.js
 * Responsabilidad: Re-exportación y compatibilidad hacia atrás con la nueva arquitectura modular de servicios.
 */

let FormatoServicio = typeof FormateadorMonedaServicio !== 'undefined' ? FormateadorMonedaServicio : null;
let ManejadorEntrada = typeof ManejadorFormatoEntrada !== 'undefined' ? ManejadorFormatoEntrada : null;

if (typeof require !== 'undefined') {
    if (!FormatoServicio) FormatoServicio = require('../servicios/FormateadorMonedaServicio.js').FormateadorMonedaServicio;
    if (!ManejadorEntrada) ManejadorEntrada = require('../servicios/ManejadorFormatoEntrada.js').ManejadorFormatoEntrada;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FormateadorMoneda: FormatoServicio,
        FormateadorMonedaServicio: FormatoServicio,
        ManejadorFormatoEntrada: ManejadorEntrada
    };
} else {
    window.FormateadorMoneda = FormatoServicio;
    window.ManejadorFormatoEntrada = ManejadorEntrada;
}