import React, { useState } from 'react';
import { SupabaseSettings } from '../types';
import { probarConexionSupabase, guardarSupabaseConfig, defaultSupabaseSettings } from '../services/supabaseService';
import { generarSupabaseSQL } from '../utils/calculos';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configActual: SupabaseSettings;
  onGuardarConfig: (nuevaConfig: SupabaseSettings) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  configActual,
  onGuardarConfig
}) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState(configActual.url || '');
  const [anonKey, setAnonKey] = useState(configActual.anonKey || '');
  const [tableNameClientes, setTableNameClientes] = useState(configActual.tableNameClientes || 'clientes_quinta_celia');
  const [probando, setProbando] = useState(false);
  const [resultadoTest, setResultadoTest] = useState<{ exito: boolean; mensaje: string } | null>(null);
  const [copiadoSQL, setCopiadoSQL] = useState(false);

  const handleProbarConexion = async () => {
    setProbando(true);
    setResultadoTest(null);
    try {
      const res = await probarConexionSupabase(url, anonKey, tableNameClientes);
      setResultadoTest(res);
    } catch (e: any) {
      setResultadoTest({ exito: false, mensaje: e?.message || 'Error inesperado' });
    } finally {
      setProbando(false);
    }
  };

  const handleGuardar = () => {
    const nueva: SupabaseSettings = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      tableNameClientes: tableNameClientes.trim() || 'clientes_quinta_celia',
      tableNamePagos: 'pagos_quinta_celia',
      conectado: Boolean(url.trim() && anonKey.trim()),
      ultimaSincronizacion: new Date().toISOString()
    };

    guardarSupabaseConfig(nueva);
    onGuardarConfig(nueva);
    onClose();
  };

  const handleCopiarSQL = () => {
    const sql = generarSupabaseSQL();
    navigator.clipboard.writeText(sql);
    setCopiadoSQL(true);
    setTimeout(() => setCopiadoSQL(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.32 14.242a.396.396 0 0 0 .313.633h9.362v8.958a.396.396 0 0 0 .716.233l10.964-14.079a.396.396 0 0 0-.313-.633z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base flex items-center gap-2">
                <span>Configuración de Supabase</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  configActual.conectado ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {configActual.conectado ? 'CONECTADO' : 'MODO LOCAL ACTIVO'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Almacenamiento en la nube para compradores, teléfonos, direcciones y cuotas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-emerald-200 leading-relaxed">
            <p className="font-semibold text-emerald-300 mb-1">ℹ️ Persistencia Híbrida Inteligente:</p>
            La app funciona de forma 100% inmediata mediante almacenamiento local seguro persistente. Si ingresas tus credenciales de Supabase, los nombres, contactos, celulares, direcciones y pagos se sincronizarán también directamente con tu proyecto Supabase.
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Supabase Project URL:
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tu-proyecto.supabase.co"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Supabase Anon (Public) Key:
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nombre de Tabla de Clientes:
              </label>
              <input
                type="text"
                value={tableNameClientes}
                onChange={(e) => setTableNameClientes(e.target.value)}
                placeholder="clientes_quinta_celia"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons: Test Connection & SQL */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleProbarConexion}
              disabled={probando || !url.trim() || !anonKey.trim()}
              className="w-full sm:w-auto flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {probando ? 'Comprobando...' : 'Probar Conexión Supabase'}
            </button>

            <button
              type="button"
              onClick={handleCopiarSQL}
              className="w-full sm:w-auto py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copiadoSQL ? '✓ ¡SQL Copiado al Portapapeles!' : 'Copiar Script SQL'}
            </button>
          </div>

          {/* Test Result Message */}
          {resultadoTest && (
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              resultadoTest.exito 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}>
              {resultadoTest.mensaje}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleGuardar}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            Guardar Configuración
          </button>
        </div>

      </div>
    </div>
  );
};
