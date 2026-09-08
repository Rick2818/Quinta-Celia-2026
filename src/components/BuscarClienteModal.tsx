import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ClienteComprador, PagoRealizado, SupabaseSettings } from '../types';
import { formatMoneda } from '../utils/calculos';
import { buscarClientesEnSupabase } from '../services/supabaseService';

interface BuscarClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: ClienteComprador[];
  onSeleccionarCliente: (cliente: ClienteComprador) => void;
  onRegistrarPagoCliente?: (cliente: ClienteComprador) => void;
  onNuevoClienteConDatos?: (datos: { nombre?: string; cedula?: string }) => void;
  supabaseConfig: SupabaseSettings;
  monedaSimbolo?: string;
}

export const BuscarClienteModal: React.FC<BuscarClienteModalProps> = ({
  isOpen,
  onClose,
  clientes,
  onSeleccionarCliente,
  onRegistrarPagoCliente,
  onNuevoClienteConDatos,
  supabaseConfig,
  monedaSimbolo = '$'
}) => {
  const [termino, setTermino] = useState('');
  const [buscandoNube, setBuscandoNube] = useState(false);
  const [resultadosNube, setResultadosNube] = useState<ClienteComprador[]>([]);
  const [busquedaNubeHecha, setBusquedaNubeHecha] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setTermino('');
      setResultadosNube([]);
      setBusquedaNubeHecha(false);
    }
  }, [isOpen]);

  // Manejador tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Normalizar texto para búsqueda tolerante (sin tildes, mayúsculas o guiones)
  const normalizar = (txt: string) =>
    (txt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-\s]/g, '');

  const queryNorm = normalizar(termino);

  // Filtrado de clientes locales
  const resultadosLocales = useMemo(() => {
    if (!queryNorm) return clientes.slice(0, 15); // Mostrar los primeros si no hay término

    return clientes.filter(c => {
      const nombreNorm = normalizar(c.nombre);
      const cedulaNorm = normalizar(c.cedula);
      const telNorm = normalizar(c.telefono);
      const loteNorm = normalizar(c.loteNombre + ' ' + c.loteNumero);

      return (
        nombreNorm.includes(queryNorm) ||
        cedulaNorm.includes(queryNorm) ||
        telNorm.includes(queryNorm) ||
        loteNorm.includes(queryNorm)
      );
    });
  }, [clientes, queryNorm]);

  // Búsqueda remota en Supabase
  const handleBuscarEnNube = async () => {
    if (!termino.trim() || !supabaseConfig.conectado) return;
    setBuscandoNube(true);
    setBusquedaNubeHecha(true);
    try {
      const remotos = await buscarClientesEnSupabase(termino.trim(), supabaseConfig);
      // Excluir los que ya están en local por id
      const localesIds = new Set(clientes.map(c => c.id));
      const soloNuevos = remotos.filter(r => !localesIds.has(r.id));
      setResultadosNube(soloNuevos);
    } catch (e) {
      console.warn('Error en búsqueda de nube:', e);
    } finally {
      setBuscandoNube(false);
    }
  };

  if (!isOpen) return null;

  const totalResultados = resultadosLocales.length + resultadosNube.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header con Barra de Búsqueda */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/95 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-lg font-bold">
                🔍
              </div>
              <div>
                <h3 className="text-white font-display font-bold text-base sm:text-lg flex items-center gap-2">
                  <span>Buscar Cliente por Nombre o DUI</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    ESC para cerrar
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Localiza compradores por Nombre, DUI/Cédula, Lote o Teléfono
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>

          {/* Campo de búsqueda principal */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <input
              ref={inputRef}
              type="text"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBuscarEnNube();
              }}
              placeholder="Escribe el Nombre (ej. Roberto) o DUI (ej. 04892114-8)..."
              className="w-full bg-slate-950 border-2 border-emerald-500/40 focus:border-emerald-500 rounded-2xl pl-10 pr-24 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner font-medium"
            />

            {termino && (
              <button
                onClick={() => setTermino('')}
                className="absolute inset-y-0 right-14 pr-2 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}

            {supabaseConfig.conectado && (
              <button
                onClick={handleBuscarEnNube}
                disabled={buscandoNube || !termino.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Consultar base de datos Supabase Cloud"
              >
                {buscandoNube ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <span>☁️ Nube</span>
                )}
              </button>
            )}
          </div>

          {/* Estadísticas / Filtros rápidos */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {termino ? (
                <>Resultados para <strong className="text-white">"{termino}"</strong>: <span className="text-emerald-400 font-bold">{totalResultados}</span></>
              ) : (
                <>Mostrando cartera activa ({clientes.length} registrados)</>
              )}
            </span>

            {supabaseConfig.conectado ? (
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Cloud Activo
              </span>
            ) : (
              <span className="text-slate-500 font-mono">Almacenamiento Local</span>
            )}
          </div>
        </div>

        {/* Lista de Resultados con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 divide-y divide-slate-800/40">
          
          {/* Sin resultados */}
          {totalResultados === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center text-2xl">
                🔎
              </div>
              <div>
                <p className="text-sm font-bold text-slate-300">
                  No se encontró ningún cliente con ese Nombre o DUI
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Verifica que el DUI no tenga errores o realiza una consulta en la nube.
                </p>
              </div>

              {onNuevoClienteConDatos && (
                <button
                  onClick={() => {
                    const esDui = /^[0-9-]+$/.test(termino.trim());
                    onNuevoClienteConDatos({
                      nombre: esDui ? '' : termino.trim(),
                      cedula: esDui ? termino.trim() : ''
                    });
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer transition-all mt-2"
                >
                  <span>+</span>
                  <span>Registrar nuevo comprador con este dato</span>
                </button>
              )}
            </div>
          )}

          {/* Clientes Locales Coincidentes */}
          {resultadosLocales.map((c) => {
            const cuotasPagadas = c.amortizacion.filter(a => a.estado === 'pagado').length;
            const cuotasMora = c.amortizacion.filter(a => a.estado === 'vencido').length;

            return (
              <div
                key={c.id}
                className="pt-2.5 first:pt-0 group hover:bg-slate-800/50 p-3 rounded-2xl border border-transparent hover:border-slate-700/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                {/* Columna Izquierda: Información del Comprador */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-300 border border-slate-700 group-hover:border-emerald-500/30 flex items-center justify-center font-display font-bold text-sm shrink-0 transition-colors">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {c.nombre}
                      </h4>
                      
                      {/* Badge de DUI */}
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-semibold">
                        DUI: {c.cedula || 'Sin registrar'}
                      </span>

                      {/* Estado */}
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                        c.estado === 'liquidado' 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : cuotasMora > 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {c.estado === 'liquidado' ? 'Liquidado' : cuotasMora > 0 ? `${cuotasMora} Cuotas en Mora` : 'Al Día'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <span>📍</span>
                        <strong className="text-slate-300">{c.loteNombre}</strong> (N° {c.loteNumero})
                      </span>

                      {c.telefono && (
                        <span className="flex items-center gap-1">
                          <span>📞</span>
                          <span>{c.telefono}</span>
                        </span>
                      )}

                      <span className="text-slate-500 font-mono">
                        Cuota: {formatMoneda(c.cuotaMensual, monedaSimbolo)} ({cuotasPagadas}/{c.plazoMeses})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Acciones Rápidas */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto">
                  {onRegistrarPagoCliente && c.estado !== 'liquidado' && (
                    <button
                      onClick={() => {
                        onRegistrarPagoCliente(c);
                        onClose();
                      }}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Registrar nuevo pago de cuota"
                    >
                      <span>💳</span>
                      <span>Pagar</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onSeleccionarCliente(c);
                      onClose();
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer transition-all"
                    title="Ver expediente completo y tabla de amortización"
                  >
                    <span>Ver Expediente</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Resultados Remotos de Supabase Cloud */}
          {resultadosNube.length > 0 && (
            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2 px-2 text-xs font-bold text-emerald-400">
                <span>☁️</span>
                <span>Coincidencias encontradas en Supabase Cloud ({resultadosNube.length}):</span>
              </div>

              {resultadosNube.map((c) => (
                <div
                  key={c.id}
                  className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{c.nombre}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                        DUI: {c.cedula || 'Sin registrar'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        En la Nube
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Lote: {c.loteNombre} | Cuota: {formatMoneda(c.cuotaMensual, monedaSimbolo)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSeleccionarCliente(c);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Importar y Ver
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer con Tips */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>Puedes buscar ingresando solo los dígitos de DUI o las iniciales del nombre.</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
