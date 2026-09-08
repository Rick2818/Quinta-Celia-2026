import React, { useState, useEffect } from 'react';
import { MedidasTerreno } from '../types';
import { 
  calcularCuotaMensual, 
  calcularMedidasTerreno, 
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
  // Lotes preconfigurados Quinta Celia
  const PRESETS_QUINTA_CELIA = [
    { nombre: 'Lote El Manantial (500 m²)', x1: 20, x2: 20, y1: 25, precioM2: 45 },
    { nombre: 'Lote Vista al Valle (667 m²)', x1: 20, x2: 24.5, y1: 30, precioM2: 48 },
    { nombre: 'Macrolote Campestre (1,000 m²)', x1: 25, x2: 25, y1: 40, precioM2: 42 },
    { nombre: 'Lote Premium Mirador (1,500 m²)', x1: 30, x2: 35, y1: 46.15, precioM2: 52 },
  ];

  const [nombreLote, setNombreLote] = useState('Lote Campestre Quinta Celia');
  const [modoPrecio, setModoPrecio] = useState<'porM2' | 'total'>('porM2');
  const [precioM2, setPrecioM2] = useState<number>(45);
  const [precioTotalManual, setPrecioTotalManual] = useState<number>(30000);

  // Parámetros de hipoteca
  const [enganchePorcentaje, setEnganchePorcentaje] = useState<number>(20);
  const [plazoMeses, setPlazoMeses] = useState<number>(120);
  const [tasaInteresAnual, setTasaInteresAnual] = useState<number>(9.5);

  // Calcular precio total dinámico
  const precioTotal = modoPrecio === 'porM2'
    ? Math.round(medidasTopograficas.areaM2 * precioM2)
    : precioTotalManual;

  const engancheMonto = Math.round(precioTotal * (enganchePorcentaje / 100));
  const montoFinanciado = Math.max(0, precioTotal - engancheMonto);
  const cuotaMensual = calcularCuotaMensual(montoFinanciado, tasaInteresAnual, plazoMeses);

  const totalPagar = Math.round(cuotaMensual * plazoMeses);
  const totalIntereses = Math.max(0, totalPagar - montoFinanciado);

  const porcentajeCapital = totalPagar > 0 ? Math.round((montoFinanciado / totalPagar) * 100) : 100;
  const porcentajeInteres = 100 - porcentajeCapital;

  const handleSeleccionarPreset = (preset: typeof PRESETS_QUINTA_CELIA[0]) => {
    setNombreLote(preset.nombre);
    setPrecioM2(preset.precioM2);
    setModoPrecio('porM2');
  };

  const handleProcederCreacion = () => {
    onCrearClienteConSimulacion({
      medidas: medidasTopograficas,
      precioM2,
      precioTotal,
      enganche: engancheMonto,
      enganchePorcentaje,
      montoFinanciado,
      plazoMeses,
      tasaInteresAnual,
      cuotaMensual,
      loteSugerido: nombreLote
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Presets */}
      <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
              Cotizador de Terrenos y Cuotas
            </h2>
            <p className="text-xs text-slate-400">
              Configura el plan de financiamiento exacto con amortización francesa para lotes de Quinta Celia
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

        {/* Presets Row */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Lotes Típicos en Promoción:
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESETS_QUINTA_CELIA.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSeleccionarPreset(p)}
                className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all cursor-pointer hover:border-emerald-500/40 group"
              >
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 block truncate">
                  {p.nombre}
                </span>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>${p.precioM2}/m²</span>
                  <span className="text-amber-400">{p.x1}m × {p.y1}m</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Real-Time Results & Mini Plotter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Financing Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
          
          <h3 className="text-base font-display font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Parámetros del Financiamiento Hipotecario
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

          {/* Modalidad de Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-300 font-semibold">Precio por Metro Cuadrado (m²):</label>
                <span className="font-mono text-emerald-400 font-bold">${precioM2} / m²</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="1"
                  value={precioM2}
                  onChange={(e) => {
                    setPrecioM2(parseFloat(e.target.value) || 20);
                    setModoPrecio('porM2');
                  }}
                  className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  value={precioM2}
                  onChange={(e) => {
                    setPrecioM2(parseFloat(e.target.value) || 1);
                    setModoPrecio('porM2');
                  }}
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs text-right"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Calculado sobre {medidasTopograficas.areaM2.toLocaleString()} m² avalados
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-300 font-semibold">Precio Total del Terreno:</label>
                <span className="font-mono text-white font-bold">{formatMoneda(precioTotal)}</span>
              </div>
              <input
                type="number"
                value={precioTotal}
                onChange={(e) => {
                  setPrecioTotalManual(parseFloat(e.target.value) || 0);
                  setModoPrecio('total');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Modifica directamente o ajusta el $/m²
              </span>
            </div>
          </div>

          {/* Enganche (Prima Inicial) */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-200 font-semibold">
                Enganche / Prima Inicial ({enganchePorcentaje}%):
              </label>
              <span className="font-mono text-emerald-400 font-bold">
                {formatMoneda(engancheMonto)}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={enganchePorcentaje}
                onChange={(e) => setEnganchePorcentaje(parseInt(e.target.value) || 5)}
                className="flex-1 accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="w-12 text-center text-xs font-mono font-bold text-white bg-slate-900 py-1 rounded-lg border border-slate-700">
                {enganchePorcentaje}%
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Monto a Financiar (Capital Inicial):</span>
              <strong className="text-white font-mono">{formatMoneda(montoFinanciado)}</strong>
            </div>
          </div>

          {/* Plazo y Tasa de Interés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Plazo en meses */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Plazo de Amortización:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">Hasta 120m</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={plazoMeses}
                    onChange={(e) => setPlazoMeses(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 bg-slate-950 border border-amber-500/50 rounded-lg px-1.5 py-0.5 text-right font-mono text-amber-300 font-bold text-xs"
                  />
                  <span className="font-mono text-amber-400 font-bold text-xs">Meses ({Number((plazoMeses / 12).toFixed(1))} Años)</span>
                </div>
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
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="range"
                  min="6"
                  max="120"
                  step="6"
                  value={plazoMeses}
                  onChange={(e) => setPlazoMeses(parseInt(e.target.value) || 6)}
                  className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-amber-400 font-semibold">6m a 120m</span>
              </div>
            </div>

            {/* Tasa de Interés */}
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
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={tasaInteresAnual}
                  onChange={(e) => setTasaInteresAnual(parseFloat(e.target.value) || 0)}
                  className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-white w-12 text-right">
                  {tasaInteresAnual}%
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Col: Instant Calculation Cards & Surveyor Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Main Calculation Outcome Card */}
          <div className="bg-gradient-to-br from-emerald-900/90 via-slate-900 to-slate-900 rounded-3xl p-6 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-bold block mb-1">
              Resultado Hipotecario Quinta Celia
            </span>

            <div className="my-3">
              <span className="text-xs text-slate-400 block mb-0.5">Cuota Mensual Fija Nivelada:</span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-white flex items-baseline gap-1">
                <span className="text-emerald-400">{formatMoneda(cuotaMensual)}</span>
                <span className="text-xs text-slate-400 font-normal">/ mes</span>
              </div>
            </div>

            {/* Visual Breakdown Bar: Capital vs Interés */}
            <div className="space-y-1.5 my-4 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Desglose Total del Financiamiento:</span>
                <span className="font-mono text-white font-bold">{formatMoneda(totalPagar)}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all" 
                  style={{ width: `${porcentajeCapital}%` }} 
                  title={`Capital: ${formatMoneda(montoFinanciado)} (${porcentajeCapital}%)`}
                ></div>
                <div 
                  className="bg-amber-500 h-full transition-all" 
                  style={{ width: `${porcentajeInteres}%` }} 
                  title={`Intereses: ${formatMoneda(totalIntereses)} (${porcentajeInteres}%)`}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-mono pt-0.5">
                <span className="text-emerald-400">Capital: {formatMoneda(montoFinanciado)} ({porcentajeCapital}%)</span>
                <span className="text-amber-400">Intereses: {formatMoneda(totalIntereses)} ({porcentajeInteres}%)</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">Enganche Inicial</span>
                <span className="font-mono font-bold text-white">{formatMoneda(engancheMonto)}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">Total a Pagar</span>
                <span className="font-mono font-bold text-emerald-300">{formatMoneda(totalPagar + engancheMonto)}</span>
              </div>
            </div>

            {/* Action button to create buyer */}
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

          {/* Topographer Surveyor Dock */}
          <div className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                📐
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                  Topografía Oficial Quinta Celia
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

    </div>
  );
};
