/**
 * Archivo: js/dominio/arbitraje/CalculadoraRutaPesos.js
 * Responsabilidad (SRP): Calcular la ruta de arbitraje Bs -> COP (Rubio/Cúcuta) -> Bs,
 * comisiones de reposición y margen neto en pesos y bolívares.
 * Paradigma: 100% POO, SOLID (SRP, OCP).
 */

let OperacionBasePesos = typeof OperacionCambiariaBase !== 'undefined' ? OperacionCambiariaBase : null;
if (!OperacionBasePesos && typeof require !== 'undefined') {
    OperacionBasePesos = require('./OperacionCambiariaBase.js').OperacionCambiariaBase;
}

class CalculadoraRutaPesos extends (OperacionBasePesos || window.OperacionCambiariaBase) {
    _validar(p) {
        if (!p || Number(p.tasaTuCompraBsEnCop) <= 0 || Number(p.tasaTuVentaBsEnCop) <= 0) {
            throw new Error("Tasas de COP inválidas.");
        }
    }

    _procesar(p) {
        const tCompra = Number(p.tasaTuCompraBsEnCop);
        const tVenta = Number(p.tasaTuVentaBsEnCop);
        const { montoTransferibleBs, comisionBancariaBs } = this.calcularDesglosePagoMovil(true);

        const copCobrados = this.redondearEfectivoCop(montoTransferibleBs * tVenta, false);
        const copReposicion = this.redondearEfectivoCop(this.capitalInicialBs * tCompra, true);
        const gananciaCop = copCobrados - copReposicion;

        return {
            comisionBancoBs: comisionBancariaBs,
            tasaLineaRojaCop: this.redondearMoneda(tCompra * (1 + this.comisionPagoMovilDecimal + this.colchonInflacionDecimal)),
            pesosCobradosCliente: copCobrados,
            pesosPagadosReposicion: copReposicion,
            gananciaNetaCop: gananciaCop,
            gananciaEquivalenteBs: this.redondearMoneda(gananciaCop / tCompra),
            esRentable: gananciaCop > 0
        };
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CalculadoraRutaPesos };
} else {
    window.CalculadoraRutaPesos = CalculadoraRutaPesos;
}
