/**
 * Archivo: js/dominio/arbitraje/ArbitrajeEntidad.js
 * Responsabilidad (SRP): Fachada principal del dominio financiero de arbitraje que orquesta
 * las calculadoras especializadas (Patrón Facade + Composition).
 * Paradigma: 100% POO, SOLID (SRP, DIP, Facade).
 */

// Carga resiliente de las dependencias de cálculo
let DenverClass = typeof AnalizadorCompetenciaDenver !== 'undefined' ? AnalizadorCompetenciaDenver : null;
let DolaresClass = typeof CalculadoraRutaDolares !== 'undefined' ? CalculadoraRutaDolares : null;
let PesosClass = typeof CalculadoraRutaPesos !== 'undefined' ? CalculadoraRutaPesos : null;
let CruceClass = typeof CalculadoraCruceDivisas !== 'undefined' ? CalculadoraCruceDivisas : null;

if (typeof require !== 'undefined') {
    if (!DenverClass) DenverClass = require('./AnalizadorCompetenciaDenver.js').AnalizadorCompetenciaDenver;
    if (!DolaresClass) DolaresClass = require('./CalculadoraRutaDolares.js').CalculadoraRutaDolares;
    if (!PesosClass) PesosClass = require('./CalculadoraRutaPesos.js').CalculadoraRutaPesos;
    if (!CruceClass) CruceClass = require('./CalculadoraCruceDivisas.js').CalculadoraCruceDivisas;
}

class ArbitrajeEntidad {
    #denver;
    #dolares;
    #pesos;
    #cruce;

    constructor(cfg) {
        const Denver = DenverClass || window.AnalizadorCompetenciaDenver;
        const Dolares = DolaresClass || window.CalculadoraRutaDolares;
        const Pesos = PesosClass || window.CalculadoraRutaPesos;
        const Cruce = CruceClass || window.CalculadoraCruceDivisas;

        this.#denver = new Denver(cfg);
        this.#dolares = new Dolares(cfg);
        this.#pesos = new Pesos(cfg);
        this.#cruce = new Cruce(cfg);
    }

    analizarTrianguloCompetencia(tasas) {
        return this.#denver.ejecutarCalculo(tasas);
    }

    calcularRutaDolares(parametros) {
        return this.#dolares.ejecutarCalculo(parametros);
    }

    calcularRutaPesos(parametros) {
        return this.#pesos.ejecutarCalculo(parametros);
    }

    calcularCruceUniversal(parametros) {
        return this.#cruce.ejecutarCalculo(parametros);
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArbitrajeEntidad };
} else {
    window.ArbitrajeEntidad = ArbitrajeEntidad;
}