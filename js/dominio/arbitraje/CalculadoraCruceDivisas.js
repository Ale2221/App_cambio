/**
 * Archivo: js/dominio/arbitraje/CalculadoraCruceDivisas.js
 * Responsabilidad (SRP): Matriz omnidireccional 4x4 (USD Físico, USDT, VES, COP), comparación con Denver,
 * y ventaja competitiva para el cliente.
 * Paradigma: 100% POO, SOLID (SRP, OCP).
 */

let OperacionBaseCruce = typeof OperacionCambiariaBase !== 'undefined' ? OperacionCambiariaBase : null;
if (!OperacionBaseCruce && typeof require !== 'undefined') {
    OperacionBaseCruce = require('./OperacionCambiariaBase.js').OperacionCambiariaBase;
}

class CalculadoraCruceDivisas extends (OperacionBaseCruce || window.OperacionCambiariaBase) {
    _validar(p) {
        if (!p || Number(p.montoOrigen) <= 0) throw new Error("Monto origen inválido.");
        if (p.monedaOrigen === p.monedaDestino) throw new Error("Moneda origen y destino deben ser diferentes.");
    }

    _procesar(p) {
        const {
            monedaOrigen,
            monedaDestino,
            montoOrigen,
            tasas = {},
            factorCastigoBillete = 1.0,
            esBilleteAceptable = true
        } = p;

        if (!esBilleteAceptable) {
            return {
                esOperacionValida: false,
                motivoRechazo: 'Billete no aceptable (dañado, manchado o serie antigua).',
                montoEntregarCliente: 0,
                montoCompetenciaDenver: 0,
                ventajaCliente: 0,
                gananciaNetaEsperada: 0,
                esRentable: false
            };
        }

        const tDolarBs = Number(tasas.tasaDolarBs) || 995;
        const tUsdtBs = Number(tasas.tasaUsdtBs) || 990;
        const tCopBs = Number(tasas.tasaCopBs) || 3.10;
        const margen = (Number(tasas.margenComercialPorcentaje) || 2.5) / 100;

        // Factores canónicos normalizados respecto a USD base
        const factoresAUsd = {
            'USD_FISICO': 1.0 * factorCastigoBillete,
            'USDT': 1.0,
            'VES': 1 / tDolarBs,
            'COP': 1 / (tDolarBs * tCopBs)
        };

        const factoresDesdeUsd = {
            'USD_FISICO': 1.0,
            'USDT': 1.0,
            'VES': tDolarBs,
            'COP': (tDolarBs * tCopBs)
        };

        const montoUsdBase = montoOrigen * (factoresAUsd[monedaOrigen] || 1);
        const factorSpread = (monedaOrigen === 'VES' || monedaOrigen === 'COP') ? (1 / (1 + margen)) : (1 - margen);
        let montoEntregar = montoUsdBase * (factoresDesdeUsd[monedaDestino] || 1) * factorSpread;

        if (monedaDestino === 'COP') montoEntregar = this.redondearEfectivoCop(montoEntregar, false);
        else montoEntregar = this.redondearMoneda(montoEntregar);

        // Estimación de comparación contra Denver
        const margenDenver = (monedaOrigen === 'VES' && monedaDestino === 'USD_FISICO') ? 0.89 : 0.92;
        const montoDenver = this.redondearMoneda(montoUsdBase * (factoresDesdeUsd[monedaDestino] || 1) * margenDenver);
        const gananciaNeta = this.redondearMoneda(montoOrigen * margen);

        return {
            esOperacionValida: true,
            monedaOrigen,
            monedaDestino,
            montoOrigen,
            montoEntregarCliente: montoEntregar,
            montoCompetenciaDenver: montoDenver,
            ventajaCliente: this.redondearMoneda(montoEntregar - montoDenver),
            gananciaNetaEsperada: gananciaNeta,
            esRentable: gananciaNeta > 0
        };
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CalculadoraCruceDivisas };
} else {
    window.CalculadoraCruceDivisas = CalculadoraCruceDivisas;
}
