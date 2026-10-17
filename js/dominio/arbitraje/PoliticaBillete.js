/**
 * Archivo: js/dominio/arbitraje/PoliticaBillete.js
 * Responsabilidad (SRP): Definir la entidad inmutable de políticas de valuación y castigo para billetes físicos de USD.
 * Paradigma: 100% POO, SOLID (SRP).
 */

class PoliticaBillete {
    #codigo;
    #descripcion;
    #descuentoDecimal;
    #esAceptable;

    /**
     * @param {string} codigo - Código de política (ej. 'PREMIUM_100_50').
     * @param {string} descripcion - Descripción legible del estado físico.
     * @param {number} descuentoPorcentaje - Porcentaje de castigo (ej. 2.5).
     * @param {boolean} [esAceptable=true] - Indica si el billete se acepta o se rechaza.
     */
    constructor(codigo, descripcion, descuentoPorcentaje, esAceptable = true) {
        this.#codigo = String(codigo);
        this.#descripcion = String(descripcion);
        this.#descuentoDecimal = Number(descuentoPorcentaje) / 100;
        this.#esAceptable = Boolean(esAceptable);
    }

    get codigo() { return this.#codigo; }
    get descripcion() { return this.#descripcion; }
    get porcentajeCastigo() { return Math.round(this.#descuentoDecimal * 10000) / 100; }
    get esAceptable() { return this.#esAceptable; }

    /**
     * Calcula la tasa tope en bolívares descontando el castigo físico.
     * @param {number} tasaBase - Tasa de compra para billetes sanos.
     * @returns {number}
     */
    calcularTasaMaxima(tasaBase) {
        if (!this.#esAceptable || Number(tasaBase) <= 0) return 0;
        return Math.floor(Number(tasaBase) * (1 - this.#descuentoDecimal));
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PoliticaBillete };
} else {
    window.PoliticaBillete = PoliticaBillete;
}
