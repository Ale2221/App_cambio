/**
 * Archivo: js/dominio/arbitraje/EvaluadorBilletes.js
 * Responsabilidad (SRP): Servicio de dominio para evaluar y calcular tasas castigadas de billetes físicos con complejidad O(1).
 * Paradigma: 100% POO, SOLID (SRP, Strategy Pattern).
 */

// Carga resiliente de la dependencia PoliticaBillete
let PoliticaBilleteClase = typeof PoliticaBillete !== 'undefined' ? PoliticaBillete : null;
if (!PoliticaBilleteClase && typeof require !== 'undefined') {
    PoliticaBilleteClase = require('./PoliticaBillete.js').PoliticaBillete;
}

class EvaluadorBilletes {
    #politicas;
    #indiceDenominacion;

    constructor() {
        const Politica = PoliticaBilleteClase || window.PoliticaBillete;
        const pPremium = new Politica('PREMIUM_100_50', '$100 / $50 Cinta Azul (Sano)', 0, true);
        const pMediano = new Politica('MEDIANO_20_10', '$20 / $10 (Buen estado)', 2.5, true);
        const pSencillo = new Politica('SENCILLO_5_1', '$5 / $1 (Sencillo sano)', 5.5, true);
        const pRechazado = new Politica('RECHAZADO_DETERIORADO', 'Cara pequeña / Sellado / Roto', 100, false);

        this.#politicas = [pPremium, pMediano, pSencillo, pRechazado];
        this.#indiceDenominacion = new Map([
            [100, pPremium], [50, pPremium],
            [20, pMediano], [10, pMediano],
            [5, pSencillo], [1, pSencillo]
        ]);
    }

    /**
     * Genera la tabla comparativa de tasas para la interfaz.
     * @param {number} tasaBase - Cotización máxima de compra para billetes sanos.
     * @returns {Array<Object>}
     */
    generarTablaReferencia(tasaBase) {
        return this.#politicas.map((p) => ({
            codigo: p.codigo,
            descripcion: p.descripcion,
            porcentajeCastigo: p.porcentajeCastigo,
            esAceptable: p.esAceptable,
            tasaMaximaBs: p.calcularTasaMaxima(tasaBase)
        }));
    }

    /**
     * Evalúa un billete individual devolviendo si se acepta y cuánto pagar por él.
     * @param {number} denominacion - Valor nominal del billete (1, 5, 10, 20, 50, 100).
     * @param {number} tasaBase - Tasa de compra de billetes sanos.
     * @param {boolean} [deteriorado=false] - Indica daño físico.
     * @returns {Object}
     */
    evaluarBilleteIndividual(denominacion, tasaBase, deteriorado = false) {
        if (deteriorado) {
            return {
                esAceptable: false,
                tasaAplicadaBs: 0,
                montoTotalPagarBs: 0,
                motivo: 'Rechazado por daño, mancha o serie antigua.'
            };
        }
        const politica = this.#indiceDenominacion.get(Number(denominacion)) || this.#politicas[1];
        const tasa = politica.calcularTasaMaxima(tasaBase);
        return {
            esAceptable: politica.esAceptable,
            tasaAplicadaBs: tasa,
            montoTotalPagarBs: Number(denominacion) * tasa,
            motivo: politica.descripcion
        };
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EvaluadorBilletes };
} else {
    window.EvaluadorBilletes = EvaluadorBilletes;
}