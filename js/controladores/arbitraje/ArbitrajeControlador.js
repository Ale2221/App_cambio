/**
 * Archivo: js/controladores/arbitraje/ArbitrajeControlador.js
 * Responsabilidad (SRP): Orquestador de presentación y eventos DOM, desacoplado de los servicios
 * y reglas del dominio financiero (Arquitectura Limpia / SOLID).
 * Paradigma: 100% POO, compatible con doble clic directo (file:///) y compilación PWA/APK.
 */

class ArbitrajeControlador {
    #formateador;
    #evaluadorBilletes;

    constructor() {
        // Carga resiliente de servicios inyectados
        const FormatoClase = window.FormateadorMonedaServicio || window.FormateadorMoneda;
        const EvaluadorClase = window.EvaluadorBilletes;

        this.#formateador = new FormatoClase();
        this.#evaluadorBilletes = new EvaluadorClase();

        this.#inicializarNavegacionPestanas();
        this.#inicializarInteracciones();
        this.#registrarServiceWorker();
    }

    #registrarServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .catch((err) => console.warn('PWA Service Worker offline/ignorado:', err.message));
            });
        }
    }

    #inicializarNavegacionPestanas() {
        const botones = document.querySelectorAll('.boton-pestana');
        const vistas = document.querySelectorAll('.seccion-vista');

        botones.forEach((btn) => {
            btn.addEventListener('click', () => {
                const destino = btn.getAttribute('data-pestana');
                botones.forEach((b) => b.classList.remove('activo'));
                vistas.forEach((v) => v.classList.remove('activa'));
                btn.classList.add('activo');
                document.getElementById(destino)?.classList.add('activa');
            });
        });
    }

    #inicializarInteracciones() {
        // 1. Selector de Perfiles de Trabajo (Bono de Guerra VES, Trabajo COP, Dólar USD)
        const botonesPerfil = document.querySelectorAll('.boton-perfil');
        const selectMoneda = document.getElementById('entrada-moneda-capital');
        const inputCapital = document.getElementById('entrada-capital');

        botonesPerfil.forEach((btn) => {
            btn.addEventListener('click', () => {
                const moneda = btn.getAttribute('data-moneda');
                botonesPerfil.forEach((b) => b.classList.remove('activo'));
                btn.classList.add('activo');

                if (selectMoneda) selectMoneda.value = moneda;

                if (moneda === 'VES' && inputCapital) {
                    inputCapital.value = '130.000';
                } else if (moneda === 'COP' && inputCapital) {
                    inputCapital.value = '400.000';
                } else if (moneda === 'USD' && inputCapital) {
                    inputCapital.value = '100';
                }

                this.sincronizar();
            });
        });

        if (selectMoneda) {
            selectMoneda.addEventListener('change', () => {
                const moneda = selectMoneda.value;
                botonesPerfil.forEach((b) => {
                    b.classList.toggle('activo', b.getAttribute('data-moneda') === moneda);
                });
                this.sincronizar();
            });
        }

        // 2. Máscara de Formato Numérico con Puntos y Comas
        const ManejadorEntrada = window.ManejadorFormatoEntrada;
        document.querySelectorAll('.campo-monetario').forEach((campo) => {
            campo.addEventListener('focus', () => {
                campo.select();
            });

            campo.addEventListener('blur', () => {
                if (campo.value.trim() !== '' && ManejadorEntrada) {
                    campo.value = ManejadorEntrada.formatearMonto(campo.value);
                }
                this.sincronizar();
            });

            campo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    campo.blur();
                }
            });
        });

        // 3. Botones de Ayuda Táctiles para Android / Web
        const botonesAyuda = document.querySelectorAll('.boton-ayuda-info');
        botonesAyuda.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idAyuda = btn.getAttribute('data-ayuda');
                const cajaAyuda = document.getElementById(idAyuda);
                if (cajaAyuda) {
                    const estaVisible = cajaAyuda.classList.contains('visible');
                    document.querySelectorAll('.caja-ayuda-desplegable').forEach((c) => c.classList.remove('visible'));
                    document.querySelectorAll('.boton-ayuda-info').forEach((b) => b.classList.remove('activo'));
                    if (!estaVisible) {
                        cajaAyuda.classList.add('visible');
                        btn.classList.add('activo');
                    }
                }
            });
        });

        // Cerrar cajas de ayuda al tocar fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.caja-ayuda-desplegable') && !e.target.closest('.boton-ayuda-info')) {
                document.querySelectorAll('.caja-ayuda-desplegable').forEach((c) => c.classList.remove('visible'));
                document.querySelectorAll('.boton-ayuda-info').forEach((b) => b.classList.remove('activo'));
            }
        });

        // 4. Actualización de Tasas en Tiempo Real
        const btnActualizar = document.getElementById('boton-actualizar-tasas');
        if (btnActualizar) {
            btnActualizar.addEventListener('click', () => this.actualizarTasasEnVivo());
        }

        // 5. Aplicar Tasas de Binance al Simulador
        const btnAplicar = document.getElementById('boton-aplicar-tasas');
        if (btnAplicar) {
            btnAplicar.addEventListener('click', () => {
                const binCompra = document.getElementById('entrada-binance-compra')?.value;
                const binVenta = document.getElementById('entrada-binance-venta')?.value;
                const inCompraUsd = document.getElementById('entrada-compra-usd');
                const inVentaUsd = document.getElementById('entrada-venta-usd');

                if (binCompra && inCompraUsd) inCompraUsd.value = binCompra;
                if (binVenta && inVentaUsd) inVentaUsd.value = binVenta;

                this.sincronizar();

                btnAplicar.textContent = '✅ ¡Tasas de Binance Aplicadas al Simulador!';
                setTimeout(() => {
                    btnAplicar.textContent = `⚡ Aplicar Tasas de Binance a mi Simulador (Compra @ ${binCompra || '980,54'} | Venta @ ${binVenta || '1.008,00'})`;
                }, 2000);
            });
        }

        // 6. Sincronización Bidireccional de Tasas de Calle (Pizarra del Día <-> Rutas Operativas)
        const inCalleRubio = document.getElementById('entrada-tasa-calle-rubio');
        const inCompraCop = document.getElementById('entrada-compra-cop');
        if (inCalleRubio && inCompraCop) {
            inCalleRubio.addEventListener('input', () => {
                inCompraCop.value = inCalleRubio.value;
            });
            inCompraCop.addEventListener('input', () => {
                inCalleRubio.value = inCompraCop.value;
            });
        }

        const inPizarraDenver = document.getElementById('entrada-pizarra-denver-dolar');
        const inDenverDolar = document.getElementById('entrada-denver-dolar');
        if (inPizarraDenver && inDenverDolar) {
            inPizarraDenver.addEventListener('input', () => {
                inDenverDolar.value = inPizarraDenver.value;
            });
            inDenverDolar.addEventListener('input', () => {
                inPizarraDenver.value = inDenverDolar.value;
            });
        }

        // 7. Recálculo instantáneo al teclear o cambiar selecciones
        document.querySelectorAll('input, select').forEach((el) => {
            el.addEventListener('input', () => this.sincronizar());
            el.addEventListener('change', () => this.sincronizar());
        });

        // 8. Paneles Colapsables (Evitar colapso si se pulsa el botón de ayuda o recarga)
        document.querySelectorAll('.panel-cabecera').forEach((cab) => {
            cab.addEventListener('click', (e) => {
                if (e.target.closest('#boton-actualizar-tasas') || e.target.closest('.boton-ayuda-info')) return;
                cab.closest('.panel-contenedor')?.classList.toggle('panel-colapsado');
            });
        });

        // 8. Inicialización segura al cargar el DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.sincronizar();
                this.actualizarTasasEnVivo();
            });
        } else {
            this.sincronizar();
            this.actualizarTasasEnVivo();
        }
    }

    async actualizarTasasEnVivo() {
        const btn = document.getElementById('boton-actualizar-tasas');
        const icono = document.getElementById('icono-recarga');
        const textoEstado = document.getElementById('texto-estado-tasas');
        const insignia = document.getElementById('insignia-estado-en-vivo');
        const ProveedorTasas = window.ProveedorTasasServicio || window.ProveedorTasasTiempoReal;
        const ManejadorEntrada = window.ManejadorFormatoEntrada;

        if (btn) btn.classList.add('cargando');
        if (icono) icono.textContent = '⏳';
        if (insignia) insignia.textContent = 'Consultando...';

        try {
            const tasas = await ProveedorTasas.consultarTasas();

            const inBcvDolar = document.getElementById('entrada-bcv-dolar');
            const inBcvEuro = document.getElementById('entrada-bcv-euro');
            const inBinCompra = document.getElementById('entrada-binance-compra');
            const inBinVenta = document.getElementById('entrada-binance-venta');
            const btnAplicar = document.getElementById('boton-aplicar-tasas');

            if (inBcvDolar && ManejadorEntrada) inBcvDolar.value = ManejadorEntrada.formatearMonto(tasas.dolarBcv);
            if (inBcvEuro && ManejadorEntrada) inBcvEuro.value = ManejadorEntrada.formatearMonto(tasas.euroBcv);
            if (inBinCompra && ManejadorEntrada) inBinCompra.value = ManejadorEntrada.formatearMonto(tasas.binanceCompra);
            if (inBinVenta && ManejadorEntrada) inBinVenta.value = ManejadorEntrada.formatearMonto(tasas.binanceVenta);

            if (textoEstado) {
                textoEstado.textContent = `Fecha Valor BCV: ${tasas.fechaValor} (${tasas.fuente})`;
            }

            if (btnAplicar && ManejadorEntrada) {
                btnAplicar.textContent = `⚡ Aplicar Tasas de Binance a mi Simulador (Compra @ ${ManejadorEntrada.formatearMonto(tasas.binanceCompra)} | Venta @ ${ManejadorEntrada.formatearMonto(tasas.binanceVenta)})`;
            }

            if (insignia) {
                insignia.textContent = tasas.exito ? 'En Vivo' : 'Caché';
                insignia.className = tasas.exito ? 'insignia-estado insignia-rentable' : 'insignia-estado insignia-alerta';
            }

            this.sincronizar();

        } catch (error) {
            console.error("Error al actualizar tasas en vivo:", error);
            if (insignia) {
                insignia.textContent = 'Offline';
                insignia.className = 'insignia-estado insignia-alerta';
            }
        } finally {
            if (btn) btn.classList.remove('cargando');
            if (icono) icono.textContent = '🔄';
        }
    }

    sincronizar() {
        try {
            const monedaCap = document.getElementById('entrada-moneda-capital')?.value || 'VES';
            const montoCap = this.#num('entrada-capital', 130000);
            const inflacion = this.#num('entrada-inflacion', 0.5);
            const tCompraUsd = this.#num('entrada-compra-usd', 995);
            const tVentaUsd = this.#num('entrada-venta-usd', 1015);
            const tCopBs = this.#num('entrada-tasa-calle-rubio', 0) || this.#num('entrada-compra-cop', 3.10);

            // Conversión de capital multimoneda a base bolívares para operaciones
            let capitalBs = montoCap;

            if (monedaCap === 'VES') {
                capitalBs = montoCap;
                const eqUsd = capitalBs / (tCompraUsd > 0 ? tCompraUsd : 995);
                const eqCop = Math.round(capitalBs * tCopBs);

                this.#txt('etiqueta-conv-1', 'Equivalente USD (Binance Compra):');
                const elSalida1 = document.getElementById('salida-cap-conv-1');
                if (elSalida1) {
                    elSalida1.innerHTML = `≈ ${this.#formateador.enDolaresFisicos(eqUsd)} <span class="conversion-tasa-tag" id="tasa-conv-1">(@ ${this.#formateador.enBolivares(tCompraUsd)}/USD)</span>`;
                }

                this.#txt('etiqueta-conv-2', 'Equivalente COP (Calle Rubio):');
                const elSalida2 = document.getElementById('salida-cap-conv-2');
                if (elSalida2) {
                    elSalida2.innerHTML = `≈ ${this.#formateador.enPesos(eqCop)} <span class="conversion-tasa-tag" id="tasa-conv-2">(@ ${this.#formateador.enTasaPesos(tCopBs)}/Bs)</span>`;
                }

                this.#txt('unidad-capital-sufijo', 'VES');
                this.#txt('salida-cap-equivalente', `≈ ${this.#formateador.enDolaresFisicos(eqUsd)} | ≈ ${this.#formateador.enPesos(eqCop)}`);
            } else if (monedaCap === 'COP') {
                capitalBs = tCopBs > 0 ? (montoCap / tCopBs) : 0;
                const eqUsd = capitalBs / (tCompraUsd > 0 ? tCompraUsd : 995);

                this.#txt('etiqueta-conv-1', 'Equivalente Bs (Calle Rubio):');
                const elSalida1 = document.getElementById('salida-cap-conv-1');
                if (elSalida1) {
                    elSalida1.innerHTML = `≈ ${this.#formateador.enBolivares(capitalBs)} <span class="conversion-tasa-tag" id="tasa-conv-1">(@ ${this.#formateador.enTasaPesos(tCopBs)}/Bs)</span>`;
                }

                this.#txt('etiqueta-conv-2', 'Equivalente USD (Binance Compra):');
                const elSalida2 = document.getElementById('salida-cap-conv-2');
                if (elSalida2) {
                    elSalida2.innerHTML = `≈ ${this.#formateador.enDolaresFisicos(eqUsd)} <span class="conversion-tasa-tag" id="tasa-conv-2">(@ ${this.#formateador.enBolivares(tCompraUsd)}/USD)</span>`;
                }

                this.#txt('unidad-capital-sufijo', 'COP');
                this.#txt('salida-cap-equivalente', `≈ ${this.#formateador.enBolivares(capitalBs)} | ≈ ${this.#formateador.enDolaresFisicos(eqUsd)}`);
            } else if (monedaCap === 'USD') {
                capitalBs = montoCap * tCompraUsd;
                const eqCop = Math.round(capitalBs * tCopBs);

                this.#txt('etiqueta-conv-1', 'Equivalente Bs (Binance Compra):');
                const elSalida1 = document.getElementById('salida-cap-conv-1');
                if (elSalida1) {
                    elSalida1.innerHTML = `≈ ${this.#formateador.enBolivares(capitalBs)} <span class="conversion-tasa-tag" id="tasa-conv-1">(@ ${this.#formateador.enBolivares(tCompraUsd)}/USD)</span>`;
                }

                this.#txt('etiqueta-conv-2', 'Equivalente COP (Calle Rubio):');
                const elSalida2 = document.getElementById('salida-cap-conv-2');
                if (elSalida2) {
                    elSalida2.innerHTML = `≈ ${this.#formateador.enPesos(eqCop)} <span class="conversion-tasa-tag" id="tasa-conv-2">(@ ${this.#formateador.enTasaPesos(tCopBs)}/Bs)</span>`;
                }

                this.#txt('unidad-capital-sufijo', 'USD');
                this.#txt('salida-cap-equivalente', `≈ ${this.#formateador.enBolivares(capitalBs)} | ≈ ${this.#formateador.enPesos(eqCop)}`);
            }

            const checkPagoMovil = Boolean(document.getElementById('checkbox-pago-movil')?.checked);
            const checkBinance = Boolean(document.getElementById('checkbox-retiro-binance')?.checked);

            // Deducciones porcentuales directas de los interruptores
            const comisionPMDecimal = checkPagoMovil ? 0.3 : 0.0;
            const comisionBinanceDecimal = checkBinance ? 0.3 : 0.0;
            const totalFriccionComisiones = comisionPMDecimal + comisionBinanceDecimal;

            // Reflejar la suma de comisiones activas en el campo de fricción
            const inputComisiones = document.getElementById('entrada-comisiones');
            if (inputComisiones && document.activeElement !== inputComisiones) {
                inputComisiones.value = totalFriccionComisiones.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            }

            const EntidadClase = window.ArbitrajeEntidad;
            const entidad = new EntidadClase({
                capitalInicialBs: capitalBs,
                comisionPagoMovilPorcentaje: comisionPMDecimal,
                comisionRetiroBinancePorcentaje: comisionBinanceDecimal,
                colchonInflacionPorcentaje: inflacion
            });

            // 1. Ruta USD Directa
            const resUsd = entidad.calcularRutaDolares({
                tasaCompraUsd: tCompraUsd,
                tasaVentaUsd: tVentaUsd,
                pagaConPagoMovilAlComprar: checkPagoMovil,
                usaRetiroBinance: checkBinance
            });

            // Actualización visual de insignias al lado de los switches
            const badgePM = document.getElementById('insignia-desc-pago-movil');
            if (badgePM) {
                badgePM.textContent = checkPagoMovil ? `Resta -${this.#formateador.enBolivares(resUsd.comisionPagoMovilBs)}` : '0,00 Bs (0% Exento)';
                badgePM.className = checkPagoMovil ? 'insignia-monto-comision texto-peligro' : 'insignia-monto-comision texto-exito';
            }

            const badgeBin = document.getElementById('insignia-desc-binance');
            if (badgeBin) {
                badgeBin.textContent = checkBinance ? `Resta -${this.#formateador.enBolivares(resUsd.comisionRetiroBinanceBs)}` : '0,00 Bs (0% Exento)';
                badgeBin.className = checkBinance ? 'insignia-monto-comision texto-peligro' : 'insignia-monto-comision texto-exito';
            }

            // Actualización del Desglose Paso a Paso con deducciones en vivo
            this.#txt('paso-capital-bruto', this.#formateador.enBolivares(capitalBs));
            
            const elPasoPM = document.getElementById('paso-deduccion-pago-movil');
            if (elPasoPM) {
                if (checkPagoMovil) {
                    elPasoPM.textContent = `-${this.#formateador.enBolivares(resUsd.comisionPagoMovilBs)}`;
                    elPasoPM.className = 'paso-fila-valor paso-resta';
                } else {
                    elPasoPM.textContent = '0,00 Bs (0% Exento)';
                    elPasoPM.className = 'paso-fila-valor paso-exento';
                }
            }

            this.#txt('paso-capital-neto-compra', this.#formateador.enBolivares(resUsd.montoTransferibleBs));
            this.#txt('paso-dolares-comprados', this.#formateador.enDolaresFisicos(resUsd.dolaresCompradosInicio));
            this.#txt('paso-venta-bruta-binance', this.#formateador.enBolivares(resUsd.ventaBrutaBs));

            const elPasoBin = document.getElementById('paso-deduccion-binance');
            if (elPasoBin) {
                if (checkBinance) {
                    elPasoBin.textContent = `-${this.#formateador.enBolivares(resUsd.comisionRetiroBinanceBs)}`;
                    elPasoBin.className = 'paso-fila-valor paso-resta';
                } else {
                    elPasoBin.textContent = '0,00 Bs (0% Exento)';
                    elPasoBin.className = 'paso-fila-valor paso-exento';
                }
            }

            this.#txt('paso-bolivares-netos-cuenta', this.#formateador.enBolivares(resUsd.bolivaresNetosFinales));

            // Actualización de resultados generales
            this.#txt('salida-linea-roja-usd', this.#formateador.enBolivares(resUsd.tasaLineaRojaBs));
            this.#txt('salida-dolares-inicio', this.#formateador.enDolaresFisicos(resUsd.dolaresCompradosInicio));
            this.#txt('salida-bolivares-finales', this.#formateador.enBolivares(resUsd.bolivaresNetosFinales));
            this.#txt('salida-comisiones-totales', this.#formateador.enBolivares(resUsd.comisionesTotalesBs));
            this.#txt('salida-ganancia-bs', this.#formateador.enBolivaresConSigno(resUsd.gananciaNetaBs));
            this.#txt('salida-ganancia-usd', this.#formateador.enDolaresConSigno(resUsd.gananciaNetaUsd));
            this.#txt('salida-dolares-cliente', this.#formateador.enDolaresFisicos(resUsd.dolaresRecibeTuCliente));

            this.#txt('salida-resumen-linea-roja', this.#formateador.enBolivares(resUsd.tasaLineaRojaBs));
            this.#txt('salida-resumen-ganancia', this.#formateador.enDolaresConSigno(resUsd.gananciaNetaUsd));

            // 2. Ruta COP
            const resCop = entidad.calcularRutaPesos({
                tasaTuCompraBsEnCop: this.#num('entrada-compra-cop', 3.10),
                tasaTuVentaBsEnCop: this.#num('entrada-venta-cop', 3.25)
            });

            this.#txt('salida-linea-roja-cop', this.#formateador.enTasaPesos(resCop.tasaLineaRojaCop));
            this.#txt('salida-pesos-cobrados', this.#formateador.enPesos(resCop.pesosCobradosCliente));
            this.#txt('salida-pesos-reposicion', this.#formateador.enPesos(resCop.pesosPagadosReposicion));
            this.#txt('salida-ganancia-cop', this.#formateador.enPesosConSigno(resCop.gananciaNetaCop));
            this.#txt('salida-ganancia-bs-cop', this.#formateador.enBolivaresConSigno(resCop.gananciaEquivalenteBs));

            // 3. Denver
            const resDenver = entidad.analizarTrianguloCompetencia({
                compraBsEnCop: this.#num('entrada-denver-compra-cop', 3.0),
                ventaBsMayorCop: this.#num('entrada-denver-venta-cop-mayor', 3.3),
                tasaDolarCartelBs: this.#num('entrada-denver-dolar', 1010)
            });

            this.#txt('salida-denver-pesos-intermedios', this.#formateador.enPesos(resDenver.pesosIntermediosRecibidos));
            this.#txt('salida-denver-tasa-aplicada', `${resDenver.tasaEscalonadaAplicadaCop.toFixed(2)} COP`);
            this.#txt('salida-denver-dolar-implicito', this.#formateador.enPesos(resDenver.tasaDolarImplicitaCop));
            this.#txt('salida-denver-dolares-reales', this.#formateador.enDolaresFisicos(resDenver.dolaresRecibidosEnCompetencia));
            this.#txt('salida-denver-tasa-real', `${this.#formateador.enBolivares(resDenver.tasaRealPagadaBsPorUsd)}/$`);
            this.#txt('salida-denver-dolares-perdidos', `-${this.#formateador.enDolaresFisicos(resDenver.dolaresPerdidosEnTriangulo)}`);

            // 4. Tasación de Billetes Físicos
            const tabla = document.getElementById('tabla-cuerpo-billetes');
            if (tabla) {
                const politicas = this.#evaluadorBilletes.generarTablaReferencia(tCompraUsd);
                tabla.innerHTML = '';
                politicas.forEach((p) => {
                    const tr = document.createElement('tr');
                    if (!p.esAceptable) tr.classList.add('fila-rechazada');

                    const tdCat = document.createElement('td');
                    tdCat.textContent = p.descripcion;

                    const tdTasa = document.createElement('td');
                    tdTasa.className = 'tasa-castigada';
                    tdTasa.textContent = p.esAceptable ? this.#formateador.enBolivares(p.tasaMaximaBs) : 'RECHAZAR';

                    const tdEstado = document.createElement('td');
                    tdEstado.textContent = p.esAceptable ? `-${p.porcentajeCastigo}%` : 'NO RECIBIR';
                    tdEstado.className = p.esAceptable ? 'texto-advertencia' : 'texto-peligro';

                    tr.appendChild(tdCat);
                    tr.appendChild(tdTasa);
                    tr.appendChild(tdEstado);
                    tabla.appendChild(tr);
                });
            }

            // 5. Cruce Universal de Divisas 4x4
            this.#sincronizarCruceUniversal(entidad, tCompraUsd);

        } catch (e) {
            console.error("Error al sincronizar cálculo financiero:", e);
        }
    }

    #sincronizarCruceUniversal(entidad, tCompraUsd) {
        const origen = document.getElementById('cruce-moneda-origen')?.value || 'USD_FISICO';
        const destino = document.getElementById('cruce-moneda-destino')?.value || 'COP';
        const monto = this.#num('cruce-monto-origen', 100);
        const condicion = document.getElementById('cruce-condicion-billete')?.value || 'PREMIUM';

        const factores = { 'PREMIUM': 1.0, 'MEDIANO': 0.975, 'SENCILLO': 0.945, 'DETERIORADO': 0 };
        const esAceptable = condicion !== 'DETERIORADO';
        const factor = factores[condicion] || 1.0;

        const res = entidad.calcularCruceUniversal({
            monedaOrigen: origen,
            monedaDestino: destino,
            montoOrigen: monto,
            factorCastigoBillete: factor,
            esBilleteAceptable: esAceptable,
            tasas: {
                tasaDolarBs: tCompraUsd,
                tasaCopBs: this.#num('entrada-compra-cop', 3.10)
            }
        });

        if (!res.esOperacionValida) {
            this.#txt('salida-cruce-entregar', 'RECHAZADO');
            this.#txt('salida-cruce-denver', 'RECHAZADO');
            this.#txt('salida-cruce-ventaja', res.motivoRechazo);
            return;
        }

        this.#txt('salida-cruce-entregar', this.#formateador.formatearSegunDivisa(res.montoEntregarCliente, destino));
        this.#txt('salida-cruce-denver', this.#formateador.formatearSegunDivisa(res.montoCompetenciaDenver, destino));
        this.#txt('salida-cruce-ventaja', `+${this.#formateador.formatearSegunDivisa(res.ventajaCliente, destino)}`);
        this.#txt('salida-cruce-ganancia', `+${this.#formateador.formatearSegunDivisa(res.gananciaNetaEsperada, origen)}`);
    }

    #num(id, def) {
        const el = document.getElementById(id);
        if (!el) return def;
        const ManejadorEntrada = window.ManejadorFormatoEntrada;
        return ManejadorEntrada ? ManejadorEntrada.parsearNumero(el.value, def) : parseFloat(el.value) || def;
    }

    #txt(id, txt) {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    }
}

// Soporte Dual: Node.js (Tests) y Navegador (file:/// / PWA)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArbitrajeControlador };
} else {
    window.ArbitrajeControlador = ArbitrajeControlador;
    // Autoarranque seguro si estamos en el navegador
    if (typeof window !== 'undefined' && !window.__ARBITRAJE_APP_INICIALIZADA__) {
        window.__ARBITRAJE_APP_INICIALIZADA__ = true;
        new ArbitrajeControlador();
    }
}