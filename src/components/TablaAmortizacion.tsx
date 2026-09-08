import React, { useState } from 'react';
import { ClienteComprador, AmortizacionItem, PagoRealizado } from '../types';
import { formatMoneda, formatFecha, exportarAmortizacionClienteCSV } from '../utils/calculos';

interface TablaAmortizacionProps {
  cliente: ClienteComprador;
  onRegistrarPagoClick: (mes?: number) => void;
  onVerReciboClick: (pago: PagoRealizado) => void;
  monedaSimbolo?: string;
}

export const TablaAmortizacion: React.FC<TablaAmortizacionProps> = ({
  cliente,
  onRegistrarPagoClick,
  onVerReciboClick,
  monedaSimbolo = '$'
}) => {
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'pagados'>('todos');
  const [busquedaMes, setBusquedaMes] = useState('');

  const cuotas = cliente.amortizacion || [];
  
  // Métricas
  const totalCuotas = cuotas.length;
  const cuotasPagadas = cuotas.filter(c => c.estado === 'pagado');
  const numPagadas = cuotasPagadas.length;
  
  const totalCapitalPagado = cuotasPagadas.reduce((acc, c) => acc + c.capital, 0);
  const totalInteresPagado = cuotasPagadas.reduce((acc, c) => acc + c.interes, 0);
  const totalAbonado = totalCapitalPagado + totalInteresPagado;

  const saldoPendienteActual = cuotasPagadas.length > 0 
    ? cuotasPagadas[cuotasPagadas.length - 1].saldoFinal 
    : cliente.montoFinanciado;

  const porcentajeAvance = cliente.montoFinanciado > 0 
    ? Math.min(100, Math.round((totalCapitalPagado / cliente.montoFinanciado) * 100))
    : 0;

  // Filtrado de cuotas
  const cuotasFiltradas = cuotas.filter(item => {
    if (filtro === 'pendientes' && item.estado !== 'pendiente' && item.estado !== 'vencido') return false;
    if (filtro === 'pagados' && item.estado !== 'pagado') return false;
    if (busquedaMes && !item.mes.toString().includes(busquedaMes)) return false;
    return true;
  });

  // Encontrar el siguiente mes a pagar
  const siguienteMesPendiente = cuotas.find(c => c.estado !== 'pagado');

  // Exportar a CSV mejorado
  const handleExportarCSV = () => {
    exportarAmortizacionClienteCSV(cliente, monedaSimbolo);
  };


  return (
    <div className="space-y-6">
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Cuota Mensual */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Cuota Mensual Fija
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400">
            {formatMoneda(cliente.cuotaMensual)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Tasa {cliente.tasaInteresAnual}% anual fija
          </span>
        </div>

        {/* Saldo Pendiente Insoluto */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Saldo Insoluto Actual
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-white">
            {formatMoneda(saldoPendienteActual)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            De {formatMoneda(cliente.montoFinanciado)} financiados
          </span>
        </div>

        {/* Total Abonado a Capital */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Abonado a Capital
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-sky-400">
            {formatMoneda(totalCapitalPagado)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            + {formatMoneda(totalInteresPagado)} en intereses
          </span>
        </div>

        {/* Estado y Progreso */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Avance de Crédito
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {numPagadas}/{totalCuotas} ({porcentajeAvance}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeAvance}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 flex justify-between">
            <span>Restantes: <strong className="text-slate-200">{totalCuotas - numPagadas} cuotas</strong></span>
            <span className={`font-semibold ${cliente.estado === 'liquidado' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {cliente.estado === 'liquidado' ? 'LIQUIDADO' : 'ACTIVO'}
            </span>
          </div>
        </div>

      </div>

      {/* Action Banner for Next Payment */}
      {siguienteMesPendiente && (
        <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Cuota Próxima a Vencer / Mes en Curso
            </div>
            <h4 className="text-white font-display font-bold text-base">
              Mes #{siguienteMesPendiente.mes} — Vencimiento: {formatFecha(siguienteMesPendiente.fechaVencimiento)}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Monto Cuota: <strong className="text-emerald-400 font-mono">{formatMoneda(siguienteMesPendiente.cuota)}</strong> (Capital: {formatMoneda(siguienteMesPendiente.capital)} | Interés: {formatMoneda(siguienteMesPendiente.interes)})
            </p>
          </div>

          <button
            onClick={() => onRegistrarPagoClick(siguienteMesPendiente.mes)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Registrar Pago del Mes en Curso
          </button>
        </div>
      )}

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        
        {/* Filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filtro === 'todos' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Todas ({cuotas.length})
          </button>
          <button
            onClick={() => setFiltro('pendientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filtro === 'pendientes' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Pendientes ({cuotas.length - numPagadas})
          </button>
          <button
            onClick={() => setFiltro('pagados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filtro === 'pagados' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Pagadas ({numPagadas})
          </button>
        </div>

        {/* Search and Export */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por Mes #..."
            value={busquedaMes}
            onChange={(e) => setBusquedaMes(e.target.value)}
            className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />

          <button
            onClick={handleExportarCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Descargar tabla en formato Excel/CSV"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
        </div>

      </div>

      {/* Amortization Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3 text-center">Mes</th>
              <th className="py-3 px-3">Vencimiento</th>
              <th className="py-3 px-3 text-right">Saldo Inicial</th>
              <th className="py-3 px-3 text-right">Cuota Mensual</th>
              <th className="py-3 px-3 text-right text-emerald-400">A Capital</th>
              <th className="py-3 px-3 text-right text-amber-400">A Interés</th>
              <th className="py-3 px-3 text-right">Saldo Final</th>
              <th className="py-3 px-3 text-center">Estado</th>
              <th className="py-3 px-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
            {cuotasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                  No se encontraron cuotas con el filtro seleccionado.
                </td>
              </tr>
            ) : (
              cuotasFiltradas.map((item) => {
                const pagoRegistrado = cliente.pagos?.find(p => p.mesNumero === item.mes);
                const esPagado = item.estado === 'pagado';

                return (
                  <tr 
                    key={item.mes}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      esPagado ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-white">
                      #{item.mes}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">
                      {formatFecha(item.fechaVencimiento)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {formatMoneda(item.saldoInicial)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">
                      {formatMoneda(item.cuota)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {formatMoneda(item.capital)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      {formatMoneda(item.interes)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                      {formatMoneda(item.saldoFinal)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {esPagado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                          <span>✓ PAGADO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/50">
                          <span>PENDIENTE</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {esPagado ? (
                        <button
                          onClick={() => {
                            if (pagoRegistrado) {
                              onVerReciboClick(pagoRegistrado);
                            } else {
                              // Generar representación de pago si no está en historial
                              const pMock: PagoRealizado = {
                                id: `p-${item.mes}`,
                                reciboNumero: item.reciboId || `QC-REC-2026-000${item.mes}`,
                                clienteId: cliente.id,
                                clienteNombre: cliente.nombre,
                                clienteEmail: cliente.email,
                                clienteTelefono: cliente.telefono,
                                mesNumero: item.mes,
                                montoTotal: item.cuota,
                                abonoCapital: item.capital,
                                abonoInteres: item.interes,
                                saldoRestante: item.saldoFinal,
                                fechaPago: item.fechaPago || new Date().toISOString(),
                                metodo: (item.metodoPago as any) || 'transferencia',
                                referencia: `PAGO-CUOTA-${item.mes}`,
                                enviadoPorEmail: false,
                                emailDestino: cliente.email,
                                loteNombre: cliente.loteNombre,
                                medidasTexto: `x1=${cliente.medidas.x1}m | x2=${cliente.medidas.x2}m | y1=${cliente.medidas.y1}m`
                              };
                              onVerReciboClick(pMock);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 text-[11px] font-semibold border border-emerald-700/40 cursor-pointer transition-colors"
                        >
                          Ver Recibo
                        </button>
                      ) : (
                        <button
                          onClick={() => onRegistrarPagoClick(item.mes)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
                        >
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
