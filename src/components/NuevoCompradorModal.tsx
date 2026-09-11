import React, { useState } from 'react';
import { ClienteComprador, MedidasTerreno } from '../types';
import { 
  calcularMedidasTerreno, 
  calcularCuotaMensual, 
  generarTablaAmortizacion, 
  formatMoneda 
} from '../utils/calculos';
import { optimizarArchivoDocumento } from '../utils/fileCompressor';

interface NuevoCompradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  datosIniciales?: {
    medidas?: MedidasTerreno;
    precioM2?: number;
    precioTotal?: number;
    enganche?: number;
    plazoMeses?: number;
    tasaInteresAnual?: number;
    loteNombre?: string;
    loteNumero?: string;
  } | null;
  onGuardarCliente: (cliente: ClienteComprador) => void;
  onAbrirTopografo?: () => void;
}

export const NuevoCompradorModal: React.FC<NuevoCompradorModalProps> = ({
  isOpen,
  onClose,
  datosIniciales,
  onGuardarCliente,
  onAbrirTopografo
}) => {
  if (!isOpen) return null;

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('Valle de Zapotitán / Coatepeque');
  const [cedula, setCedula] = useState('');
  const [loteNombre, setLoteNombre] = useState(datosIniciales?.loteNombre || 'Lote Campestre Quinta Celia');
  const [loteNumero, setLoteNumero] = useState(datosIniciales?.loteNumero || '01');
  
  // Medidas del terreno
  const [x1, setX1] = useState<number>(datosIniciales?.medidas?.x1 || 20);
  const [x2, setX2] = useState<number>(datosIniciales?.medidas?.x2 || 20);
  const [y1, setY1] = useState<number>(datosIniciales?.medidas?.y1 || 30);

  // Financiamiento
  const [precioTotal, setPrecioTotal] = useState<number>(datosIniciales?.precioTotal || 25000);
  const [enganche, setEnganche] = useState<number>(datosIniciales?.enganche || 5000);
  const [plazoMeses, setPlazoMeses] = useState<number>(datosIniciales?.plazoMeses || 36);
  const [tasaInteresAnual, setTasaInteresAnual] = useState<number>(datosIniciales?.tasaInteresAnual || 9.5);
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);

  // Cálculos dinámicos
  const medidasCalculadas = calcularMedidasTerreno(x1, x2, y1);
  const montoFinanciado = Math.max(0, precioTotal - enganche);
  const cuotaMensual = calcularCuotaMensual(montoFinanciado, tasaInteresAnual, plazoMeses);
  const enganchePorcentaje = precioTotal > 0 ? Math.round((enganche / precioTotal) * 100) : 20;

  // Bóveda de Documentos Legales
  const [docDui, setDocDui] = useState<any>(null);
  const [docPromesa, setDocPromesa] = useState<any>(null);
  const [docEscritura, setDocEscritura] = useState<any>(null);
  const [procesandoArchivo, setProcesandoArchivo] = useState<string | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'dui' | 'promesa' | 'escritura') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorArchivo(null);
    setProcesandoArchivo(tipo);

    try {
      // Compresión inteligente en el navegador para evitar saturación de memoria
      const optimizado = await optimizarArchivoDocumento(file);

      const nuevoDoc = {
        id: `doc-${Date.now()}`,
        tipo: tipo === 'dui' ? 'copia_dui' : tipo === 'promesa' ? 'promesa_venta' : 'escritura_compraventa',
        nombreArchivo: optimizado.nombreArchivo,
        tamanoBytes: optimizado.tamanoBytes,
        tipoMime: optimizado.tipoMime,
        dataUrl: optimizado.dataUrl,
        fechaSubida: new Date().toISOString()
      };
      if (tipo === 'dui') setDocDui(nuevoDoc);
      if (tipo === 'promesa') setDocPromesa(nuevoDoc);
      if (tipo === 'escritura') setDocEscritura(nuevoDoc);
    } catch (err: any) {
      console.error('Error optimizando archivo en modal:', err);
      setErrorArchivo(err?.message || 'Error al procesar el archivo.');
    } finally {
      setProcesandoArchivo(null);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;

    // Generar tabla de amortización para este cliente
    const amortizacion = generarTablaAmortizacion(
      montoFinanciado,
      tasaInteresAnual,
      plazoMeses,
      fechaInicio
    );

    const nuevoCliente: ClienteComprador = {
      id: `cliente-${Date.now()}`,
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      cedula: cedula.trim(),
      loteNombre: loteNombre.trim(),
      loteNumero: loteNumero.trim(),
      medidas: medidasCalculadas,
      topografoValidado: true,
      topografoNombre: 'Ing. Celso R. Valdivia (Topógrafo Senior 24 años exp.)',
      topografoDictamen: `Medidas definitivas certificadas por el Ing. Celso R. Valdivia: Frente (x1)=${x1}m, Fondo (x2)=${x2}m, Profundidad (y1)=${y1}m. Superficie total: ${medidasCalculadas.areaM2} m² (${medidasCalculadas.varasCuadradas} v²). Mojones replanteados y conformes con el ordenamiento parcelario Finca Celia.`,
      topografoFecha: new Date().toISOString().split('T')[0],
      precioM2: Math.round(precioTotal / (medidasCalculadas.areaM2 || 1)),
      precioTotal,
      enganche,
      enganchePorcentaje,
      montoFinanciado,
      plazoMeses,
      tasaInteresAnual,
      cuotaMensual,
      fechaInicio,
      estado: 'activo',
      amortizacion,
      pagos: [],
      notas: 'Expediente creado en el Módulo Administrativo Finca Celia Terrenos de Ricardo.',
      documentos: {
        ...(docDui ? { copiaDui: docDui } : {}),
        ...(docPromesa ? { promesaVenta: docPromesa } : {}),
        ...(docEscritura ? { escrituraCompraVenta: docEscritura } : {})
      },
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    };

    onGuardarCliente(nuevoCliente);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              👤
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base">
                Registrar Nuevo Comprador / Lead
              </h3>
              <p className="text-xs text-slate-400">
                Guarda datos de contacto y formaliza el plan de financiamiento
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Seccion: Datos del Comprador */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <span>1. Datos Personales y Contacto del Comprador</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre Completo *:
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Ing. Carlos Ernesto Morales"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Cédula / DUI / Identificación:
                </label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej: 03829104-5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Número de Celular / WhatsApp *:
                </label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: +503 7988-1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Correo Electrónico (Para envío de recibos) *:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="comprador@correo.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Dirección Residencial o Domicilio:
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Col. Las Victorias, Calle Los Abetos #12"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Seccion: Terreno y Medidas Topográficas */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>2. Medidas Topográficas Oficiales (x1, x2, y1)</span>
              </h4>
              <button
                type="button"
                onClick={onAbrirTopografo}
                className="text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer text-[11px]"
              >
                Consultar al Topógrafo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre del Lote / Sector:
                </label>
                <input
                  type="text"
                  value={loteNombre}
                  onChange={(e) => setLoteNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Número de Lote:
                </label>
                <input
                  type="text"
                  value={loteNumero}
                  onChange={(e) => setLoteNumero(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tres Cotas */}
            <div className="grid grid-cols-3 gap-2.5 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/60">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Frente (x1) m:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={x1}
                  onChange={(e) => setX1(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Fondo (x2) m:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={x2}
                  onChange={(e) => setX2(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Lateral (y1) m:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={y1}
                  onChange={(e) => setY1(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sky-400 font-mono font-bold"
                />
              </div>

              <div className="col-span-3 text-center pt-1 text-[11px] text-slate-300">
                Área Resultante: <strong className="text-emerald-400 font-mono">{medidasCalculadas.areaM2.toLocaleString()} m²</strong> ({medidasCalculadas.varasCuadradas.toLocaleString()} v²)
              </div>
            </div>
          </div>

          {/* Seccion: Condiciones del Financiamiento Hipotecario */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1.5">
              3. Financiamiento y Tabla de Amortización
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Precio Total ($):
                </label>
                <input
                  type="number"
                  value={precioTotal}
                  onChange={(e) => setPrecioTotal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Enganche ($):
                </label>
                <input
                  type="number"
                  value={enganche}
                  onChange={(e) => setEnganche(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Plazo (Meses):
                </label>
                <select
                  value={plazoMeses}
                  onChange={(e) => setPlazoMeses(parseInt(e.target.value) || 12)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                >
                  <option value={12}>12 Meses</option>
                  <option value={24}>24 Meses</option>
                  <option value={36}>36 Meses</option>
                  <option value={48}>48 Meses</option>
                  <option value={60}>60 Meses</option>
                  <option value={84}>84 Meses</option>
                  <option value={120}>120 Meses</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Tasa Anual (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={tasaInteresAnual}
                  onChange={(e) => setTasaInteresAnual(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            {/* Resumen de cuota generada */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Cuota Mensual Resultante:</span>
                <span className="text-lg font-mono font-extrabold text-emerald-400">
                  {formatMoneda(cuotaMensual)}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-300">
                <span>Capital a Financiar: <strong className="text-white font-mono">{formatMoneda(montoFinanciado)}</strong></span>
                <span className="block text-[10px] text-slate-400">Se generarán {plazoMeses} cuotas de amortización</span>
              </div>
            </div>
          </div>

          {/* Seccion 4: Bóveda de Documentos Legales */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>📁</span>
                <span>4. Bóveda de Documentos Legales (Opcional o al Contratar)</span>
              </h4>
              <span className="text-[10px] text-slate-400">PDFs o fotos de DUI, Promesa y Escritura</span>
            </div>

            {/* Alerta de procesamiento */}
            {procesandoArchivo && (
              <div className="p-2.5 bg-sky-950/60 border border-sky-500/40 rounded-xl flex items-center gap-2 text-xs text-sky-300 animate-pulse">
                <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0"></span>
                <span>Optimizando documento para evitar consumo de memoria...</span>
              </div>
            )}

            {/* Alerta de error */}
            {errorArchivo && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs text-rose-300">
                <span>⚠️ {errorArchivo}</span>
                <button
                  type="button"
                  onClick={() => setErrorArchivo(null)}
                  className="text-rose-400 hover:text-white font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Copia DUI */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <span>🪪</span> Copia de DUI
                    </span>
                    {docDui ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ✓ Adjuntado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Pendiente</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                    {docDui ? docDui.nombreArchivo : 'Identificación oficial'}
                  </p>
                </div>
                <label className="cursor-pointer text-center text-xs py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium transition-colors block border border-slate-700">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleSubirArchivo(e, 'dui')}
                  />
                  {docDui ? 'Cambiar DUI ↺' : 'Subir Copia DUI +'}
                </label>
              </div>

              {/* Promesa de Venta */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <span>📝</span> Promesa de Venta
                    </span>
                    {docPromesa ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ✓ Adjuntado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Pendiente</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                    {docPromesa ? docPromesa.nombreArchivo : 'Contrato inicial'}
                  </p>
                </div>
                <label className="cursor-pointer text-center text-xs py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition-colors block border border-slate-700">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleSubirArchivo(e, 'promesa')}
                  />
                  {docPromesa ? 'Cambiar Promesa ↺' : 'Subir Promesa +'}
                </label>
              </div>

              {/* Escritura de Compra Venta */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <span>🏛️</span> Escritura Compraventa
                    </span>
                    {docEscritura ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ✓ Adjuntado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Al liquidar</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                    {docEscritura ? docEscritura.nombreArchivo : 'Copia al finalizar'}
                  </p>
                </div>
                <label className="cursor-pointer text-center text-xs py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium transition-colors block border border-slate-700">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleSubirArchivo(e, 'escritura')}
                  />
                  {docEscritura ? 'Cambiar Escritura ↺' : 'Subir Escritura +'}
                </label>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              Guardar Comprador y Generar Hipoteca
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
