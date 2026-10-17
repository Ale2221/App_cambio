/**
 * Archivo: js/dominio/arbitraje/AnalizadorCompetenciaDenver.js
 * Responsabilidad (SRP): Analizar la fuga de capital por doble peaje cambiario en casas de cambio (Denver),
 * calculando dólares reales recibidos vs ilusión monetaria del cartel.
 * Paradigma: 100% POO, SOLID (SRP, OCP).
 */

let OperacionBaseDenver = typeof OperacionCambiariaBase !== 'undefined' ? OperacionCambiariaBase : null;
if (!OperacionBaseDenver && typeof require !== 'undefined') {
    OperacionBaseDenver = require('./OperacionCambiariaBase.js').OperacionCambiariaBase;
}

class AnalizadorCompetenciaDenver extends (OperacionBaseDenver || window.OperacionCambiariaBase) {
    _validar(tasas) {
        if (!tasas || Number(tasas.compraBsEnCop) <= 0 || Number(tasas.tasaDolarCartelBs) <= 0) {
            throw new Error("Tasas de competencia inválidas.");
        }
    }

    _procesar(tasas) {
        const compraCop = Number(tasas.compraBsEnCop);
        const dolarCartelBs = Number(tasas.tasaDolarCartelBs);
        const pesosIntermedios = this.capitalInicialBs * compraCop;
        const tasaVentaCop = pesosIntermedios >= 300000 ? (Number(tasas.ventaBsMayorCop) || 3.3) : 3.4;

        const tasaDolarImplicitaCop = dolarCartelBs * tasaVentaCop;
        const dolaresReales = pesosIntermedios / tasaDolarImplicitaCop;
        const dolaresIlusion = this.capitalInicialBs / dolarCartelBs;

        return {
            pesosIntermediosRecibidos: this.redondearEfectivoCop(pesosIntermedios, false),
            tasaEscalonadaAplicadaCop: tasaVentaCop,
            tasaDolarImplicitaCop: this.redondearMoneda(tasaDolarImplicitaCop),
            dolaresRecibidosEnCompetencia: this.redondearMoneda(dolaresReales),
            tasaRealPagadaBsPorUsd: this.redondearMoneda(this.capitalInicialBs / dolaresReales),
            dolaresPerdidosEnTriangulo: this.redondearMoneda(dolaresIlusion - dolaresReales)
        };
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalizadorCompetenciaDenver };
} else {
    window.AnalizadorCompetenciaDenver = AnalizadorCompetenciaDenver;
}
