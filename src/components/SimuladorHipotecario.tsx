import React, { useState } from 'react';
import { MedidasTerreno } from '../types';
import { 
  calcularCuotaMensual, 
  formatMoneda, 
  generarTablaAmortizacion 
} from '../utils/calculos';
import { VisorTerreno2D } from './VisorTerreno2D';

interface SimuladorHipotecarioProps {
  medidasTopograficas: MedidasTerreno;
  onAbrirTopografo: () => void;
  onCrearClienteConSimulacion: (datosSimulacion: {
    medidas: MedidasTerreno;
    precioM2: number;
    precioTotal: number;
    enganche: number;
    enganchePorcentaje: number;
    montoFinanciado: number;
    plazoMeses: number;
    tasaInteresAnual: number;
    cuotaMensual: number;
    loteSugerido: string;
  }) => void;
}

export const SimuladorHipotecario: React.FC<SimuladorHipotecarioProps> = ({
  medidasTopograficas,
  onAbrirTopografo,
  onCrearClienteConSimulacion
}) => {
  // Lotes preconfigurados Finca Celia
  const PRESETS_FINCA_CELIA = [
    { nombre: 'Lote El Manantial (500 m²)', x1: 20, x2: 20, y1: 25, precioM2: 45 },
    { nombre: 'Lote Vista al Valle (667 m²)', x1: 20, x2: 24.5, y1: 30, precioM2: 48 },
    { nombre: 'Macrolote Campestre (1,000 m²)', x1: 25, x2: 25, y1: 40, precioM2: 42 },
    { nombre: 'Lote Premium Mirador (1,500 m²)', x1: 30, x2: 35, y1: 46.15, precioM2: 52 },
  ];

  const [nombreLote, setNombreLote] = useState('Lote Campestre Finca Celia');
  const [precioTotal, setPrecioTotal] = useState<number>(30000);
  const [precioM2, setPrecioM2] = useState<number>(() => {
    return Math.round((30000 / (medidasTopograficas.areaM2 || 500)) * 100) / 100;
  });

  // Parámetros de hipoteca (Preconfigurado a 120 meses)
  const [enganchePorcentaje, setEnganchePorcentaje] = useState<number>(20);
  const [engancheManualDolares, setEngancheManualDolares] = useState<number>(6000);
  const [modoEnganche, setModoEnganche] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [plazoMeses, setPlazoMeses] = useState<number>(120);
  const [tasaInteresAnual, setTasaInteresAnual] = useState<number>(9.5);

  // Visor interactivo de la tabla de 120 meses
  const [mostrarTabla120, setMostrarTabla120] = useState<boolean>(true);
  const [busquedaMes120, setBusquedaMes120] = useState<string>('');

  // Sincronización bi-direccional cuando Ricardo cambia el Precio Final
  const handleCambiarPrecioFinal = (nuevoPrecio: number) => {
    const safePrecio = Math.max(0, nuevoPrecio);
    setPrecioTotal(safePrecio);
    if (medidasTopograficas.areaM2 > 0) {
      setPrecioM2(Math.round((safePrecio / medidasTopograficas.areaM2) * 100) / 100);
    }
    if (modoEnganche === 'porcentaje') {
      setEngancheManualDolares(Math.round(safePrecio * (enganchePorcentaje / 100)));
    }
  };

  // Sincronización bi-direccional cuando se ajusta el Precio del Metro Cuadrado
  const handleCambiarPrecioM2 = (nuevoM2: number) => {
    const safeM2 = Math.max(0, nuevoM2);
    setPrecioM2(safeM2);
    const nuevoTotal = Math.round(medidasTopograficas.areaM2 * safeM2);
    setPrecioTotal(nuevoTotal);
    if (modoEnganche === 'porcentaje') {
      setEngancheManualDolares(Math.round(nuevoTotal * (enganchePorcentaje / 100)));
    }
  };

  // Cálculos de prima y financiamiento
  const engancheMonto = modoEnganche === 'porcentaje'
    ? Math.round(precioTotal * (enganchePorcentaje / 100))
    : engancheManualDolares;

  const montoFinanciado = Math.max(0, precioTotal - engancheMonto);
  const cuotaMensual = calcularCuotaMensual(montoFinanciado, tasaInteresAnual, plazoMeses);

  const totalPagar = Math.round(cuotaMensual * plazoMeses);
  const totalIntereses = Math.max(0, totalPagar - montoFinanciado);

  const porcentajeCapital = totalPagar > 0 ? Math.round((montoFinanciado / totalPagar) * 100) : 100;
  const porcentajeInteres = 100 - porcentajeCapital;

  const precioPorVara2 = medidasTopograficas.varasCuadradas > 0
    ? Math.round((precioTotal / medidasTopograficas.varasCuadradas) * 100) / 100
    : 0;

  // Generación dinámica de la tabla de amortización para 120 meses
  const tablaAmortizacion120 = generarTablaAmortizacion(
    montoFinanciado,
    tasaInteresAnual,
    plazoMeses,
    new Date().toISOString().split('T')[0]
  );

  const cuotasFiltradas120 = busquedaMes120.trim()
    ? tablaAmortizacion120.filter(c => c.mes.toString().includes(busquedaMes120.trim()))
    : tablaAmortizacion120;

  const handleSeleccionarPreset = (preset: typeof PRESETS_FINCA_CELIA[0]) => {
    setNombreLote(preset.nombre);
    handleCambiarPrecioM2(preset.precioM2);
  };

  const handleDescargarAmortizacionCSV = () => {
    const encabezados = [
      'Mes',
      'Fecha Vencimiento',
      'Saldo Inicial ($)',
      'Cuota Fija ($)',
      'Abono Capital ($)',
      'Abono Interes ($)',
      'Saldo Restante ($)'
    ];
    const filas = tablaAmortizacion120.map(c => [
      c.mes,
      `"${c.fechaVencimiento}"`,
      c.saldoInicial,
      c.cuota,
      c.capital,
      c.interes,
      c.saldoFinal
    ].join(';'));
    const csvCompleto = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n');
    const blob = new Blob([csvCompleto], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amortizacion_120_meses_${nombreLote.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcederCreacion = () => {
    onCrearClienteConSimulacion({
      medidas: medidasTopograficas,
      precioM2,
      precioTotal,
      enganche: engancheMonto,
      enganchePorcentaje: modoEnganche === 'porcentaje' ? enganchePorcentaje : Math.round((engancheMonto / (precioTotal || 1)) * 100),
      montoFinanciado,
      plazoMeses,
      tasaInteresAnual,
      cuotaMensual,
      loteSugerido: nombreLote
    });
  };


  return (
    <div className="space-y-6">
      
      {/* Encabezado Oficial */}
      <div className="bg-slate-900/95 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                PLAN 120 MESES
              </span>
              <span className="text-xs font-mono text-slate-400">Amortización Francesa Nivelada</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Módulo Administrativo Finca Celia Terrenos de Ricardo
            </h2>
            <p className="text-xs text-slate-400">
              Cálculo de Terrenos, Precio por Metro Cuadrado y Tabla de Amortización a 120 Meses
            </p>
          </div>

          <button
            onClick={onAbrirTopografo}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Ajustar Medidas con Topógrafo (x1, x2, y1)</span>
          </button>
        </div>

        {/* Lotes Preconfigurados */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Lotes Típicos de Finca Celia:
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESETS_FINCA_CELIA.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSeleccionarPreset(p)}
                className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all cursor-pointer hover:border-emerald-500/40 group"
              >
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 block truncate">
                  {p.nombre}
                </span>
                <div className="flex justify-between items-center mt-1 text-[11px]">
                  <span className="text-slate-400 font-mono">${p.precioM2}/m²</span>
                  <span className="text-emerald-400 font-bold font-mono">120m</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Parámetros y PRECIO DEL METRO CUADRADO (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
          
          <h3 className="text-base font-display font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Parámetros del Terreno y Financiamiento
          </h3>

          {/* Nombre Lote */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre o Identificación del Terreno:
            </label>
            <input
              type="text"
              value={nombreLote}
              onChange={(e) => setNombreLote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* ========================================================================= */}
          {/* PANEL PRINCIPAL: PRECIO FINAL DEL TERRENO (FIJADO POR RICARDO) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-500/70 rounded-3xl p-5 shadow-2xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/60 pb-3">
              <div>
                <label className="text-sm sm:text-base font-display font-black text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                  Precio Final del Terreno (Fijado por Ricardo)
                </label>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Tú decides el precio final: este número define inmediatamente la tabla de amortización y las cuotas para los 120 meses.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <span className="text-xs text-slate-400 font-semibold">Precio Total:</span>
                <span className="font-mono text-lg font-black text-amber-400 bg-amber-500/20 px-3.5 py-1 rounded-xl border border-amber-500/40 shadow-inner">
                  {formatMoneda(precioTotal)}
                </span>
              </div>
            </div>

            {/* Input Numérico del Precio Final */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-xl pointer-events-none">$</span>
                <input
                  type="number"
                  min="1000"
                  max="1000000"
                  step="500"
                  value={precioTotal}
                  onChange={(e) => handleCambiarPrecioFinal(parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 30000"
                  className="w-full pl-8 pr-12 py-3 bg-slate-950 border-2 border-amber-500/80 rounded-2xl text-white font-mono text-xl font-black focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-inner"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">USD</span>
              </div>

              {/* Slider Rápido de Precio Final */}
              <div className="sm:col-span-7 flex flex-col gap-1">
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="500"
                  value={precioTotal}
                  onChange={(e) => handleCambiarPrecioFinal(parseFloat(e.target.value) || 10000)}
                  className="w-full accent-amber-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>$10,000</span>
                  <span className="text-amber-400 font-bold">Rango Típico Finca Celia ($20k - $60k)</span>
                  <span>$100,000</span>
                </div>
              </div>
            </div>

            {/* Botones de Precios Finales Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Precios comunes:</span>
              {[18000, 22500, 25000, 30000, 35000, 40000, 45000, 50000].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleCambiarPrecioFinal(p)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    precioTotal === p
                      ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  ${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}k
                </button>
              ))}
            </div>

            {/* Indicador de Equivalencia en $/m2 y $/v2 */}
            <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400 text-[11px]">Cálculo por metro:</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  ${precioM2} / m²
                </span>
                <span className="text-slate-400 text-[11px]">(${precioPorVara2} / v²)</span>
              </div>
              <div className="text-[11px] text-slate-300">
                <span>Para un terreno de: </span>
                <strong className="text-white font-mono">{medidasTopograficas.areaM2.toLocaleString()} m²</strong>
                <span className="text-slate-400"> ({medidasTopograficas.varasCuadradas.toLocaleString()} v²)</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PANEL SECUNDARIO: PRECIO DEL METRO CUADRADO ($/m²) SINCRONIZADO */}
          {/* ========================================================================= */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-4.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>📐</span>
                  <span>O calcular ingresando el Precio del Metro Cuadrado ($ / m²)</span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Si prefieres cotizar por metro, este campo actualiza automáticamente el Precio Final de arriba.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                ${precioM2} / m²
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.5"
                  value={precioM2}
                  onChange={(e) => handleCambiarPrecioM2(parseFloat(e.target.value) || 0)}
                  placeholder="45"
                  className="w-full pl-7 pr-12 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400 pointer-events-none">/ m²</span>
              </div>

              <div className="sm:col-span-7">
                <input
                  type="range"
                  min="15"
                  max="100"
                  step="1"
                  value={precioM2}
                  onChange={(e) => handleCambiarPrecioM2(parseFloat(e.target.value) || 15)}
                  className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>$15/m²</span>
                  <span className="text-emerald-400/80">Rango ($35 - $60)</span>
                  <span>$100/m²</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ENGANCHE (PRIMA INICIAL) - EN % O EN DÓLARES */}
          {/* ========================================================================= */}
          <div className="bg-slate-800/40 p-4.5 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <label className="text-slate-200 font-semibold">
                  Enganche / Prima Inicial:
                </label>
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setModoEnganche('porcentaje')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      modoEnganche === 'porcentaje'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    % Porcentaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoEnganche('monto')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      modoEnganche === 'monto'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $ Dólares
                  </button>
                </div>
              </div>
              <span className="font-mono text-emerald-400 font-extrabold text-sm">
                {formatMoneda(engancheMonto)}
              </span>
            </div>

            {modoEnganche === 'porcentaje' ? (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={enganchePorcentaje}
                  onChange={(e) => {
                    const pct = parseInt(e.target.value) || 5;
                    setEnganchePorcentaje(pct);
                    setEngancheManualDolares(Math.round(precioTotal * (pct / 100)));
                  }}
                  className="flex-1 accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="w-14 text-center text-xs font-mono font-bold text-white bg-slate-900 py-1 rounded-lg border border-slate-700">
                  {enganchePorcentaje}%
                </span>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  max={precioTotal}
                  step="100"
                  value={engancheManualDolares}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setEngancheManualDolares(val);
                    if (precioTotal > 0) {
                      setEnganchePorcentaje(Math.round((val / precioTotal) * 100));
                    }
                  }}
                  placeholder="Monto de la prima en USD"
                  className="w-full pl-7 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
              <span>Monto Neto a Financiar a 120 Meses:</span>
              <strong className="text-white font-mono text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {formatMoneda(montoFinanciado)}
              </strong>
            </div>
          </div>


          {/* Plazo a 120 Meses y Tasa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Plazo de Amortización:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                    120 Meses Fijo
                  </span>
                </label>
                <span className="font-mono text-amber-400 font-bold text-xs">{plazoMeses} Meses (10 Años)</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[12, 24, 36, 60, 84, 120].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPlazoMeses(m)}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer text-center ${
                      plazoMeses === m
                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md ring-2 ring-amber-300/60'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {m === 120 ? '⭐ 120m' : `${m}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasa Anual */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-300 font-semibold">Tasa de Interés Anual:</label>
                <span className="font-mono text-emerald-400 font-bold">{tasaInteresAnual}% Anual</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 8.5, 9.5].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTasaInteresAnual(t)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      tasaInteresAnual === t
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {t === 0 ? '0% Prom' : `${t}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Cuota Nivelada a 120 Meses y Topografía (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Tarjeta Principal de Cuota a 120 Meses */}
          <div className="bg-gradient-to-br from-emerald-900/90 via-slate-900 to-slate-900 rounded-3xl p-6 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-bold block mb-1">
              Cuota Nivelada Calculada ({plazoMeses} Meses)
            </span>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                {formatMoneda(cuotaMensual)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ mes fijo</span>
            </div>

            {/* Barra Visual Capital vs Interés */}
            <div className="space-y-1.5 pb-4 border-b border-slate-800">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Composición del Crédito:</span>
                <span className="font-mono text-emerald-400 font-bold">{formatMoneda(totalPagar)}</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div 
                  style={{ width: `${porcentajeCapital}%` }} 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  title={`Capital: ${porcentajeCapital}%`}
                ></div>
                <div 
                  style={{ width: `${porcentajeInteres}%` }} 
                  className="h-full bg-amber-500 transition-all duration-300"
                  title={`Intereses: ${porcentajeInteres}%`}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-mono pt-0.5">
                <span className="text-emerald-400">Capital: {formatMoneda(montoFinanciado)} ({porcentajeCapital}%)</span>
                <span className="text-amber-400">Intereses: {formatMoneda(totalIntereses)} ({porcentajeInteres}%)</span>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-3 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">Precio Total Terreno</span>
                <span className="font-mono font-bold text-white">{formatMoneda(precioTotal)}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">Enganche ({enganchePorcentaje}%)</span>
                <span className="font-mono font-bold text-emerald-300">{formatMoneda(engancheMonto)}</span>
              </div>
            </div>

            {/* Botón Guardar Comprador */}
            <button
              onClick={handleProcederCreacion}
              className="mt-5 w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Guardar Como Comprador / Lead con este Plan
            </button>
          </div>

          {/* Topógrafo Dock */}
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                📐
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                  Topografía Oficial Finca Celia
                </span>
                <p className="text-xs font-mono font-semibold text-slate-200">
                  x1={medidasTopograficas.x1}m | x2={medidasTopograficas.x2}m | y1={medidasTopograficas.y1}m
                </p>
                <span className="text-[10px] text-slate-400">
                  {medidasTopograficas.areaM2.toLocaleString()} m² ({medidasTopograficas.varasCuadradas.toLocaleString()} v²)
                </span>
              </div>
            </div>

            <button
              onClick={onAbrirTopografo}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 cursor-pointer transition-colors shrink-0"
            >
              Verificar
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN INTERACTIVA: TABLA DE AMORTIZACIÓN DINÁMICA A 120 MESES */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              📅
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                Tabla de Amortización para 120 Meses
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {tablaAmortizacion120.length} Cuotas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Desglose detallado cuota a cuota con capital, intereses y saldo decreciente actualizado por el precio/m².
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Buscador de Mes */}
            <div className="relative">
              <input
                type="text"
                value={busquedaMes120}
                onChange={(e) => setBusquedaMes120(e.target.value)}
                placeholder="Buscar mes (ej: 1, 60, 120)..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-44"
              />
              {busquedaMes120 && (
                <button
                  onClick={() => setBusquedaMes120('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Botón Descargar CSV */}
            <button
              onClick={handleDescargarAmortizacionCSV}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar tabla de 120 meses en archivo Excel / CSV"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Descargar Excel (CSV)</span>
            </button>

            {/* Toggle Visibilidad */}
            <button
              onClick={() => setMostrarTabla120(!mostrarTabla120)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              {mostrarTabla120 ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        {mostrarTabla120 && (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <div className="max-h-[380px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Mes #</th>
                    <th className="py-2.5 px-3">Fecha Vencimiento</th>
                    <th className="py-2.5 px-3 text-right">Saldo Inicial</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-400">Cuota Fija</th>
                    <th className="py-2.5 px-3 text-right text-emerald-300">Capital</th>
                    <th className="py-2.5 px-3 text-right text-amber-300">Interés</th>
                    <th className="py-2.5 px-3 text-right">Saldo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cuotasFiltradas120.map((item) => (
                    <tr 
                      key={item.mes}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        item.mes % 12 === 0 ? 'bg-emerald-950/20 font-bold' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-300">
                        Mes {item.mes} {item.mes % 12 === 0 && `(Año ${item.mes / 12})`}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {item.fechaVencimiento}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {formatMoneda(item.saldoInicial)}
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-emerald-400">
                        {formatMoneda(item.cuota)}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-300">
                        {formatMoneda(item.capital)}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-300">
                        {formatMoneda(item.interes)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-200 font-semibold">
                        {formatMoneda(item.saldoFinal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
              <span>Mostrando {cuotasFiltradas120.length} de {tablaAmortizacion120.length} meses amortizados</span>
              <span className="text-emerald-400 font-semibold">
                Finiquito total proyectado: Mes 120 (Saldo $0.00)
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
