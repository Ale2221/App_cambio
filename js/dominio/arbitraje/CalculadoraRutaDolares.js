/**
 * Archivo: js/dominio/arbitraje/CalculadoraRutaDolares.js
 * Responsabilidad (SRP): Calcular la ruta de arbitraje Bs -> USD (Binance) -> Bs, deducciones
 * operativas, Línea Roja de seguridad y beneficio neto.
 * Paradigma: 100% POO, SOLID (SRP, OCP).
 */

let OperacionBase = typeof OperacionCambiariaBase !== 'undefined' ? OperacionCambiariaBase : null;
if (!OperacionBase && typeof require !== 'undefined') {
    OperacionBase = require('./OperacionCambiariaBase.js').OperacionCambiariaBase;
}

class CalculadoraRutaDolares extends (OperacionBase || window.OperacionCambiariaBase) {
    _validar(p) {
        if (!p || Number(p.tasaCompraUsd) <= 0 || Number(p.tasaVentaUsd) <= 0) {
            throw new Error("Tasas de compra o venta de USD inválidas.");
        }
    }

    _procesar(p) {
        const tCompra = Number(p.tasaCompraUsd);
        const tVenta = Number(p.tasaVentaUsd);
        const { montoTransferibleBs, comisionBancariaBs } = this.calcularDesglosePagoMovil(Boolean(p.pagaConPagoMovilAlComprar));

        const dolaresAdquiridos = montoTransferibleBs / tCompra;
        const friccionTotal = (p.pagaConPagoMovilAlComprar ? this.comisionPagoMovilDecimal : 0) +
                              (p.usaRetiroBinance ? this.comisionRetiroBinanceDecimal : 0) +
                              this.colchonInflacionDecimal;

        const tasaLineaRojaBs = Math.ceil(tCompra * (1 + friccionTotal));
        const bsBrutos = dolaresAdquiridos * tVenta;
        const comisionBinance = p.usaRetiroBinance ? bsBrutos * this.comisionRetiroBinanceDecimal : 0;
        const bsNetos = bsBrutos - comisionBinance;

        const dolaresRecomprados = bsNetos / (tCompra * (1 + this.colchonInflacionDecimal));
        const gananciaUsd = dolaresRecomprados - (this.capitalInicialBs / tCompra);

        return {
            tasaLineaRojaBs,
            capitalInicialBs: this.capitalInicialBs,
            montoTransferibleBs: this.redondearMoneda(montoTransferibleBs),
            comisionPagoMovilBs: this.redondearMoneda(comisionBancariaBs),
            dolaresCompradosInicio: this.redondearMoneda(dolaresAdquiridos),
            ventaBrutaBs: this.redondearMoneda(bsBrutos),
            comisionRetiroBinanceBs: this.redondearMoneda(comisionBinance),
            comisionesTotalesBs: this.redondearMoneda(comisionBancariaBs + comisionBinance),
            bolivaresNetosFinales: this.redondearMoneda(bsNetos),
            dolaresRecibeTuCliente: this.redondearMoneda(this.capitalInicialBs / tVenta),
            gananciaNetaBs: this.redondearMoneda(bsNetos - this.capitalInicialBs),
            gananciaNetaUsd: this.redondearMoneda(gananciaUsd),
            esRentable: gananciaUsd > 0 && tVenta >= tasaLineaRojaBs
        };
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CalculadoraRutaDolares };
} else {
    window.CalculadoraRutaDolares = CalculadoraRutaDolares;
}
