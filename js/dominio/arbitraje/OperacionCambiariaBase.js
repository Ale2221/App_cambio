/**
 * Archivo: js/dominio/arbitraje/OperacionCambiariaBase.js
 * Responsabilidad (SRP): Clase base abstracta financiera (Patrón Template Method) que gestiona
 * el capital inicial, comisiones bancarias y de plataforma, y redondeos monetarios.
 * Paradigma: 100% POO, SOLID (SRP, OCP, LSP).
 */

class OperacionCambiariaBase {
    #capitalInicialBs;
    #comisionPagoMovilDecimal;
    #comisionRetiroBinanceDecimal;
    #colchonInflacionDecimal;

    /**
     * @param {Object} cfg - Configuración de parámetros financieros.
     * @param {number} [cfg.capitalInicialBs=130000] - Capital disponible en Bs.
     * @param {number} [cfg.comisionPagoMovilPorcentaje=0.3] - Comisión bancaria (0.3%).
     * @param {number} [cfg.comisionRetiroBinancePorcentaje=0.3] - Comisión retiro Binance (0.3%).
     * @param {number} [cfg.colchonInflacionPorcentaje=0.5] - Margen de protección ante devaluación (0.5%).
     */
    constructor(cfg) {
        if (new.target === OperacionCambiariaBase) {
            throw new Error("OperacionCambiariaBase es una clase abstracta y no puede instanciarse directamente.");
        }
        this.#capitalInicialBs = Number(cfg?.capitalInicialBs) || 130000;
        this.#comisionPagoMovilDecimal = (Number(cfg?.comisionPagoMovilPorcentaje) || 0.3) / 100;
        this.#comisionRetiroBinanceDecimal = (Number(cfg?.comisionRetiroBinancePorcentaje) || 0.3) / 100;
        this.#colchonInflacionDecimal = (Number(cfg?.colchonInflacionPorcentaje) || 0.5) / 100;
    }

    get capitalInicialBs() { return this.#capitalInicialBs; }
    get comisionPagoMovilDecimal() { return this.#comisionPagoMovilDecimal; }
    get comisionRetiroBinanceDecimal() { return this.#comisionRetiroBinanceDecimal; }
    get colchonInflacionDecimal() { return this.#colchonInflacionDecimal; }

    /**
     * Redondeo bancario a 2 decimales para evitar fugas de centavos.
     * @param {number} val
     * @returns {number}
     */
    redondearMoneda(val) {
        return Number.isFinite(val) ? Math.round((val + Number.EPSILON) * 100) / 100 : 0;
    }

    /**
     * Redondeo a centenas para efectivo en pesos colombianos (COP).
     * @param {number} monto
     * @param {boolean} [esCosto=false] - Si es costo se redondea hacia arriba; si es entrega al cliente, hacia abajo.
     * @returns {number}
     */
    redondearEfectivoCop(monto, esCosto = false) {
        if (!Number.isFinite(monto) || monto <= 0) return 0;
        return esCosto ? Math.ceil(monto / 100) * 100 : Math.floor(monto / 100) * 100;
    }

    /**
     * Calcula la deducción del Pago Móvil (0.3%) de manera explícita y transparente.
     * @param {boolean} [aplica=true]
     * @returns {{montoTransferibleBs: number, comisionBancariaBs: number}}
     */
    calcularDesglosePagoMovil(aplica = true) {
        if (!aplica || this.#comisionPagoMovilDecimal === 0) {
            return { montoTransferibleBs: this.#capitalInicialBs, comisionBancariaBs: 0 };
        }
        const neto = Math.floor((this.#capitalInicialBs / (1 + this.#comisionPagoMovilDecimal)) * 100) / 100;
        return {
            montoTransferibleBs: neto,
            comisionBancariaBs: this.redondearMoneda(this.#capitalInicialBs - neto)
        };
    }

    /**
     * Ejecuta el cálculo validando primero los parámetros (Template Method).
     * @param {Object} params
     * @returns {Object}
     */
    ejecutarCalculo(params) {
        this._validar(params);
        return this._procesar(params);
    }

    _validar(_params) { throw new Error("Método abstracto _validar no implementado."); }
    _procesar(_params) { throw new Error("Método abstracto _procesar no implementado."); }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OperacionCambiariaBase };
} else {
    window.OperacionCambiariaBase = OperacionCambiariaBase;
}
