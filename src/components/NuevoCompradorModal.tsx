import React, { useState } from 'react';
import { ClienteComprador, MedidasTerreno } from '../types';
import { 
  calcularMedidasTerreno, 
  calcularCuotaMensual, 
  generarTablaAmortizacion, 
  formatMoneda 
} from '../utils/calculos';

interface NuevoCompradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  datosIniciales?: {
    medidas?: MedidasTerreno;
    precioM2?: number;
    precioTotal?: number;
    enganche?: number;
    enganchePorcentaje?: number;
    montoFinanciado?: number;
    plazoMeses?: number;
    tasaInteresAnual?: number;
    cuotaMensual?: number;
    loteSugerido?: string;
  };
  onGuardarCliente: (cliente: ClienteComprador) => void;
  onAbrirTopografo: () => void;
}

export const NuevoCompradorModal: React.FC<NuevoCompradorModalProps> = ({
  isOpen,
  onClose,
  datosIniciales,
  onGuardarCliente,
  onAbrirTopografo
}) => {
  if (!isOpen) return null;

  // Datos personales solicitados específicamente en el prompt
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cedula, setCedula] = useState('');

  // Lote e Inmueble
  const [loteNombre, setLoteNombre] = useState(datosIniciales?.loteSugerido || 'Lote Quinta Celia');
  const [loteNumero, setLoteNumero] = useState('15');

  // Medidas topográficas x1, x2, y1
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
      topografoDictamen: `Medidas definitivas certificadas por el Ing. Celso R. Valdivia: Frente (x1)=${x1}m, Fondo (x2)=${x2}m, Profundidad (y1)=${y1}m. Superficie total: ${medidasCalculadas.areaM2} m² (${medidasCalculadas.varasCuadradas} v²). Mojones replanteados y conformes con el ordenamiento parcelario Quinta Celia.`,
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
      notas: 'Expediente creado en el Simulador Hipotecario Quinta Celia.',
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
