import React, { useState, useMemo, useEffect } from 'react';
import { ClienteComprador, PagoRealizado } from '../types';
import { formatMoneda } from '../utils/calculos';

interface DashboardReportesProps {
  clientes: ClienteComprador[];
  monedaSimbolo?: string;
  onVerCliente?: (clienteId: string) => void;
  onVerRecibo?: (pago: PagoRealizado, cliente: ClienteComprador) => void;
  onRegistrarPago?: (cliente: ClienteComprador) => void;
}

const MESES = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' }
];

export const DashboardReportes: React.FC<DashboardReportesProps> = ({
  clientes,
  monedaSimbolo = '$',
  onVerCliente,
  onVerRecibo,
  onRegistrarPago
}) => {
  const fechaHoy = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(fechaHoy.getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(fechaHoy.getFullYear());
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'al_dia' | 'en_mora' | 'liquidado'>('todos');
  const [tabActiva, setTabActiva] = useState<'kpis' | 'pagos_mes' | 'morosos' | 'liquidados' | 'vencimientos'>('kpis');
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState<'todos' | 'al_dia' | 'en_mora' | 'liquidado' | null>(null);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalEstadoAbierto) {
        setModalEstadoAbierto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalEstadoAbierto]);

  const handleSeleccionarEstado = (estado: 'todos' | 'al_dia' | 'en_mora' | 'liquidado') => {
    setModalEstadoAbierto(estado);
    setFiltroEstado(estado);
    if (estado === 'en_mora') {
      setTabActiva('morosos');
    } else if (estado === 'liquidado') {
      setTabActiva('liquidados');
    } else {
      setTabActiva('kpis');
    }
  };

  const handleVerEnTabla = () => {
    setModalEstadoAbierto(null);
    setTimeout(() => {
      document.getElementById('seccion-detalle-cartera')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Años disponibles basados en inicio de lotificación
  const aniosDisponibles = [2025, 2026, 2027, 2028];

  // 1. Clasificación oficial de clientes
  const metricasClientes = useMemo(() => {
    const liquidados = clientes.filter(c => {
      if (c.estado === 'liquidado') return true;
      const pendientes = (c.amortizacion || []).filter(a => a.estado !== 'pagado');
      return pendientes.length === 0 && (c.amortizacion || []).length > 0;
    });

    const enMora = clientes.filter(c => {
      if (liquidados.some(l => l.id === c.id)) return false;
      if (c.estado === 'en_mora') return true;
      return (c.amortizacion || []).some(a => a.estado === 'vencido');
    });

    const alDia = clientes.filter(c => {
      const esLiq = liquidados.some(l => l.id === c.id);
      const esMora = enMora.some(m => m.id === c.id);
      return !esLiq && !esMora;
    });

    return {
      total: clientes.length,
      liquidados,
      enMora,
      alDia
    };
  }, [clientes]);

  // 2. Extraer todos los pagos con su respectivo cliente
  const todosLosPagosConCliente = useMemo(() => {
    return clientes.flatMap(c => 
      (c.pagos || []).map(p => ({ pago: p, cliente: c }))
    );
  }, [clientes]);

  // 3. Pagos realizados en el mes seleccionado
  const pagosDelMes = useMemo(() => {
    return todosLosPagosConCliente.filter(({ pago }) => {
      if (!pago.fechaPago) return false;
      const d = new Date(pago.fechaPago);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === anioSeleccionado && (d.getMonth() + 1) === mesSeleccionado;
    });
  }, [todosLosPagosConCliente, anioSeleccionado, mesSeleccionado]);

  // 4. Sumatorias financieras del mes
  const metricasMes = useMemo(() => {
    const totalRecaudado = pagosDelMes.reduce((acc, curr) => acc + (curr.pago.montoTotal || 0), 0);
    const abonoCapital = pagosDelMes.reduce((acc, curr) => acc + (curr.pago.abonoCapital || 0), 0);
    const abonoInteres = pagosDelMes.reduce((acc, curr) => acc + (curr.pago.abonoInteres || 0), 0);
    const recargosMora = pagosDelMes.reduce((acc, curr) => acc + (curr.pago.recargoMora || 0), 0);

    // Cuotas programadas para vencer en este mes
    const cuotasDelMes = clientes.flatMap(c => 
      (c.amortizacion || []).map(a => ({ cuota: a, cliente: c }))
    ).filter(({ cuota }) => {
      if (!cuota.fechaVencimiento) return false;
      const d = new Date(cuota.fechaVencimiento);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === anioSeleccionado && (d.getMonth() + 1) === mesSeleccionado;
    });

    const totalEsperado = cuotasDelMes.reduce((acc, curr) => acc + (curr.cuota.cuota || 0), 0);
    const efectividad = totalEsperado > 0 
      ? Math.min(100, Math.round((totalRecaudado / totalEsperado) * 1000) / 10) 
      : (totalRecaudado > 0 ? 100 : 0);

    return {
      totalRecaudado,
      abonoCapital,
      abonoInteres,
      recargosMora,
      totalEsperado,
      efectividad,
      cantidadPagos: pagosDelMes.length,
      cuotasProgramadas: cuotasDelMes.length
    };
  }, [pagosDelMes, clientes, anioSeleccionado, mesSeleccionado]);

  // 5. Metricas globales de la cartera (Saldo total, en mora, etc.)
  const metricasGlobales = useMemo(() => {
    const totalVentaFinanciada = clientes.reduce((acc, c) => acc + (c.montoFinanciado || 0), 0);
    const totalCapitalRecuperado = clientes.reduce((acc, c) => {
      const sumaAbonos = (c.pagos || []).reduce((pAcc, p) => pAcc + (p.abonoCapital || 0), 0);
      return acc + sumaAbonos;
    }, 0);
    const saldoPendienteTotal = Math.max(0, totalVentaFinanciada - totalCapitalRecuperado);

    // Saldo en mora (cuotas vencidas no pagadas + recargos)
    const saldoEnMoraTotal = clientes.reduce((acc, c) => {
      const cuotasVencidas = (c.amortizacion || []).filter(a => a.estado === 'vencido');
      const sumCuotas = cuotasVencidas.reduce((s, a) => s + a.cuota, 0);
      const sumRecargos = cuotasVencidas.reduce((s, a) => s + (a.montoMora || 0), 0);
      return acc + sumCuotas + sumRecargos;
    }, 0);

    const tasaMorosidad = clientes.length > 0 
      ? Math.round((metricasClientes.enMora.length / clientes.length) * 1000) / 10 
      : 0;

    return {
      totalVentaFinanciada,
      totalCapitalRecuperado,
      saldoPendienteTotal,
      saldoEnMoraTotal,
      tasaMorosidad
    };
  }, [clientes, metricasClientes]);

  // 6. Próximos vencimientos del mes seleccionado
  const proximosVencimientosMes = useMemo(() => {
    return clientes.flatMap(c => 
      (c.amortizacion || [])
        .filter(a => a.estado === 'pendiente')
        .map(a => ({ cuota: a, cliente: c }))
    ).filter(({ cuota }) => {
      const d = new Date(cuota.fechaVencimiento);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === anioSeleccionado && (d.getMonth() + 1) === mesSeleccionado;
    }).sort((a, b) => a.cuota.fechaVencimiento.localeCompare(b.cuota.fechaVencimiento));
  }, [clientes, anioSeleccionado, mesSeleccionado]);

  // 7. Lista de clientes con cuotas en mora detalladas
  const clientesConDetalleMora = useMemo(() => {
    return metricasClientes.enMora.map(c => {
      const cuotasVencidas = (c.amortizacion || []).filter(a => a.estado === 'vencido');
      const totalDeudaMora = cuotasVencidas.reduce((acc, a) => acc + a.cuota + (a.montoMora || 0), 0);
      const maxDiasMora = Math.max(...cuotasVencidas.map(a => a.diasAtraso || 0), 0);
      return {
        cliente: c,
        cuotasVencidasCount: cuotasVencidas.length,
        totalDeudaMora,
        maxDiasMora
      };
    }).sort((a, b) => b.totalDeudaMora - a.totalDeudaMora);
  }, [metricasClientes.enMora]);

  // Nombre del mes para títulos
  const nombreMesActual = MESES.find(m => m.valor === mesSeleccionado)?.nombre || 'Mes';

  return (
    <div className="space-y-6">
      
      {/* Encabezado Principal y Selector de Período */}
      <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Reporte Ejecutivo & Dashboard Mensual
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {nombreMesActual} {anioSeleccionado}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Estado de cartera de Ricardo a 120 meses: clientes activos, recaudación mensual, moras y balance financiero
          </p>
        </div>

        {/* Selectores de Mes / Año y Botón Imprimir */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Selector de Mes */}
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
          >
            {MESES.map(m => (
              <option key={m.valor} value={m.valor}>{m.nombre}</option>
            ))}
          </select>

          {/* Selector de Año */}
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
          >
            {aniosDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Botón Imprimir / PDF */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            title="Imprimir reporte oficial en papel o guardar como PDF"
          >
            <span>🖨️</span>
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4 TARJETAS PRINCIPALES DE CARTERA: TOTALMENTE INTERACTIVAS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 1. Total de Clientes */}
        <button
          type="button"
          onClick={() => handleSeleccionarEstado('todos')}
          className={`text-left bg-slate-900/90 rounded-2xl p-4 border shadow-lg relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            filtroEstado === 'todos' && tabActiva === 'kpis'
              ? 'border-sky-500 ring-2 ring-sky-500/30'
              : 'border-slate-800 hover:border-sky-500/50'
          }`}
          title="Haz clic para ver la lista completa de compradores"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Clientes</span>
            <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-base">👥</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-white">
              {metricasClientes.total}
            </span>
            <span className="text-xs text-slate-400">en cartera</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>100% de compradores registrados</span>
          </p>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-sky-400 group-hover:text-sky-300">
            <span>Ver listado completo</span>
            <span>→</span>
          </div>
        </button>

        {/* 2. Clientes Pagando (Al Día) */}
        <button
          type="button"
          onClick={() => handleSeleccionarEstado('al_dia')}
          className={`text-left bg-slate-900/90 rounded-2xl p-4 border shadow-lg relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            filtroEstado === 'al_dia' && tabActiva === 'kpis'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
              : 'border-slate-800 hover:border-emerald-500/50'
          }`}
          title="Haz clic para ver quiénes están pagando al día"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Están Pagando</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base">✓</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-emerald-400">
              {metricasClientes.alDia.length}
            </span>
            <span className="text-xs text-slate-400">
              ({metricasClientes.total > 0 ? Math.round((metricasClientes.alDia.length / metricasClientes.total) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Activos al día sin moras</span>
          </p>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
            <span>Ver quiénes están pagando</span>
            <span>→</span>
          </div>
        </button>

        {/* 3. Clientes en Mora */}
        <button
          type="button"
          onClick={() => handleSeleccionarEstado('en_mora')}
          className={`text-left bg-slate-900/90 rounded-2xl p-4 border shadow-lg relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            metricasClientes.enMora.length > 0 ? 'border-rose-500/50 bg-rose-950/20 ring-1 ring-rose-500/30' : 'border-slate-800 hover:border-rose-500/50'
          } ${tabActiva === 'morosos' ? 'ring-2 ring-rose-500' : ''}`}
          title="Haz clic para ver el detalle de quiénes están en mora"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Están en Mora</span>
            <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-base">⚠️</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-rose-400">
              {metricasClientes.enMora.length}
            </span>
            <span className="text-xs text-rose-300/70">
              ({metricasGlobales.tasaMorosidad}%)
            </span>
          </div>
          <p className="text-[11px] text-rose-300/80 mt-2 flex items-center gap-1 font-mono">
            <span>Adeudan: {formatMoneda(metricasGlobales.saldoEnMoraTotal, monedaSimbolo)}</span>
          </p>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-rose-400 group-hover:text-rose-300">
            <span>Ver quiénes están en mora</span>
            <span>→</span>
          </div>
        </button>

        {/* 4. Clientes que Terminaron de Pagar (Liquidados) */}
        <button
          type="button"
          onClick={() => handleSeleccionarEstado('liquidado')}
          className={`text-left bg-slate-900/90 rounded-2xl p-4 border shadow-lg relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            tabActiva === 'liquidados' || (tabActiva === 'kpis' && filtroEstado === 'liquidado')
              ? 'border-purple-500 ring-2 ring-purple-500/30'
              : 'border-slate-800 hover:border-purple-500/50'
          }`}
          title="Haz clic para ver quiénes ya terminaron de pagar"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Ya Terminaron</span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-base">🏛️</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-purple-400">
              {metricasClientes.liquidados.length}
            </span>
            <span className="text-xs text-slate-400">liquidados</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>Listos para Escritura Final</span>
          </p>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-purple-400 group-hover:text-purple-300">
            <span>Ver quiénes ya terminaron</span>
            <span>→</span>
          </div>
        </button>

      </div>

      {/* ======================================================== */}
      {/* RECAUDACIÓN DEL MES & BALANCE FINANCIERO MENSUAL */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Sumatoria de Pagos del Mes (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Flujo de Caja Recibido
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💵 Sumatoria de Pagos de {nombreMesActual}</span>
              </h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {metricasMes.cantidadPagos} pago{metricasMes.cantidadPagos !== 1 ? 's' : ''} registrado{metricasMes.cantidadPagos !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Gran cifra de Recaudación del Mes */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block">Total Ingresado en el Mes:</span>
              <span className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-400">
                {formatMoneda(metricasMes.totalRecaudado, monedaSimbolo)}
              </span>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xs text-slate-300">
                <span>Cobranza esperada: </span>
                <strong className="text-white font-mono">{formatMoneda(metricasMes.totalEsperado, monedaSimbolo)}</strong>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Efectividad del mes: </span>
                <span className={`font-mono font-bold ${metricasMes.efectividad >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {metricasMes.efectividad}%
                </span>
              </div>
            </div>
          </div>

          {/* Desglose del Dinero Recaudado en el Mes */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase text-slate-400 block">Abono Capital</span>
              <span className="text-sm font-mono font-bold text-sky-400">
                {formatMoneda(metricasMes.abonoCapital, monedaSimbolo)}
              </span>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase text-slate-400 block">Interés Financiado</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {formatMoneda(metricasMes.abonoInteres, monedaSimbolo)}
              </span>
            </div>

            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase text-slate-400 block">Recargos Mora</span>
              <span className="text-sm font-mono font-bold text-rose-400">
                {formatMoneda(metricasMes.recargosMora, monedaSimbolo)}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Global de la Cartera Ricardo (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
              Patrimonio y Retorno de Inversión
            </span>
            <h3 className="text-lg font-bold text-white">
              Cartera Total Financiada
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Capital Recuperado a la Fecha:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatMoneda(metricasGlobales.totalCapitalRecuperado, monedaSimbolo)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{
                    width: `${metricasGlobales.totalVentaFinanciada > 0 
                      ? Math.min(100, (metricasGlobales.totalCapitalRecuperado / metricasGlobales.totalVentaFinanciada) * 100) 
                      : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Total de Ventas:</span>
                <span className="font-mono font-bold text-white">
                  {formatMoneda(metricasGlobales.totalVentaFinanciada, monedaSimbolo)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saldo Pendiente por Cobrar:</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatMoneda(metricasGlobales.saldoPendienteTotal, monedaSimbolo)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Plazo promedio financiado:</span>
                <span className="font-mono text-slate-300">120 Meses (10 Años)</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Tasa fija nivelada</span>
            <span>Sin intermediación bancaria</span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* PESTAÑAS DE DETALLE: PAGOS DEL MES, MOROSOS Y VENCIMIENTOS */}
      {/* ======================================================== */}
      <div id="seccion-detalle-cartera" className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
        
        {/* Barra de Tabs de Detalle */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTabActiva('kpis')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                tabActiva === 'kpis'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              👥 Cartera Completa ({clientes.length})
            </button>

            <button
              onClick={() => setTabActiva('morosos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                tabActiva === 'morosos'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300'
              }`}
            >
              <span>⚠️ Están en Mora</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950/80 font-mono text-rose-200">
                {metricasClientes.enMora.length}
              </span>
            </button>

            <button
              onClick={() => setTabActiva('liquidados')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                tabActiva === 'liquidados'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300'
              }`}
            >
              <span>🏛️ Ya Terminaron</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950/80 font-mono text-purple-200">
                {metricasClientes.liquidados.length}
              </span>
            </button>

            <button
              onClick={() => setTabActiva('pagos_mes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                tabActiva === 'pagos_mes'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>💵 Pagos de {nombreMesActual}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 font-mono">
                {pagosDelMes.length}
              </span>
            </button>

            <button
              onClick={() => setTabActiva('vencimientos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                tabActiva === 'vencimientos'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
              }`}
            >
              <span>📅 Por Vencer en {nombreMesActual}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/80 font-mono text-amber-200">
                {proximosVencimientosMes.length}
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            Filtros sincronizados con Supabase y contratos de Ricardo
          </span>
        </div>

        {/* TAB 1: CARTERA COMPLETA DE CLIENTES */}
        {tabActiva === 'kpis' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400">Filtrar por estado:</span>
                {[
                  { id: 'todos', label: `Todos (${clientes.length})` },
                  { id: 'al_dia', label: `Están Pagando (${metricasClientes.alDia.length})` },
                  { id: 'en_mora', label: `Están en Mora (${metricasClientes.enMora.length})` },
                  { id: 'liquidado', label: `Ya Terminaron (${metricasClientes.liquidados.length})` }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFiltroEstado(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      filtroEstado === f.id
                        ? f.id === 'en_mora'
                          ? 'bg-rose-500 text-white'
                          : f.id === 'liquidado'
                          ? 'bg-purple-500 text-white'
                          : 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Comprador</th>
                    <th className="p-3">Lote Asignado</th>
                    <th className="p-3">Cuota Mensual</th>
                    <th className="p-3">Saldo Capital</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {clientes
                    .filter(c => {
                      if (filtroEstado === 'todos') return true;
                      if (filtroEstado === 'liquidado') return metricasClientes.liquidados.some(l => l.id === c.id);
                      if (filtroEstado === 'en_mora') return metricasClientes.enMora.some(m => m.id === c.id);
                      if (filtroEstado === 'al_dia') return metricasClientes.alDia.some(a => a.id === c.id);
                      return true;
                    })
                    .map(c => {
                      const esLiquidado = metricasClientes.liquidados.some(l => l.id === c.id);
                      const esMora = metricasClientes.enMora.some(m => m.id === c.id);
                      const cuotasPagadas = (c.amortizacion || []).filter(a => a.estado === 'pagado').length;

                      return (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white">{c.nombre}</div>
                            <div className="text-[10px] font-mono text-slate-400">DUI: {c.cedula || 'N/A'} • Tel: {c.telefono}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-sky-400">Lote #{c.loteNumero}</span>
                            <span className="text-[10px] text-slate-400 block">{c.loteNombre}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-white">
                            {formatMoneda(c.cuotaMensual, monedaSimbolo)}
                          </td>
                          <td className="p-3 font-mono">
                            <div className="text-white font-bold">
                              {formatMoneda(c.montoFinanciado - (c.pagos || []).reduce((s, p) => s + (p.abonoCapital || 0), 0), monedaSimbolo)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {cuotasPagadas} de {c.plazoMeses} cuotas
                            </div>
                          </td>
                          <td className="p-3">
                            {esLiquidado ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                ✓ Liquidado
                              </span>
                            ) : esMora ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                ⚠️ En Mora
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                ✓ Al Día
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {onVerCliente && (
                              <button
                                onClick={() => onVerCliente(c.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Ver Detalle →
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DETALLE DE PAGOS DEL MES */}
        {tabActiva === 'pagos_mes' && (
          <div className="space-y-3">
            {pagosDelMes.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-3xl">📭</span>
                <p className="text-sm font-bold text-slate-300">
                  No hay pagos registrados para {nombreMesActual} {anioSeleccionado}
                </p>
                <p className="text-xs text-slate-500">
                  Los abonos recibidos en este período aparecerán desglosados aquí con su correlativo de recibo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Recibo / Fecha</th>
                      <th className="p-3">Comprador</th>
                      <th className="p-3">Lote</th>
                      <th className="p-3">Total Pagado</th>
                      <th className="p-3">Abono Capital</th>
                      <th className="p-3">Interés</th>
                      <th className="p-3">Método</th>
                      <th className="p-3 text-right">Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                    {pagosDelMes.map(({ pago, cliente }) => (
                      <tr key={pago.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-sans">
                          <span className="font-bold text-emerald-400 block font-mono">{pago.reciboNumero}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(pago.fechaPago).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          <span className="font-bold text-white block">{cliente.nombre}</span>
                          <span className="text-[10px] text-slate-400">Mes #{pago.mesNumero}</span>
                        </td>
                        <td className="p-3 font-sans">
                          <span className="text-sky-400 font-semibold">Lote #{cliente.loteNumero}</span>
                        </td>
                        <td className="p-3 font-bold text-emerald-400 text-sm">
                          {formatMoneda(pago.montoTotal, monedaSimbolo)}
                        </td>
                        <td className="p-3 text-slate-300">
                          {formatMoneda(pago.abonoCapital, monedaSimbolo)}
                        </td>
                        <td className="p-3 text-slate-400">
                          {formatMoneda(pago.abonoInteres, monedaSimbolo)}
                        </td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase text-slate-300">
                            {pago.metodo}
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          {onVerRecibo && (
                            <button
                              onClick={() => onVerRecibo(pago, cliente)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 cursor-pointer"
                            >
                              👁️ Ver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLIENTES EN MORA */}
        {tabActiva === 'morosos' && (
          <div className="space-y-3">
            {clientesConDetalleMora.length === 0 ? (
              <div className="p-8 text-center bg-emerald-950/20 rounded-2xl border border-emerald-500/30 space-y-2">
                <span className="text-3xl">🎉</span>
                <p className="text-sm font-bold text-emerald-300">
                  ¡Excelente! No hay ningún cliente en mora en Finca Celia.
                </p>
                <p className="text-xs text-slate-400">
                  Todos los compradores se encuentran al día con sus tablas de amortización niveladas.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientesConDetalleMora.map(({ cliente, cuotasVencidasCount, totalDeudaMora, maxDiasMora }) => (
                  <div
                    key={cliente.id}
                    className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{cliente.nombre}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          {cuotasVencidasCount} cuota{cuotasVencidasCount !== 1 ? 's' : ''} vencida{cuotasVencidasCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-rose-400 font-mono">({maxDiasMora} días de atraso)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Lote #{cliente.loteNumero} ({cliente.loteNombre}) • Tel: <strong className="text-slate-200">{cliente.telefono}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right mr-1">
                        <span className="text-[10px] uppercase text-rose-300 block">Total en Mora</span>
                        <span className="text-lg font-mono font-extrabold text-rose-400">
                          {formatMoneda(totalDeudaMora, monedaSimbolo)}
                        </span>
                      </div>

                      <a
                        href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Estimado/a ${cliente.nombre}, le saludamos cordialmente de Finca Celia (Terrenos de Ricardo). Le recordamos amablemente que tiene saldo pendiente de cuota por ${formatMoneda(totalDeudaMora, monedaSimbolo)} en su Lote #${cliente.loteNumero}. Quedamos a su orden para coordinar su pago.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        title="Enviar recordatorio de cobro por WhatsApp"
                      >
                        <span>💬</span>
                        <span>Cobrar WhatsApp</span>
                      </a>

                      {onRegistrarPago && (
                        <button
                          onClick={() => onRegistrarPago(cliente)}
                          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          title="Registrar cobro o pago de cuota atrasada"
                        >
                          <span>💵</span>
                          <span>Registrar Pago</span>
                        </button>
                      )}

                      {onVerCliente && (
                        <button
                          onClick={() => onVerCliente(cliente.id)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          title="Ver expediente y tabla de amortización"
                        >
                          <span>👤</span>
                          <span>Ver Expediente</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CLIENTES QUE YA TERMINARON DE PAGAR (LIQUIDADOS) */}
        {tabActiva === 'liquidados' && (
          <div className="space-y-3">
            {metricasClientes.liquidados.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-3xl">🏛️</span>
                <p className="text-sm font-bold text-slate-300">
                  Aún no hay compradores que hayan terminado de pagar el 100% de sus cuotas
                </p>
                <p className="text-xs text-slate-500">
                  Los compradores que cancelen todas sus cuotas o liquiden anticipadamente aparecerán aquí listos para su trámite de escrituración final.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {metricasClientes.liquidados.map(cliente => {
                  const totalCuotas = (cliente.amortizacion || []).length;
                  const totalPagado = (cliente.pagos || []).reduce((acc, p) => acc + (p.montoTotal || 0), 0);
                  return (
                    <div
                      key={cliente.id}
                      className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">{cliente.nombre}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                            ✓ 100% Cancelado
                          </span>
                          <span className="text-xs text-emerald-400 font-mono">Saldo: $0.00</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Lote #{cliente.loteNumero} ({cliente.loteNombre}) • Tel: <strong className="text-slate-200">{cliente.telefono}</strong> • DUI: <span className="font-mono text-slate-300">{cliente.cedula || 'N/A'}</span>
                        </p>
                        <p className="text-[11px] text-purple-300/80 mt-1">
                          Total abonado: <strong className="text-white font-mono">{formatMoneda(totalPagado || cliente.precioTotal, monedaSimbolo)}</strong> ({totalCuotas} de {cliente.plazoMeses} cuotas pagadas)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {onVerCliente && (
                          <button
                            onClick={() => onVerCliente(cliente.id)}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <span>👤</span>
                            <span>Ver Expediente y Escritura</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRÓXIMOS VENCIMIENTOS */}
        {tabActiva === 'vencimientos' && (
          <div className="space-y-3">
            {proximosVencimientosMes.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-3xl">📅</span>
                <p className="text-sm font-bold text-slate-300">
                  No hay vencimientos pendientes para {nombreMesActual} {anioSeleccionado}
                </p>
                <p className="text-xs text-slate-500">
                  Todas las cuotas de este mes ya fueron canceladas o pertenecen a otro ciclo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {proximosVencimientosMes.map(({ cuota, cliente }) => (
                  <div
                    key={`${cliente.id}-${cuota.mes}`}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white line-clamp-1">{cliente.nombre}</span>
                        <span className="text-amber-400 font-mono font-bold">{cuota.fechaVencimiento}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Lote #{cliente.loteNumero} • Cuota #{cuota.mes}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Valor Cuota</span>
                        <span className="text-sm font-mono font-bold text-emerald-400">
                          {formatMoneda(cuota.cuota, monedaSimbolo)}
                        </span>
                      </div>

                      {onRegistrarPago && (
                        <button
                          onClick={() => onRegistrarPago(cliente)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                        >
                          + Registrar Pago
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL DE INFORMACIÓN DETALLADA SEGÚN ESTADO SELECCIONADO */}
      {/* ======================================================== */}
      {modalEstadoAbierto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
          onClick={() => setModalEstadoAbierto(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold shadow-md ${
                  modalEstadoAbierto === 'en_mora'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : modalEstadoAbierto === 'liquidado'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                    : modalEstadoAbierto === 'al_dia'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                }`}>
                  {modalEstadoAbierto === 'en_mora' ? '⚠️' : modalEstadoAbierto === 'liquidado' ? '🏛️' : modalEstadoAbierto === 'al_dia' ? '✓' : '👥'}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>
                      {modalEstadoAbierto === 'en_mora'
                        ? 'Compradores en Mora'
                        : modalEstadoAbierto === 'liquidado'
                        ? 'Compradores que Ya Terminaron de Pagar'
                        : modalEstadoAbierto === 'al_dia'
                        ? 'Compradores al Día (Están Pagando)'
                        : 'Todos los Compradores en Cartera'}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      modalEstadoAbierto === 'en_mora'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : modalEstadoAbierto === 'liquidado'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : modalEstadoAbierto === 'al_dia'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    }`}>
                      {modalEstadoAbierto === 'en_mora'
                        ? metricasClientes.enMora.length
                        : modalEstadoAbierto === 'liquidado'
                        ? metricasClientes.liquidados.length
                        : modalEstadoAbierto === 'al_dia'
                        ? metricasClientes.alDia.length
                        : metricasClientes.total}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalEstadoAbierto === 'en_mora'
                      ? `Cuotas vencidas con recargo moratorio aplicable (Total: ${formatMoneda(metricasGlobales.saldoEnMoraTotal, monedaSimbolo)})`
                      : modalEstadoAbierto === 'liquidado'
                      ? 'Créditos cancelados al 100% listos para emisión de escritura definitiva'
                      : modalEstadoAbierto === 'al_dia'
                      ? 'Clientes activos con mensualidades al corriente sin retrasos'
                      : 'Listado general de los compradores de Finca Celia'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalEstadoAbierto(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-lg font-bold"
                title="Cerrar ventana (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Contenido / Listado del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {/* CASO 1: EN MORA */}
              {modalEstadoAbierto === 'en_mora' && (
                clientesConDetalleMora.length === 0 ? (
                  <div className="p-8 text-center bg-emerald-950/20 rounded-2xl border border-emerald-500/30 space-y-2">
                    <span className="text-4xl">🎉</span>
                    <h4 className="text-sm font-bold text-emerald-300">
                      ¡Excelente! No hay ningún comprador en mora en Finca Celia.
                    </h4>
                    <p className="text-xs text-slate-400">
                      Todos los compradores están al corriente con sus cuotas niveladas.
                    </p>
                  </div>
                ) : (
                  clientesConDetalleMora.map(({ cliente, cuotasVencidasCount, totalDeudaMora, maxDiasMora }) => (
                    <div
                      key={cliente.id}
                      className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/40 space-y-3 hover:border-rose-500/60 transition-all shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-900/30 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold text-white">{cliente.nombre}</span>
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                              ⚠️ {cuotasVencidasCount} cuota{cuotasVencidasCount !== 1 ? 's' : ''} vencida{cuotasVencidasCount !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-rose-400 font-mono">
                              ({maxDiasMora} días de retraso)
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            <strong className="text-sky-400">{cliente.loteNombre} (Lote #{cliente.loteNumero})</strong>
                            <span className="text-slate-400"> • DUI: </span>
                            <span className="font-mono text-slate-300">{cliente.cedula || 'Sin registrar'}</span>
                            <span className="text-slate-400"> • Tel: </span>
                            <a href={`tel:${cliente.telefono}`} className="text-slate-200 underline font-semibold">{cliente.telefono}</a>
                          </p>
                        </div>

                        <div className="text-left sm:text-right bg-rose-950/40 p-2 sm:p-0 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-rose-300 block">Deuda Total en Mora</span>
                          <span className="text-xl font-mono font-extrabold text-rose-400">
                            {formatMoneda(totalDeudaMora, monedaSimbolo)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-slate-400">
                          <span>Cuota mensual regular: </span>
                          <strong className="text-white font-mono">{formatMoneda(cliente.cuotaMensual, monedaSimbolo)}</strong>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Estimado/a ${cliente.nombre}, le saludamos cordialmente de Finca Celia (Terrenos de Ricardo). Le recordamos amablemente que tiene saldo pendiente de cuota por ${formatMoneda(totalDeudaMora, monedaSimbolo)} en su Lote #${cliente.loteNumero}. Quedamos a su orden para coordinar su pago.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            title="Enviar mensaje de cobro por WhatsApp"
                          >
                            <span>💬</span>
                            <span>Cobrar WhatsApp</span>
                          </a>

                          {onRegistrarPago && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalEstadoAbierto(null);
                                onRegistrarPago(cliente);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              <span>💵</span>
                              <span>Registrar Pago</span>
                            </button>
                          )}

                          {onVerCliente && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalEstadoAbierto(null);
                                onVerCliente(cliente.id);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              <span>👤</span>
                              <span>Ver Expediente</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* CASO 2: YA TERMINARON (LIQUIDADOS) */}
              {modalEstadoAbierto === 'liquidado' && (
                metricasClientes.liquidados.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-4xl">🏛️</span>
                    <h4 className="text-sm font-bold text-slate-300">
                      Aún no hay compradores que hayan terminado de pagar
                    </h4>
                    <p className="text-xs text-slate-500">
                      Los clientes que completen el 100% de sus cuotas pactadas aparecerán aquí con balance en cero y aval para tramitar su escritura definitiva.
                    </p>
                  </div>
                ) : (
                  metricasClientes.liquidados.map(cliente => {
                    const totalCuotas = (cliente.amortizacion || []).length;
                    const cuotasPagadas = (cliente.amortizacion || []).filter(a => a.estado === 'pagado').length;
                    const totalPagado = (cliente.pagos || []).reduce((acc, p) => acc + (p.montoTotal || 0), 0);
                    return (
                      <div
                        key={cliente.id}
                        className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/40 space-y-3 hover:border-purple-500/60 transition-all shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/30 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-white">{cliente.nombre}</span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                                ✓ 100% CANCELADO
                              </span>
                              <span className="text-xs text-emerald-400 font-mono font-bold">
                                Saldo Restante: $0.00
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">
                              <strong className="text-sky-400">{cliente.loteNombre} (Lote #{cliente.loteNumero})</strong>
                              <span className="text-slate-400"> • DUI: </span>
                              <span className="font-mono text-slate-300">{cliente.cedula || 'Sin registrar'}</span>
                              <span className="text-slate-400"> • Tel: </span>
                              <span className="text-slate-200">{cliente.telefono}</span>
                            </p>
                          </div>

                          <div className="text-left sm:text-right bg-purple-950/40 p-2 sm:p-0 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-purple-300 block">Total Pagado</span>
                            <span className="text-xl font-mono font-extrabold text-purple-300">
                              {formatMoneda(totalPagado || cliente.precioTotal, monedaSimbolo)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="text-[11px] text-slate-400 space-x-2">
                            <span>Cuotas completadas: <strong className="text-white font-mono">{cuotasPagadas || totalCuotas} de {cliente.plazoMeses} meses</strong></span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">Listo para Escritura Definitiva</span>
                          </div>

                          {onVerCliente && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalEstadoAbierto(null);
                                onVerCliente(cliente.id);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              <span>👤</span>
                              <span>Ver Expediente y Documentos</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {/* CASO 3: AL DÍA (ESTÁN PAGANDO) */}
              {modalEstadoAbierto === 'al_dia' && (
                metricasClientes.alDia.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-4xl">ℹ️</span>
                    <h4 className="text-sm font-bold text-slate-300">
                      No hay compradores activos al día en este momento
                    </h4>
                  </div>
                ) : (
                  metricasClientes.alDia.map(cliente => {
                    const cuotasPagadas = (cliente.amortizacion || []).filter(a => a.estado === 'pagado').length;
                    const totalCuotas = (cliente.amortizacion || []).length || cliente.plazoMeses;
                    const saldoCapital = Math.max(0, cliente.montoFinanciado - (cliente.pagos || []).reduce((s, p) => s + (p.abonoCapital || 0), 0));
                    const porcentaje = Math.round((cuotasPagadas / totalCuotas) * 100);

                    return (
                      <div
                        key={cliente.id}
                        className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 hover:border-emerald-500/50 transition-all shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/30 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-white">{cliente.nombre}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                ✓ AL DÍA
                              </span>
                              <span className="text-xs text-emerald-400 font-mono">
                                {cuotasPagadas} de {totalCuotas} cuotas ({porcentaje}%)
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">
                              <strong className="text-sky-400">{cliente.loteNombre} (Lote #{cliente.loteNumero})</strong>
                              <span className="text-slate-400"> • DUI: </span>
                              <span className="font-mono text-slate-300">{cliente.cedula || 'Sin registrar'}</span>
                              <span className="text-slate-400"> • Tel: </span>
                              <span className="text-slate-200">{cliente.telefono}</span>
                            </p>
                          </div>

                          <div className="text-left sm:text-right bg-emerald-950/40 p-2 sm:p-0 rounded-xl">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cuota Mensual</span>
                            <span className="text-lg font-mono font-extrabold text-emerald-400">
                              {formatMoneda(cliente.cuotaMensual, monedaSimbolo)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Saldo: {formatMoneda(saldoCapital, monedaSimbolo)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="w-full sm:w-1/2">
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${porcentaje}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {onRegistrarPago && (
                              <button
                                type="button"
                                onClick={() => {
                                  setModalEstadoAbierto(null);
                                  onRegistrarPago(cliente);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                              >
                                <span>💵</span>
                                <span>Registrar Pago</span>
                              </button>
                            )}

                            {onVerCliente && (
                              <button
                                type="button"
                                onClick={() => {
                                  setModalEstadoAbierto(null);
                                  onVerCliente(cliente.id);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                              >
                                <span>👤</span>
                                <span>Ver Expediente</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {/* CASO 4: TODOS LOS COMPRADORES */}
              {modalEstadoAbierto === 'todos' && (
                clientes.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-4xl">👥</span>
                    <h4 className="text-sm font-bold text-slate-300">
                      No hay compradores registrados en el sistema
                    </h4>
                  </div>
                ) : (
                  clientes.map(cliente => {
                    const esLiquidado = metricasClientes.liquidados.some(l => l.id === cliente.id);
                    const esMora = metricasClientes.enMora.some(m => m.id === cliente.id);
                    const cuotasPagadas = (cliente.amortizacion || []).filter(a => a.estado === 'pagado').length;

                    return (
                      <div
                        key={cliente.id}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{cliente.nombre}</span>
                            {esLiquidado ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                ✓ Liquidado
                              </span>
                            ) : esMora ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                ⚠️ En Mora
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                ✓ Al Día
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {cliente.loteNombre} (Lote #{cliente.loteNumero}) • DUI: {cliente.cedula || 'N/A'} • Tel: {cliente.telefono}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-xs font-mono font-bold text-emerald-400 mr-2">
                            {formatMoneda(cliente.cuotaMensual, monedaSimbolo)}/mes ({cuotasPagadas}/{cliente.plazoMeses} cuotas)
                          </span>

                          {onVerCliente && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalEstadoAbierto(null);
                                onVerCliente(cliente.id);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Ver Detalle →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleVerEnTabla}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>📊</span>
                <span>Ver en la tabla detallada del reporte ↓</span>
              </button>

              <button
                type="button"
                onClick={() => setModalEstadoAbierto(null)}
                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
