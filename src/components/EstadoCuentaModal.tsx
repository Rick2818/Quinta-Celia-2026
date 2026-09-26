import React, { useState } from 'react';
import { ClienteComprador, PagoRealizado } from '../types';
import { formatMoneda, formatFecha } from '../utils/calculos';
import { QuintaCeliaLogo } from './BrandAssets';

interface EstadoCuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteComprador;
  monedaSimbolo?: string;
}

export const EstadoCuentaModal: React.FC<EstadoCuentaModalProps> = ({
  isOpen,
  onClose,
  cliente,
  monedaSimbolo = '$'
}) => {
  if (!isOpen || !cliente) return null;

  const [copiado, setCopiado] = useState(false);
  const [telefonoDestino, setTelefonoDestino] = useState(cliente.telefono || '');

  // Cálculos dinámicos del crédito y pagos
  const amortizacion = cliente.amortizacion || [];
  const cuotasPagadas = amortizacion.filter(c => c.estado === 'pagado').length;
  const totalCuotas = amortizacion.length || cliente.plazoMeses || 120;
  const cuotasPendientes = Math.max(0, totalCuotas - cuotasPagadas);
  
  // Plazo en años
  const plazoAnos = cliente.plazoMeses ? (cliente.plazoMeses / 12) : 10;
  const plazoTexto = Number.isInteger(plazoAnos) 
    ? `${plazoAnos} Años (${totalCuotas} Meses)` 
    : `${plazoAnos.toFixed(1)} Años (${totalCuotas} Meses)`;

  // Total pagado acumulado (Enganche + cuotas pagadas)
  const totalAbonadoCuotas = amortizacion
    .filter(c => c.estado === 'pagado')
    .reduce((acc, curr) => acc + (curr.cuota || 0), 0);
  
  const totalPagadoAcumulado = (cliente.enganche || 0) + totalAbonadoCuotas;

  // Saldo a la fecha: Tomar el saldo final de la última cuota pagada, o montoFinanciado si ninguna está pagada
  let saldoALaFecha = cliente.montoFinanciado;
  const ultimaCuotaPagada = [...amortizacion].reverse().find(c => c.estado === 'pagado');
  if (ultimaCuotaPagada) {
    saldoALaFecha = ultimaCuotaPagada.saldoFinal;
  }
  if (cuotasPagadas >= totalCuotas && totalCuotas > 0) {
    saldoALaFecha = 0;
  }

  // Porcentaje completado
  const porcentajePagado = totalCuotas > 0 ? Math.round((cuotasPagadas / totalCuotas) * 100) : 0;

  // Próxima cuota a vencer
  const proximaCuota = amortizacion.find(c => c.estado === 'pendiente' || c.estado === 'vencido');

  // Estado del crédito
  const esLiquidado = saldoALaFecha <= 0 || (cuotasPagadas >= totalCuotas && totalCuotas > 0) || cliente.estado === 'liquidado';
  const esMora = !esLiquidado && (cliente.estado === 'en_mora' || amortizacion.some(a => a.estado === 'vencido'));

  // Mensaje para WhatsApp
  const mensajeWhatsApp = `📋 *ESTADO DE CUENTA OFICIAL - FINCA CELIA*
*Titular:* ${cliente.nombre}
*DUI:* ${cliente.cedula || 'Registrado'}
*Inmueble:* ${cliente.loteNombre} (Lote #${cliente.loteNumero})
*Área:* ${cliente.medidas.areaM2} m² (${cliente.medidas.varasCuadradas} v²)

📌 *CONDICIONES DEL CRÉDITO:*
• *Precio Total:* ${formatMoneda(cliente.precioTotal)}
• *Prima / Enganche Pagado:* ${formatMoneda(cliente.enganche)} (${cliente.enganchePorcentaje || 20}%)
• *Crédito Pactado:* ${formatMoneda(cliente.montoFinanciado)}
• *Plazo Pactado:* ${plazoTexto}
• *Cuota Mensual Fija:* ${formatMoneda(cliente.cuotaMensual)}

📊 *RESUMEN DE PAGOS A LA FECHA:*
• *Pagos Realizados:* ${cuotasPagadas} de ${totalCuotas} cuotas (${porcentajePagado}%)
• *Cuotas Pendientes:* ${cuotasPendientes} meses
• *Total Pagado a la Fecha:* ${formatMoneda(totalPagadoAcumulado)}
• *SALDO ACTUAL A LA FECHA:* ${formatMoneda(saldoALaFecha)}
• *Estado Actual:* ${esLiquidado ? '✅ LIQUIDADO TOTALMENTE' : esMora ? '⚠️ CUOTA EN MORA' : '✅ AL DÍA'}

_Módulo Administrativo Finca Celia - Terrenos de Ricardo_`;

  const handleCopiarResumen = () => {
    navigator.clipboard.writeText(mensajeWhatsApp);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleCompartirWhatsApp = (telCustom?: string) => {
    let rawTel = (telCustom !== undefined ? telCustom : telefonoDestino).replace(/[^0-9]/g, '');
    // Si tiene 8 dígitos (ej: 75743444), anteponer 503 (El Salvador)
    if (rawTel.length === 8) {
      rawTel = `503${rawTel}`;
    }
    const url = rawTel 
      ? `https://wa.me/${rawTel}?text=${encodeURIComponent(mensajeWhatsApp)}`
      : `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp)}`;
    window.open(url, '_blank');
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Header no imprimible */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-500/10">
              📄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-extrabold text-white">
                  Estado de Cuenta Oficial
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  esLiquidado
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-600'
                    : esMora
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-600'
                    : 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'
                }`}>
                  {esLiquidado ? 'Liquidado' : esMora ? 'En Mora' : 'Al Día'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Condiciones pactadas, pagos realizados y saldo a la fecha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImprimir}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
              title="Imprimir o guardar en PDF"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              onClick={handleCompartirWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
              title="Enviar resumen directo al WhatsApp del cliente"
            >
              <span>📲</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenedor con Scroll & Imprimible */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 print:p-0 print:overflow-visible print:bg-white print:text-black">
          
          {/* Documento Membretado */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 print:bg-white print:border-none print:p-0 print:text-black">
            
            {/* Membrete Oficial */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-800 print:border-slate-300 gap-4">
              <div className="flex items-center gap-3.5">
                <QuintaCeliaLogo className="w-12 h-12 rounded-xl shadow-md" />
                <div>
                  <h1 className="text-lg font-display font-extrabold text-white print:text-slate-900 tracking-tight">
                    FINCA CELIA • TERRENOS DE RICARDO
                  </h1>
                  <p className="text-xs text-emerald-400 print:text-emerald-700 font-medium">
                    Módulo de Administración Hipotecaria y Cartera de Terrenos
                  </p>
                  <p className="text-[11px] text-slate-400 print:text-slate-600">
                    Línea Oficial / WhatsApp: +503 7574-3444 • El Salvador
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5">
                <div className="font-mono text-white print:text-slate-900 font-bold">
                  ESTADO DE CUENTA
                </div>
                <div>Fecha de Emisión: <strong className="text-slate-200 print:text-slate-900">{new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div>Expediente ID: <span className="font-mono text-slate-300 print:text-slate-700">{cliente.id.substring(0, 14)}</span></div>
              </div>
            </div>

            {/* Ficha del Cliente e Inmueble */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/90 print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-200 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-800 block">
                  Información del Titular
                </span>
                <div className="text-sm font-bold text-white print:text-slate-900">
                  {cliente.nombre}
                </div>
                <div className="text-slate-300 print:text-slate-700">
                  <span className="text-slate-400 print:text-slate-500">DUI / Cédula:</span> <strong className="font-mono text-white print:text-slate-900">{cliente.cedula || 'Pendiente de registrar'}</strong>
                </div>
                <div className="text-slate-300 print:text-slate-700">
                  <span className="text-slate-400 print:text-slate-500">Teléfono:</span> {cliente.telefono || 'Sin teléfono'}
                </div>
                <div className="text-slate-300 print:text-slate-700 truncate">
                  <span className="text-slate-400 print:text-slate-500">Correo:</span> {cliente.email || 'Sin correo registrado'}
                </div>
              </div>

              <div className="bg-slate-900/90 print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-200 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 print:text-amber-800 block">
                  Detalles del Inmueble
                </span>
                <div className="text-sm font-bold text-white print:text-slate-900">
                  {cliente.loteNombre} (Lote #{cliente.loteNumero})
                </div>
                <div className="text-slate-300 print:text-slate-700">
                  <span className="text-slate-400 print:text-slate-500">Superficie:</span> <strong className="font-mono text-emerald-400 print:text-emerald-700">{cliente.medidas.areaM2.toLocaleString()} m²</strong> ({cliente.medidas.varasCuadradas.toLocaleString()} v²)
                </div>
                <div className="text-slate-300 print:text-slate-700 font-mono text-[11px]">
                  <span className="text-slate-400 print:text-slate-500">Linderos:</span> x1={cliente.medidas.x1}m | x2={cliente.medidas.x2}m | y1={cliente.medidas.y1}m
                </div>
                <div className="text-slate-300 print:text-slate-700">
                  <span className="text-slate-400 print:text-slate-500">Ubicación:</span> {cliente.direccion || 'Quinta Celia, Coatepeque'}
                </div>
              </div>
            </div>

            {/* Condiciones del Crédito Pactado (Sin tasa de interés) */}
            <div className="bg-slate-900/90 print:bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-800 print:border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 print:text-sky-800 flex items-center gap-1.5">
                  <span>📑</span> Condiciones del Crédito Pactado
                </h4>
                <span className="text-[11px] text-slate-400 print:text-slate-600 font-sans">
                  Fecha Otorgamiento: {formatFecha(cliente.fechaInicio || cliente.creadoEn)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="bg-slate-950/70 print:bg-white p-3 rounded-xl border border-slate-800/80 print:border-slate-200">
                  <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase block">Precio Total</span>
                  <strong className="text-sm font-mono font-bold text-white print:text-slate-900">
                    {formatMoneda(cliente.precioTotal)}
                  </strong>
                </div>

                <div className="bg-slate-950/70 print:bg-white p-3 rounded-xl border border-slate-800/80 print:border-slate-200">
                  <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase block">Prima / Enganche</span>
                  <strong className="text-sm font-mono font-bold text-emerald-400 print:text-emerald-700">
                    {formatMoneda(cliente.enganche)}
                  </strong>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    ({cliente.enganchePorcentaje || Math.round(((cliente.enganche || 0) / (cliente.precioTotal || 1)) * 100)}% pagado)
                  </span>
                </div>

                <div className="bg-slate-950/70 print:bg-white p-3 rounded-xl border border-slate-800/80 print:border-slate-200">
                  <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase block">Plazo Pactado</span>
                  <strong className="text-sm font-mono font-bold text-amber-300 print:text-amber-800">
                    {plazoTexto}
                  </strong>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {totalCuotas} mensualidades
                  </span>
                </div>

                <div className="bg-slate-950/70 print:bg-white p-3 rounded-xl border border-slate-800/80 print:border-slate-200">
                  <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase block">Cuota Mensual</span>
                  <strong className="text-sm font-mono font-bold text-sky-400 print:text-sky-700">
                    {formatMoneda(cliente.cuotaMensual)}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">Cuota mensual fija</span>
                </div>
              </div>
            </div>

            {/* Panel Interactivo de Envío por WhatsApp (Oculto en Impresión) */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-3 print:hidden shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📲</span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300 font-display">
                      Enviar Estado de Cuenta Directo a WhatsApp
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Despacha el resumen oficial con cuotas pagadas y saldo restante al número del cliente
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-mono">📱</span>
                  <input
                    type="text"
                    value={telefonoDestino}
                    onChange={(e) => setTelefonoDestino(e.target.value)}
                    placeholder="Número de WhatsApp (ej. 7574-3444 o +503...)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  onClick={() => handleCompartirWhatsApp()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  <span>💬</span>
                  <span>Enviar por WhatsApp Ahora</span>
                </button>

                <button
                  onClick={handleCopiarResumen}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  title="Copiar texto del Estado de Cuenta"
                >
                  <span>{copiado ? '✓ Copiado' : '📋 Copiar Mensaje'}</span>
                </button>
              </div>
            </div>

            {/* Resumen de Pagos Realizados y Saldo a la Fecha */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 print:from-emerald-50 print:to-slate-50 p-5 rounded-2xl border-2 border-emerald-500/30 print:border-emerald-600 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 print:text-emerald-800 font-bold block">
                    Resumen Financiero a la Fecha
                  </span>
                  <h3 className="text-base font-display font-extrabold text-white print:text-slate-900">
                    Estado de Pagos y Saldo Restante
                  </h3>
                </div>
                
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-slate-400 print:text-slate-600">Progreso del Contrato:</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 print:text-emerald-700">
                    {cuotasPagadas} de {totalCuotas} Cuotas Pagadas ({porcentajePagado}%)
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-slate-950 print:bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-800 print:border-slate-300">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${porcentajePagado}%` }}
                ></div>
              </div>

              {/* Métricas clave */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950/80 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase font-bold block">
                    Total Pagado a la Fecha
                  </span>
                  <div className="text-lg font-mono font-extrabold text-white print:text-slate-900 mt-0.5">
                    {formatMoneda(totalPagadoAcumulado)}
                  </div>
                  <span className="text-[10px] text-emerald-400 print:text-emerald-700 block">
                    Prima ({formatMoneda(cliente.enganche)}) + {cuotasPagadas} cuotas
                  </span>
                </div>

                <div className="bg-slate-950/80 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 print:text-slate-500 uppercase font-bold block">
                    Cuotas Pendientes
                  </span>
                  <div className="text-lg font-mono font-extrabold text-amber-300 print:text-amber-800 mt-0.5">
                    {cuotasPendientes} Meses
                  </div>
                  <span className="text-[10px] text-slate-400 print:text-slate-600 block">
                    {proximaCuota ? `Próximo vto: ${formatFecha(proximaCuota.fechaVencimiento)}` : 'Contrato completado'}
                  </span>
                </div>

                <div className="bg-emerald-950/40 print:bg-emerald-100/60 p-3.5 rounded-xl border border-emerald-500/50 print:border-emerald-600">
                  <span className="text-[10px] text-emerald-400 print:text-emerald-900 uppercase font-extrabold block tracking-wider">
                    SALDO A LA FECHA
                  </span>
                  <div className="text-xl font-mono font-black text-emerald-300 print:text-emerald-900 mt-0.5">
                    {formatMoneda(saldoALaFecha)}
                  </div>
                  <span className="text-[10px] text-emerald-400/90 print:text-emerald-800 font-semibold block">
                    {esLiquidado ? '¡Crédito 100% Cancelado!' : 'Saldo pendiente de amortizar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Historial de Pagos Realizados */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 flex items-center gap-1.5">
                <span>🗓️</span> Historial de Pagos Realizados ({cuotasPagadas})
              </h4>

              {cuotasPagadas === 0 ? (
                <div className="bg-slate-900/60 print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-200 text-center text-xs text-slate-400 print:text-slate-600">
                  No se registran pagos de cuotas mensuales aún. El cliente cuenta con la Prima inicial de {formatMoneda(cliente.enganche)}.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-xl">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono text-[10px] uppercase border-b border-slate-800 print:border-slate-300">
                      <tr>
                        <th className="p-2.5">Mes #</th>
                        <th className="p-2.5">Fecha Pago</th>
                        <th className="p-2.5">Recibo N°</th>
                        <th className="p-2.5 text-right">Monto Cuota</th>
                        <th className="p-2.5 text-right">Saldo Restante</th>
                        <th className="p-2.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 text-slate-300 print:text-slate-800">
                      {amortizacion
                        .filter(item => item.estado === 'pagado')
                        .map((item) => (
                          <tr key={item.mes} className="hover:bg-slate-900/40 print:hover:bg-transparent font-mono text-[11px]">
                            <td className="p-2.5 font-bold text-white print:text-slate-900">
                              Mes #{item.mes}
                            </td>
                            <td className="p-2.5 text-slate-300 print:text-slate-700">
                              {item.fechaPago ? formatFecha(item.fechaPago) : formatFecha(item.fechaVencimiento)}
                            </td>
                            <td className="p-2.5 text-emerald-400 print:text-emerald-700 font-bold">
                              {item.reciboId || `REC-${item.mes.toString().padStart(3, '0')}`}
                            </td>
                            <td className="p-2.5 text-right font-bold text-white print:text-slate-900">
                              {formatMoneda(item.cuota)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-amber-300 print:text-amber-800">
                              {formatMoneda(item.saldoFinal)}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 print:text-emerald-800 print:bg-emerald-100 border border-emerald-500/30">
                                PAGADO
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pie de Firma y Nota Legal */}
            <div className="pt-4 border-t border-slate-800 print:border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-400 print:text-slate-600">
              <div>
                <p className="font-semibold text-slate-300 print:text-slate-800">Nota Administrativa:</p>
                <p className="text-[11px] leading-relaxed mt-0.5">
                  Este estado de cuenta refleja los registros oficiales del contrato hipotecario de Finca Celia Terrenos de Ricardo. Los abonos son aplicados de conformidad con el acuerdo pactado.
                </p>
              </div>

              <div className="text-center sm:text-right pt-6 sm:pt-0">
                <div className="inline-block border-t border-slate-700 print:border-slate-400 pt-1.5 px-6">
                  <p className="font-bold text-slate-200 print:text-slate-900">Administración Finca Celia</p>
                  <p className="text-[10px] text-slate-500 print:text-slate-600 font-mono">Control de Terrenos de Ricardo</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer no imprimible */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden text-xs">
          <button
            onClick={handleCopiarResumen}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>{copiado ? '✓ Copiado' : '📋 Copiar Resumen'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompartirWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
            >
              <span>📲 Enviar a WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
