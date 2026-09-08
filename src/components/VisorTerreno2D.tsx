import React from 'react';
import { MedidasTerreno } from '../types';

interface VisorTerrenoProps {
  medidas: MedidasTerreno;
  loteNombre?: string;
  nombreLote?: string;
  loteNumero?: string;
  numeroLote?: string;
  clienteAsignado?: string;
  className?: string;
  interactive?: boolean;
}

export const VisorTerreno2D: React.FC<VisorTerrenoProps> = ({
  medidas,
  loteNombre,
  nombreLote,
  loteNumero,
  numeroLote,
  clienteAsignado,
  className = '',
}) => {
  const displayLoteNombre = nombreLote || loteNombre || 'Lote Campestre';
  const displayLoteNumero = numeroLote || loteNumero || '01';
  const { x1, x2, y1, areaM2, perimetro, varasCuadradas } = medidas;

  // Escalar para viewport SVG de 400x320
  const maxWidth = Math.max(x1, x2);
  const maxDim = Math.max(maxWidth, y1, 10);
  const scale = 240 / maxDim;

  // Centro del canvas
  const centerX = 200;
  const bottomY = 260;
  const topY = bottomY - (y1 * scale);

  // Vértices del polígono:
  // Vértice 1 (Frontal Izquierdo A): bottomY
  const ax = centerX - ((x1 * scale) / 2);
  const ay = bottomY;

  // Vértice 2 (Frontal Derecho B): bottomY
  const bx = centerX + ((x1 * scale) / 2);
  const by = bottomY;

  // Vértice 3 (Fondo Derecho C): topY
  const cx = centerX + ((x2 * scale) / 2);
  const cy = topY;

  // Vértice 4 (Fondo Izquierdo D): topY
  const dx = centerX - ((x2 * scale) / 2);
  const dy = topY;

  const pointsString = `${ax},${ay} ${bx},${by} ${cx},${cy} ${dx},${dy}`;

  return (
    <div className={`relative bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-hidden select-none ${className}`}>
      {/* Top Header info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold block">
            Plano Geométrico Catastral 2D
          </span>
          <h4 className="text-white font-display text-sm font-semibold flex items-center gap-1.5">
            <span>{displayLoteNombre}</span>
            <span className="text-slate-400 text-xs font-mono font-normal">#{displayLoteNumero}</span>
          </h4>
        </div>
        
        {/* North Compass */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
          <div className="w-5 h-5 relative flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-full h-full text-rose-500">
              <polygon points="12,2 15,12 12,9 9,12" fill="#ef4444" />
              <polygon points="12,22 15,12 12,15 9,12" fill="#94a3b8" />
            </svg>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-300">NORTE</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-64 flex items-center justify-center">
        <svg 
          viewBox="0 0 400 320" 
          className="w-full h-full"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="surveyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            {/* Land Texture Gradient */}
            <linearGradient id="landGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#047857" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect width="400" height="320" fill="url(#surveyGrid)" />

          {/* Vía de Acceso Frontal / Calle */}
          <rect x="20" y="275" width="360" height="25" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <line x1="20" y1="287" x2="380" y2="287" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x="200" y="292" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">
            VÍA DE ACCESO PRINCIPAL (CALLE PAVIMENTADA / CAMPESTRE)
          </text>

          {/* Land Parcel Polygon */}
          <polygon
            points={pointsString}
            fill="url(#landGradient)"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Internal diagonal dashed line to show area */}
          <line x1={ax} y1={ay} x2={cx} y2={cy} stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />

          {/* Center Area Badge inside polygon */}
          <g transform={`translate(${centerX}, ${(topY + bottomY) / 2})`}>
            <rect x="-65" y="-18" width="130" height="36" rx="8" fill="#0f172a" fillOpacity="0.9" stroke="#10b981" strokeWidth="1" />
            <text x="0" y="-2" fill="#34d399" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              {areaM2.toLocaleString()} m²
            </text>
            <text x="0" y="11" fill="#94a3b8" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
              ({varasCuadradas.toLocaleString()} v²)
            </text>
          </g>

          {/* Dimension Label: x1 (Frente - Abajo) */}
          <line x1={ax} y1={ay + 8} x2={bx} y2={by + 8} stroke="#f59e0b" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <rect x={centerX - 35} y={ay + 1} width="70" height="15" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x={centerX} y={ay + 12} fill="#fbbf24" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            x1 = {x1.toFixed(2)}m
          </text>

          {/* Dimension Label: x2 (Fondo - Arriba) */}
          <line x1={dx} y1={dy - 8} x2={cx} y2={cy - 8} stroke="#f59e0b" strokeWidth="1.5" />
          <rect x={centerX - 35} y={dy - 16} width="70" height="15" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x={centerX} y={dy - 5} fill="#fbbf24" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            x2 = {x2.toFixed(2)}m
          </text>

          {/* Dimension Label: y1 (Profundidad / Lateral Izquierdo) */}
          <line x1={Math.min(ax, dx) - 14} y1={dy} x2={Math.min(ax, dx) - 14} y2={ay} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
          <g transform={`translate(${Math.min(ax, dx) - 20}, ${(ay + dy) / 2}) rotate(-90)`}>
            <rect x="-35" y="-7" width="70" height="15" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
            <text x="0" y="4" fill="#38bdf8" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              y1 = {y1.toFixed(2)}m
            </text>
          </g>

          {/* Corner Survey Markers (Mojones de Concreto Topográficos) */}
          {/* Vértice A */}
          <circle cx={ax} cy={ay} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <text x={ax - 10} y={ay + 14} fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">M1(A)</text>
          
          {/* Vértice B */}
          <circle cx={bx} cy={by} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <text x={bx + 5} y={by + 14} fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">M2(B)</text>
          
          {/* Vértice C */}
          <circle cx={cx} cy={cy} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <text x={cx + 5} y={cy - 6} fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">M3(C)</text>
          
          {/* Vértice D */}
          <circle cx={dx} cy={dy} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <text x={dx - 22} y={cy - 6} fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">M4(D)</text>
        </svg>
      </div>

      {/* Footer Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Frente (x1)</span>
          <span className="text-amber-400 font-mono font-bold text-sm">{x1.toFixed(2)} m</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fondo (x2)</span>
          <span className="text-amber-400 font-mono font-bold text-sm">{x2.toFixed(2)} m</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Profundidad (y1)</span>
          <span className="text-sky-400 font-mono font-bold text-sm">{y1.toFixed(2)} m</span>
        </div>
      </div>
    </div>
  );
};
