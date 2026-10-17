/**
 * Archivo: js/servicios/ManejadorFormatoEntrada.js
 * Responsabilidad (SRP): Normalizar, parsear y dar formato a los campos de texto monetarios
 * en convención hispanohablante (puntos de miles y comas de decimales), preservando decimales exactos.
 * Paradigma: 100% POO, SOLID (SRP).
 */

class ManejadorFormatoEntrada {
    /**
     * Formatea un número en formato latinoamericano respetando decimales exactos.
     * Ejemplo: "130000" -> "130.000", "881.0664" -> "881,0664", "991,1645" -> "991,1645"
     * @param {string|number} valor
     * @returns {string}
     */
    static formatearMonto(valor) {
        if (valor === null || valor === undefined || valor === '') return '';
        let texto = String(valor).trim();
        if (!texto) return '';

        const esNegativo = texto.startsWith('-');
        if (esNegativo) texto = texto.substring(1);

        let parteEntera = texto;
        let parteDecimal = '';

        if (texto.includes(',')) {
            const partes = texto.split(',');
            parteEntera = partes[0].replace(/\./g, '');
            parteDecimal = partes.slice(1).join('');
        } else if (texto.includes('.')) {
            const puntos = (texto.match(/\./g) || []).length;
            if (puntos === 1) {
                const [antes, despues] = texto.split('.');
                // Si la parte derecha tiene longitud distinta de 3 (ej. 881.0664, 991.16, 3.1)
                // O si la parte izquierda es menor a 1000 y no termina en "00", es separador decimal
                if (despues.length !== 3 || (Number(antes) < 1000 && !despues.endsWith('00'))) {
                    parteEntera = antes;
                    parteDecimal = despues;
                } else {
                    parteEntera = texto.replace(/\./g, '');
                }
            } else {
                parteEntera = texto.replace(/\./g, '');
            }
        } else {
            parteEntera = texto.replace(/\./g, '');
        }

        parteEntera = parteEntera.replace(/\D/g, '');
        if (!parteEntera) parteEntera = '0';

        const enteraFormateada = Number(parteEntera).toLocaleString('es-ES');

        if (parteDecimal !== '') {
            const decLimpio = parteDecimal.replace(/\D/g, '');
            return `${esNegativo ? '-' : ''}${enteraFormateada},${decLimpio}`;
        }
        return `${esNegativo ? '-' : ''}${enteraFormateada}`;
    }

    /**
     * Parsea un texto con puntos de miles y comas a float nativo con precisión completa.
     * @param {string|number} texto
     * @param {number} valorPorDefecto
     * @returns {number}
     */
    static parsearNumero(texto, valorPorDefecto = 0) {
        if (texto === null || texto === undefined || texto === '') return valorPorDefecto;
        if (typeof texto === 'number') return Number.isFinite(texto) ? texto : valorPorDefecto;

        let limpio = String(texto).trim();
        if (!limpio) return valorPorDefecto;

        if (limpio.includes(',')) {
            const partes = limpio.split(',');
            const entera = partes[0].replace(/\./g, '');
            const decimal = partes.slice(1).join('');
            const res = parseFloat(`${entera}.${decimal}`);
            return Number.isFinite(res) ? res : valorPorDefecto;
        }

        const puntos = (limpio.match(/\./g) || []).length;
        if (puntos === 0) {
            const res = parseFloat(limpio);
            return Number.isFinite(res) ? res : valorPorDefecto;
        }

        if (puntos === 1) {
            const [antes, despues] = limpio.split('.');
            if (despues.length !== 3 || (Number(antes) < 1000 && !despues.endsWith('00'))) {
                const res = parseFloat(limpio);
                return Number.isFinite(res) ? res : valorPorDefecto;
            }
            const res = parseFloat(limpio.replace(/\./g, ''));
            return Number.isFinite(res) ? res : valorPorDefecto;
        }

        const res = parseFloat(limpio.replace(/\./g, ''));
        return Number.isFinite(res) ? res : valorPorDefecto;
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ManejadorFormatoEntrada };
} else {
    window.ManejadorFormatoEntrada = ManejadorFormatoEntrada;
}
