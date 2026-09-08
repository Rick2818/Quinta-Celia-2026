import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ClienteComprador, PagoRealizado, AmortizacionItem } from '../types';
import { 
  formatMoneda, 
  generarNumeroRecibo, 
  aplicarAbonoCapital, 
  calcularCuotaMensual 
} from '../utils/calculos';
import { Sparkles, TrendingDown, Clock, ShieldAlert, DollarSign } from 'lucide-react';

interface RegistroPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteComprador;
  mesSugerido?: number;
  totalPagosHistoricos: number;
  onGuardarPago: (nuevoPago: PagoRealizado, clienteActualizado: ClienteComprador) => void;
  monedaSimbolo?: string;
}

export const RegistroPagoModal: React.FC<RegistroPagoModalProps> = ({
  isOpen,
  onClose,
  cliente,
  mesSugerido,
  totalPagosHistoricos,
  onGuardarPago,
  monedaSimbolo = '$',
}) => {
  if (!isOpen) return null;

  // Modo de pago: Cuota normal vs Abono a capital
  const [tipoPagoModo, setTipoPagoModo] = useState<'cuota' | 'capital'>('cuota');

  // Encontrar el primer mes pendiente si no se proporcionó uno
  const cuotasPagadas = (cliente.amortizacion || []).filter(item => item.estado === 'pagado');
  const primerMesPendiente = (cliente.amortizacion || []).find(item => item.estado !== 'pagado')?.mes || 1;
  const mesSeleccionado = mesSugerido || primerMesPendiente;

  const itemCuota = (cliente.amortizacion || []).find(item => item.mes === mesSeleccionado) || {
    mes: mesSeleccionado,
    fechaVencimiento: new Date().toISOString().split('T')[0],
    saldoInicial: cliente.montoFinanciado,
    cuota: cliente.cuotaMensual,
    capital: cliente.cuotaMensual * 0.7,
    interes: cliente.cuotaMensual * 0.3,
    saldoFinal: Math.max(0, cliente.montoFinanciado - (cliente.cuotaMensual * 0.7)),
    estado: 'pendiente' as const,
    diasAtraso: 0,
    montoMora: 0
  };

  const saldoInsolutoActual = cuotasPagadas.length > 0 
    ? cuotasPagadas[cuotasPagadas.length - 1].saldoFinal 
    : cliente.montoFinanciado;

  // Estados generales de pago
  const [fechaPago, setFechaPago] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState<'transferencia' | 'efectivo' | 'tarjeta' | 'deposito'>('transferencia');
  const [referencia, setReferencia] = useState('');
  const [emailNotif, setEmailNotif] = useState(cliente.email || '');
  const [guardando, setGuardando] = useState(false);

  // Estados específicos para cuota y mora
  const [aplicarMora, setAplicarMora] = useState((itemCuota.montoMora || 0) > 0);
  const [montoMoraPersonalizado, setMontoMoraPersonalizado] = useState<number>(itemCuota.montoMora || 0);

  // Estados específicos para abono a capital
  const [montoAbonoCapital, setMontoAbonoCapital] = useState<number>(Math.min(1000, saldoInsolutoActual));
  const [efectoAbono, setEfectoAbono] = useState<'reducir_plazo' | 'reducir_cuota'>('reducir_plazo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    if (tipoPagoModo === 'capital') {
      // Abono Extraordinario a Capital
      const resultado = aplicarAbonoCapital(
        cliente,
        montoAbonoCapital,
        efectoAbono,
        fechaPago,
        metodo,
        referencia
      );

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#10b981', '#fbbf24', '#3b82f6', '#ec4899']
        });
      } catch {
        // Ignorar si confetti falla
      }

      setGuardando(false);
      onGuardarPago(resultado.nuevoPago, resultado.clienteActualizado);
      onClose();
      return;
    }

    // Pago de Cuota Normal
    const reciboNumero = generarNumeroRecibo(totalPagosHistoricos + 1);
    const moraEfectiva = aplicarMora ? Number(montoMoraPersonalizado) || 0 : 0;
    const montoTotalPago = itemCuota.cuota + moraEfectiva;

    const nuevoPago: PagoRealizado = {
      id: `pago-${Date.now()}`,
      reciboNumero,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      clienteEmail: emailNotif,
      clienteTelefono: cliente.telefono,
      mesNumero: itemCuota.mes,
      montoTotal: montoTotalPago,
      abonoCapital: itemCuota.capital,
      abonoInteres: itemCuota.interes,
      saldoRestante: itemCuota.saldoFinal,
      fechaPago: new Date(fechaPago).toISOString(),
      metodo,
      referencia: referencia.trim() || `PAGO-CUOTA-${itemCuota.mes}`,
      enviadoPorEmail: false,
      emailDestino: emailNotif,
      loteNombre: cliente.loteNombre,
      medidasTexto: `x1: ${cliente.medidas.x1}m, x2: ${cliente.medidas.x2}m, y1: ${cliente.medidas.y1}m (${cliente.medidas.areaM2} m²)`,
      tipoPago: 'cuota_normal',
      diasMora: itemCuota.diasAtraso || 0,
      recargoMora: moraEfectiva
    };

    // Actualizar amortización del cliente
    const nuevaAmortizacion = (cliente.amortizacion || []).map(cuota => {
      if (cuota.mes === itemCuota.mes) {
        return {
          ...cuota,
          estado: 'pagado' as const,
          fechaPago: nuevoPago.fechaPago,
          reciboId: reciboNumero,
          metodoPago: metodo,
          montoMora: moraEfectiva
        };
      }
      return cuota;
    });

    // Verificar si ya se pagó todo
    const todosPagados = nuevaAmortizacion.every(c => c.estado === 'pagado');

    const clienteActualizado: ClienteComprador = {
      ...cliente,
      email: emailNotif,
      amortizacion: nuevaAmortizacion,
      pagos: [nuevoPago, ...(cliente.pagos || [])],
      estado: todosPagados ? 'liquidado' : 'activo',
      actualizadoEn: new Date().toISOString()
    };

    // Efecto de celebración
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#059669', '#38bdf8']
      });
    } catch {
      // Ignorar si confetti falla
    }

    setGuardando(false);
    onGuardarPago(nuevoPago, clienteActualizado);
    onClose();
  };

  // Cálculo en vivo para proyección de abono a capital
  const nuevoSaldoProyectado = Math.max(0, saldoInsolutoActual - montoAbonoCapital);
  const cuotasPendientesCount = (cliente.amortizacion || []).filter(c => c.estado !== 'pagado').length;
  const nuevaCuotaEstimada = calcularCuotaMensual(nuevoSaldoProyectado, cliente.tasaInteresAnual, cuotasPendientesCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base">
                Registrar Pago & Abonos
              </h3>
              <p className="text-xs text-slate-400">
                {cliente.nombre} • {cliente.loteNombre}
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

        {/* Selector de Tipo de Pago: Cuota vs Abono a Capital */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTipoPagoModo('cuota')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tipoPagoModo === 'cuota'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              Cuota Mes #{itemCuota.mes}
            </button>

            <button
              type="button"
              onClick={() => setTipoPagoModo('capital')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                tipoPagoModo === 'capital'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Abono Extra a Capital
            </button>
          </div>
        </div>

        {/* Breakdown Card */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {tipoPagoModo === 'cuota' ? (
            /* VISTA DE PAGO DE CUOTA NORMAL */
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-700/50">
                <span className="text-xs text-slate-300 font-medium">Cuota Mensual Fija:</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {formatMoneda(itemCuota.cuota, monedaSimbolo)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/40">
                  <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Abono a Capital:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatMoneda(itemCuota.capital, monedaSimbolo)}
                  </span>
                </div>

                <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/40">
                  <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Abono a Intereses:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatMoneda(itemCuota.interes, monedaSimbolo)}
                  </span>
                </div>
              </div>

              {/* Detección y Alerta de Mora */}
              {(itemCuota.diasAtraso || 0) > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Cuota vencida por {itemCuota.diasAtraso} días</span>
                  </div>
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-1">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={aplicarMora}
                        onChange={(e) => setAplicarMora(e.target.checked)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      Aplicar Recargo por Mora:
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!aplicarMora}
                      value={montoMoraPersonalizado}
                      onChange={(e) => setMontoMoraPersonalizado(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right font-mono text-xs text-rose-300 disabled:opacity-50"
                    />
                  </label>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Saldo insoluto restante:</span>
                <span className="font-mono text-white font-semibold">{formatMoneda(itemCuota.saldoFinal, monedaSimbolo)}</span>
              </div>
            </div>
          ) : (
            /* VISTA DE ABONO EXTRAORDINARIO A CAPITAL */
            <div className="bg-amber-950/20 rounded-2xl p-4 border border-amber-500/40 space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-amber-500/30">
                <span className="text-xs text-amber-300 font-medium">Saldo Insoluto Actual:</span>
                <span className="text-base font-mono font-bold text-white">
                  {formatMoneda(saldoInsolutoActual, monedaSimbolo)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Monto del Abono a Capital ({monedaSimbolo}):
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={saldoInsolutoActual}
                  value={montoAbonoCapital}
                  onChange={(e) => setMontoAbonoCapital(Math.min(saldoInsolutoActual, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />

                {/* Accesos directos de montos */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[500, 1000, 2000, 5000].map(val => (
                    val <= saldoInsolutoActual && (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMontoAbonoCapital(val)}
                        className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
                      >
                        +{formatMoneda(val, monedaSimbolo)}
                      </button>
                    )
                  ))}
                  <button
                    type="button"
                    onClick={() => setMontoAbonoCapital(saldoInsolutoActual)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold cursor-pointer"
                  >
                    Liquidar Todo
                  </button>
                </div>
              </div>

              {/* Selector de Efecto del Abono */}
              <div className="pt-2 border-t border-amber-500/30 space-y-2">
                <span className="text-xs font-semibold text-slate-200 block">
                  ¿Cómo aplicar el beneficio de este abono?
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      efectoAbono === 'reducir_plazo'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="efecto"
                      value="reducir_plazo"
                      checked={efectoAbono === 'reducir_plazo'}
                      onChange={() => setEfectoAbono('reducir_plazo')}
                      className="hidden"
                    />
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                      <TrendingDown className="w-4 h-4" />
                      Reducir Plazo
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Mantiene cuota ({formatMoneda(cliente.cuotaMensual, monedaSimbolo)}) y termina de pagar meses antes ahorrando intereses.
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      efectoAbono === 'reducir_cuota'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="efecto"
                      value="reducir_cuota"
                      checked={efectoAbono === 'reducir_cuota'}
                      onChange={() => setEfectoAbono('reducir_cuota')}
                      className="hidden"
                    />
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                      <Sparkles className="w-4 h-4" />
                      Reducir Cuota
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Mantiene los {cuotasPendientesCount} meses restantes pero baja la cuota mensual a aprox. {formatMoneda(nuevaCuotaEstimada, monedaSimbolo)}.
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-300 pt-1">
                <span>Nuevo Saldo Restante:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {formatMoneda(nuevoSaldoProyectado, monedaSimbolo)}
                </span>
              </div>
            </div>
          )}

          {/* Form Fields Generales */}
          <div className="space-y-3 text-xs">
            
            {/* Fecha */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Fecha del Pago Realizado:
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Método de Pago:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'transferencia', label: 'Transferencia' },
                  { id: 'deposito', label: 'Depósito' },
                  { id: 'efectivo', label: 'Efectivo' },
                  { id: 'tarjeta', label: 'Tarjeta' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodo(m.id as any)}
                    className={`py-2 px-2.5 rounded-xl font-medium text-center border transition-all cursor-pointer ${
                      metodo === m.id
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Referencia o Comprobante */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                N° de Referencia / Comprobante Bancario:
              </label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder={tipoPagoModo === 'capital' ? 'Ej: ABONO-CAPITAL-BANRURAL' : 'Ej: TRF-774921 / Boleto Banrural'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Email del cliente para despacho de recibo */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email del Cliente para Enviar el Recibo Oficial:
              </label>
              <input
                type="email"
                value={emailNotif}
                onChange={(e) => setEmailNotif(e.target.value)}
                required
                placeholder="cliente@correo.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Al confirmar el pago se abrirá de inmediato el recibo oficial con opción de despacho al correo configurado.
              </p>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
                tipoPagoModo === 'capital'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {tipoPagoModo === 'capital' ? 'Aplicar Abono a Capital' : 'Confirmar y Generar Recibo'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

