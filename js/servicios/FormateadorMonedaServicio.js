/**
 * Archivo: js/servicios/FormateadorMonedaServicio.js
 * Responsabilidad (SRP): Formatear montos y tasas para Bolívares (Bs), Pesos Colombianos (COP),
 * Dólares Físicos (USD) y Divisas Virtuales (USDT) con complejidad O(1) y respeto de convenciones decimales.
 * Paradigma: 100% POO, SOLID (SRP, Strategy Pattern).
 */

class FormateadorDivisa {
    #formateadorNativo;
    #simboloPrefijo;
    #simboloSufijo;

    /**
     * @param {string} localizacion - Configuración regional ('es-VE', 'es-CO').
     * @param {number} decimales - Cantidad fija de decimales a mostrar.
     * @param {string} [prefijo=""] - Prefijo visual (ej. "$").
     * @param {string} [sufijo=""] - Sufijo visual (ej. " Bs", " COP", " USD").
     */
    constructor(localizacion, decimales, prefijo = '', sufijo = '') {
        this.#formateadorNativo = new Intl.NumberFormat(localizacion, {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        });
        this.#simboloPrefijo = String(prefijo);
        this.#simboloSufijo = String(sufijo);
    }

    formatear(monto) {
        const valor = Number.isFinite(Number(monto)) ? Number(monto) : 0;
        const texto = this.#formateadorNativo.format(Math.abs(valor));
        return `${valor < 0 ? '-' : ''}${this.#simboloPrefijo}${texto}${this.#simboloSufijo}`;
    }

    formatearConSigno(monto) {
        const valor = Number.isFinite(Number(monto)) ? Number(monto) : 0;
        const texto = this.#formateadorNativo.format(Math.abs(valor));
        const signo = valor > 0 ? '+' : valor < 0 ? '-' : '';
        return `${signo}${this.#simboloPrefijo}${texto}${this.#simboloSufijo}`;
    }
}

class FormateadorMonedaServicio {
    #estrategias;

    constructor() {
        this.#estrategias = new Map([
            ['BS', new FormateadorDivisa('es-VE', 2, '', ' Bs')],
            ['COP', new FormateadorDivisa('es-CO', 0, '$', ' COP')],
            ['COP_TASA', new FormateadorDivisa('es-CO', 2, '$', ' COP')],
            ['USD', new FormateadorDivisa('es-VE', 2, '$', ' USD')],
            ['USDT', new FormateadorDivisa('es-VE', 2, '', ' USDT')],
            ['USD_FISICO', new FormateadorDivisa('es-VE', 2, '$', ' USD')]
        ]);
    }

    enBolivares(monto) { return this.#estrategias.get('BS').formatear(monto); }
    enBolivaresConSigno(monto) { return this.#estrategias.get('BS').formatearConSigno(monto); }
    enPesos(monto) { return this.#estrategias.get('COP').formatear(monto); }
    enPesosConSigno(monto) { return this.#estrategias.get('COP').formatearConSigno(monto); }
    enTasaPesos(tasa) { return this.#estrategias.get('COP_TASA').formatear(tasa); }
    enDolaresFisicos(monto) { return this.#estrategias.get('USD').formatear(monto); }
    enDolaresConSigno(monto) { return this.#estrategias.get('USD').formatearConSigno(monto); }
    enUsdt(monto) { return this.#estrategias.get('USDT').formatear(monto); }

    formatearSegunDivisa(monto, divisa) {
        const formateador = this.#estrategias.get(divisa) || this.#estrategias.get('USD');
        return formateador.formatear(monto);
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormateadorDivisa, FormateadorMonedaServicio, FormateadorMoneda: FormateadorMonedaServicio };
} else {
    window.FormateadorDivisa = FormateadorDivisa;
    window.FormateadorMonedaServicio = FormateadorMonedaServicio;
    window.FormateadorMoneda = FormateadorMonedaServicio;
}
