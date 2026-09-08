import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'color';
}

export const QuintaCeliaLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'color' 
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 38, text: 'text-xl', sub: 'text-[11px]' },
    lg: { icon: 52, text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 70, text: 'text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* SVG Icon with Topography contours, parcel bounds and stylized Q */}
      <div 
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 p-2 shadow-md ring-1 ring-emerald-600/30 text-emerald-400"
        style={{ width: currentSize.icon + 12, height: currentSize.icon + 12 }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Topographic Contour Lines */}
          <path 
            d="M10 50 Q30 35, 50 48 T90 40" 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeOpacity="0.4"
            strokeDasharray="2 3"
          />
          <path 
            d="M15 65 Q35 55, 55 62 T85 58" 
            stroke="#34d399" 
            strokeWidth="2" 
            strokeOpacity="0.3"
          />
          <path 
            d="M20 78 Q45 70, 70 76 T80 75" 
            stroke="#6ee7b7" 
            strokeWidth="1.5" 
            strokeOpacity="0.2"
          />

          {/* Geometric Land Parcel Polygon (Topography plot) */}
          <polygon 
            points="28,26 72,20 82,72 20,78" 
            fill="#064e3b" 
            fillOpacity="0.5" 
            stroke="#34d399" 
            strokeWidth="2.5" 
            strokeLinejoin="round"
          />

          {/* Corner Survey Stakes / Mojones */}
          <circle cx="28" cy="26" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          <circle cx="72" cy="20" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          <circle cx="82" cy="72" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          <circle cx="20" cy="78" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />

          {/* Golden Sun & Horizon */}
          <circle cx="50" cy="44" r="14" fill="#fbbf24" fillOpacity="0.85" />

          {/* Stylized Monogram Letter 'Q' & Tree of Quinta */}
          <path 
            d="M50 32 C43 32 38 38 38 46 C38 54 43 60 50 60 C57 60 62 54 62 46 C62 38 57 32 50 32 Z M58 56 L68 66" 
            stroke="#ffffff" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={`font-display font-extrabold tracking-tight ${currentSize.text} ${
          variant === 'light' ? 'text-white' : 'text-slate-900'
        }`}>
          QUINTA <span className={variant === 'light' ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-semibold'}>CELIA</span>
        </span>
        <span className={`font-medium tracking-wider uppercase ${
          variant === 'light' ? 'text-emerald-400/90' : 'text-emerald-800'
        } ${currentSize.sub} flex items-center gap-1.5`}>
          <span>Terrenos</span>
          <span className="w-1 h-1 rounded-full bg-amber-500 inline-block"></span>
          <span>Hipotecas</span>
        </span>
      </div>
    </div>
  );
};

export const QuintaCeliaBanner: React.FC<{ 
  onSimulateClick?: () => void; 
  onSurveyorClick?: () => void;
  onAbrirTopografo?: () => void;
  onAbrirSupabase?: () => void;
  onGuardarEscritorio?: () => void;
  supabaseConectado?: boolean;
  clienteTotal?: number;
}> = ({ 
  onSimulateClick, 
  onSurveyorClick, 
  onAbrirTopografo, 
  onAbrirSupabase,
  onGuardarEscritorio,
  supabaseConectado = false, 
  clienteTotal = 0 
}) => {
  const handleTopografo = onAbrirTopografo || onSurveyorClick;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-xl ring-1 ring-emerald-800/40 p-6 md:p-10 my-4">
      {/* Background Topographic Map Contours Illustration */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1200 400"
      >
        <path d="M0,100 C300,180 500,40 800,120 C1000,180 1150,110 1200,140 L1200,400 L0,400 Z" fill="#10b981" />
        <path d="M0,160 C350,80 600,220 900,150 C1050,110 1150,190 1200,180" stroke="#34d399" strokeWidth="2" fill="none" />
        <path d="M0,220 C250,160 550,280 850,200 C1000,160 1120,240 1200,220" stroke="#6ee7b7" strokeWidth="1.5" fill="none" />
        <path d="M0,280 C300,240 700,320 950,260 C1100,230 1180,290 1200,270" stroke="#a7f3d0" strokeWidth="1" fill="none" strokeDasharray="6 4" />
        {/* Survey Grid */}
        <g stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1">
          <line x1="200" y1="0" x2="200" y2="400" />
          <line x1="400" y1="0" x2="400" y2="400" />
          <line x1="600" y1="0" x2="600" y2="400" />
          <line x1="800" y1="0" x2="800" y2="400" />
          <line x1="1000" y1="0" x2="1000" y2="400" />
        </g>
      </svg>

      {/* Golden Sun Flare Ambient */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sistema Integral de Lotificación & Créditos Quinta Celia</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Simulador de Hipotecas de Terrenos
          </h1>
          
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Gestión completa de compradores, planes de financiamiento con amortización exacta (capital e intereses), control de cuotas mensuales, emisión y despacho de recibos con copia al cliente, y certificación de medidas <span className="text-amber-400 font-semibold font-mono">x1, x2 y y1</span> avaladas por nuestro Agente Topógrafo Senior con más de 20 años de trayectoria.
          </p>

          {/* Badges / Metrics Row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-emerald-400 font-bold">✓ Supabase Ready</span>
              <span className="text-slate-400">| Sincronización en la nube</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-amber-400 font-bold">📐 Peritaje Topográfico</span>
              <span className="text-slate-400">| Cotas x1, x2, y1 en m²</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-sky-400 font-bold">✉ Recibos Automáticos</span>
              <span className="text-slate-400">| Despacho a Correo</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
          {onGuardarEscritorio && (
            <button
              id="banner-btn-guardar-escritorio"
              onClick={onGuardarEscritorio}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 active:scale-[0.98] transition-all text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-amber-300/50"
            >
              <span className="text-lg">💾</span>
              <span>Descargar a mi Escritorio</span>
            </button>
          )}

          {onSimulateClick && (
            <button
              id="banner-btn-simular"
              onClick={onSimulateClick}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Cotización / Hipoteca
            </button>
          )}

          {handleTopografo && (
            <button
              id="banner-btn-topografo"
              onClick={handleTopografo}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 active:scale-[0.98] transition-all text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Agente Topógrafo (20+ Años Exp.)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
