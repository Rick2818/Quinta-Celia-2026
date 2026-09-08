import React, { useState, useRef } from 'react';
import { ClienteComprador, SistemaConfig, SupabaseSettings } from '../types';
import { 
  exportarBaseDeDatosJSON, 
  validarArchivoBackupJSON, 
  exportarCarteraClientesCSV 
} from '../utils/calculos';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  RefreshCw,
  Coins
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: ClienteComprador[];
  onRestaurarDatos: (nuevosClientes: ClienteComprador[], nuevaConfig?: any) => void;
  configSistema: SistemaConfig;
  onActualizarConfigSistema: (nuevaConfig: SistemaConfig) => void;
  configSupabase?: SupabaseSettings;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  clientes,
  onRestaurarDatos,
  configSistema,
  onActualizarConfigSistema,
  configSupabase
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [archivoCargando, setArchivoCargando] = useState(false);

  // Estados locales de configuración
  const [monedaSimbolo, setMonedaSimbolo] = useState(configSistema.monedaSimbolo || '$');
  const [monedaCodigo, setMonedaCodigo] = useState(configSistema.monedaCodigo || 'USD');
  const [tasaMoraMensual, setTasaMoraMensual] = useState(configSistema.tasaMoraMensual || 5.0);
  const [diasGraciaMora, setDiasGraciaMora] = useState(configSistema.diasGraciaMora || 5);

  const handleExportarJson = () => {
    try {
      exportarBaseDeDatosJSON(clientes, configSistema, configSupabase);
      setMensajeExito('¡Copia de seguridad (.json) descargada exitosamente en tu equipo!');
      setMensajeError(null);
    } catch (err: any) {
      setMensajeError(`Error al exportar respaldo: ${err?.message || 'Error desconocido'}`);
    }
  };

  const handleExportarCsv = () => {
    try {
      exportarCarteraClientesCSV(clientes, configSistema.monedaSimbolo);
      setMensajeExito('¡Reporte general de cartera (.csv para Excel) descargado exitosamente!');
      setMensajeError(null);
    } catch (err: any) {
      setMensajeError(`Error al exportar CSV: ${err?.message || 'Error desconocido'}`);
    }
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoCargando(true);
    setMensajeError(null);
    setMensajeExito(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const contenido = event.target?.result as string;
        const backupData = validarArchivoBackupJSON(contenido);

        const confirmar = window.confirm(
          `¿Estás seguro de restaurar este respaldo?\n` +
          `- Contiene: ${backupData.clientes.length} clientes y sus historiales de pago.\n` +
          `- Fecha del respaldo: ${backupData.fechaExportacion || 'Desconocida'}\n\n` +
          `Esto reemplazará los datos locales actuales.`
        );

        if (confirmar) {
          onRestaurarDatos(
            backupData.clientes, 
            backupData.configuracion?.sistema
          );
          setMensajeExito(`¡Respaldo restaurado con éxito! Se cargaron ${backupData.clientes.length} clientes.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setMensajeError(`Error al procesar el archivo: ${err?.message || 'Formato no reconocido'}`);
      } finally {
        setArchivoCargando(false);
      }
    };

    reader.onerror = () => {
      setMensajeError('Error de lectura del archivo seleccionado.');
      setArchivoCargando(false);
    };

    reader.readAsText(file);
  };

  const handleGuardarConfiguracion = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva: SistemaConfig = {
      monedaSimbolo,
      monedaCodigo,
      tasaMoraMensual: Number(tasaMoraMensual) || 2.0,
      diasGraciaMora: Number(diasGraciaMora) || 5,
    };
    onActualizarConfigSistema(nueva);
    setMensajeExito('Configuración de moneda y recargo moratorio guardada correctamente.');
    setMensajeError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">
                Centro de Respaldos & Divisas
              </h3>
              <p className="text-xs text-slate-400">
                Seguridad de datos de Quinta Celia y preferencias de cobranza
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificaciones */}
        {mensajeExito && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {mensajeError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{mensajeError}</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* SECCIÓN 1: EXPORTAR / IMPORTAR BACKUP */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold text-sm text-white">Copias de Seguridad Offline</h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {clientes.length} clientes registrados
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Guarda un archivo de respaldo en tu computadora para proteger tus clientes, amortizaciones y recibos, o para transferirlos a otra computadora.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportarJson}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-950 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar Backup (.JSON)
              </button>

              <button
                type="button"
                onClick={handleExportarCsv}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium text-xs transition-all border border-slate-600 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Exportar Cartera a Excel (CSV)
              </button>
            </div>

            {/* Cargar / Restaurar */}
            <div className="pt-3 border-t border-slate-700/60">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleSeleccionarArchivo}
                className="hidden"
              />
              <button
                type="button"
                disabled={archivoCargando}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {archivoCargando ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Upload className="w-4 h-4 text-amber-400" />
                )}
                Restaurar Backup desde Archivo (.JSON)
              </button>
            </div>
          </div>

          {/* SECCIÓN 2: MONEDA Y POLÍTICA DE MORA */}
          <form onSubmit={handleGuardarConfiguracion} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <h4 className="font-semibold text-sm text-white">Moneda y Parámetros de Cobranza</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Símbolo de Moneda
                </label>
                <select
                  value={monedaSimbolo}
                  onChange={(e) => setMonedaSimbolo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="$">Dólar / Peso ($)</option>
                  <option value="USD $">USD $ (Dólar Estadounidense)</option>
                  <option value="MXN $">MXN $ (Pesos Mexicanos)</option>
                  <option value="C$">C$ (Córdobas)</option>
                  <option value="Q">Q (Quetzales)</option>
                  <option value="L">L (Lempiras)</option>
                  <option value="₡">₡ (Colones)</option>
                  <option value="€">€ (Euros)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Código de Moneda
                </label>
                <input
                  type="text"
                  value={monedaCodigo}
                  onChange={(e) => setMonedaCodigo(e.target.value.toUpperCase())}
                  placeholder="USD, MXN, NIO, GTQ..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Multa por Mora (%):
                  </label>
                  <span className="text-[11px] font-bold text-amber-400">
                    Rango: 3% a 5%
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="5"
                  value={tasaMoraMensual}
                  onChange={(e) => setTasaMoraMensual(Math.min(5, Math.max(3, Number(e.target.value))))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[3, 3.5, 4, 4.5, 5].map(porc => (
                    <button
                      key={porc}
                      type="button"
                      onClick={() => setTasaMoraMensual(porc)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                        tasaMoraMensual === porc
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {porc}%
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Multa aplicada sobre el valor de la cuota vencida (política Quinta Celia: 3% al 5%)
                </span>
              </div>


              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Días de Gracia para Mora
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="60"
                  value={diasGraciaMora}
                  onChange={(e) => setDiasGraciaMora(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-400">
                  Días posteriores a la fecha de vencimiento antes de aplicar recargo
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Guardar Parámetros
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
