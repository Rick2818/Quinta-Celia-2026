import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ClienteComprador, PagoRealizado, AmortizacionItem } from '../types';
import { formatMoneda, generarNumeroRecibo } from '../utils/calculos';
import { Sparkles, Clock, DollarSign } from 'lucide-react';

interface RegistroPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteComprador;
  mesSugerido?: number;
  tipoPagoInicial?: 'cuota' | 'capital';
  totalPagosHistoricos: number;
  onGuardarPago: (nuevoPago: PagoRealizado, clienteActualizado: ClienteComprador) => void;
  monedaSimbolo?: string;
}

export const RegistroPagoModal: React.FC<RegistroPagoModalProps> = ({
  isOpen,
  onClose,
  cliente,
  mesSugerido,
  tipoPagoInicial = 'cuota',
  totalPagosHistoricos,
  onGuardarPago,
  monedaSimbolo = '$',
}) => {
  const [tipoPagoModo, setTipoPagoModo] = useState<'cuota' | 'capital'>(tipoPagoInicial);

  const cuotasPagadas = (cliente.amortizacion || []).filter(item => item.estado === 'pagado');
  const primerMesPendiente = (cliente.amortizacion || []).find(item => item.estado !== 'pagado')?.mes || 1;
  const mesInicial = mesSugerido || primerMesPendiente;

  const itemInicial = (cliente.amortizacion || []).find(item => item.mes === mesInicial);
  const saldoInsolutoActual = cuotasPagadas.length > 0
    ? cuotasPagadas[cuotasPagadas.length - 1].saldoFinal
    : cliente.montoFinanciado;

  // Campos 100% manuales: el sistema NO calcula cuota, tasa ni plazo.
  const [mesPagoManual, setMesPagoManual] = useState<number>(mesInicial);
  const [plazoMesesManual, setPlazoMesesManual] = useState<number>(cliente.plazoMeses || 0);

  // El selector de cuota respeta el plazo pactado en la Promesa de Venta.
  // Nunca muestra más de 120 cuotas.
  const maxCuotasContrato = Math.min(120, Math.max(1, Number(cliente.plazoMeses) || 120));
  const opcionesCuota = Array.from({ length: maxCuotasContrato }, (_, i) => i + 1);
  const [cuotaManual, setCuotaManual] = useState<number>(itemInicial?.cuota ?? cliente.cuotaMensual ?? 0);
  const [tasaInteresManual, setTasaInteresManual] = useState<number>(cliente.tasaInteresAnual ?? 0);
  const [abonoCapitalManual, setAbonoCapitalManual] = useState<number>(itemInicial?.capital ?? 0);
  const [abonoInteresManual, setAbonoInteresManual] = useState<number>(itemInicial?.interes ?? 0);
  const [saldoRestanteManual, setSaldoRestanteManual] = useState<number>(itemInicial?.saldoFinal ?? saldoInsolutoActual);

  const [montoAbonoCapital, setMontoAbonoCapital] = useState<number>(0);
  const [saldoDespuesAbono, setSaldoDespuesAbono] = useState<number>(saldoInsolutoActual);

  const [fechaPago, setFechaPago] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState<'transferencia' | 'efectivo' | 'tarjeta' | 'deposito'>('transferencia');
  const [referencia, setReferencia] = useState('');
  const [emailNotif, setEmailNotif] = useState(cliente.email || '');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setTipoPagoModo(tipoPagoInicial);
    setMesPagoManual(mesInicial);
    setPlazoMesesManual(cliente.plazoMeses || 0);
    setCuotaManual(itemInicial?.cuota ?? cliente.cuotaMensual ?? 0);
    setTasaInteresManual(cliente.tasaInteresAnual ?? 0);
    setAbonoCapitalManual(itemInicial?.capital ?? 0);
    setAbonoInteresManual(itemInicial?.interes ?? 0);
    setSaldoRestanteManual(itemInicial?.saldoFinal ?? saldoInsolutoActual);
    setMontoAbonoCapital(0);
    setSaldoDespuesAbono(saldoInsolutoActual);
    setFechaPago(new Date().toISOString().split('T')[0]);
    setMetodo('transferencia');
    setReferencia('');
    setEmailNotif(cliente.email || '');
    setGuardando(false);
  }, [isOpen, cliente.id, mesInicial, tipoPagoInicial]);

  const celebrar = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#059669', '#38bdf8']
      });
    } catch {
      // Sin bloqueo si el efecto visual no está disponible.
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const reciboNumero = generarNumeroRecibo(totalPagosHistoricos + 1);
    const fechaIso = new Date(fechaPago).toISOString();

    if (tipoPagoModo === 'capital') {
      const nuevoPago: PagoRealizado = {
        id: `pago-${Date.now()}`,
        reciboNumero,
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        clienteEmail: emailNotif,
        clienteTelefono: cliente.telefono,
        mesNumero: mesPagoManual || 0,
        montoTotal: Number(montoAbonoCapital) || 0,
        abonoCapital: Number(montoAbonoCapital) || 0,
        abonoInteres: 0,
        saldoRestante: Number(saldoDespuesAbono) || 0,
        fechaPago: fechaIso,
        metodo,
        referencia: referencia.trim() || 'ABONO-CAPITAL',
        enviadoPorEmail: false,
        emailDestino: emailNotif,
        loteNombre: cliente.loteNombre,
        medidasTexto: `x1: ${cliente.medidas.x1}m, x2: ${cliente.medidas.x2}m, y1: ${cliente.medidas.y1}m (${cliente.medidas.areaM2} m²)`,
        tipoPago: 'abono_capital_extra'
      };

      const clienteActualizado: ClienteComprador = {
        ...cliente,
        email: emailNotif,
        cuotaMensual: Number(cuotaManual) || 0,
        tasaInteresAnual: Number(tasaInteresManual) || 0,
        plazoMeses: Number(plazoMesesManual) || 0,
        pagos: [nuevoPago, ...(cliente.pagos || [])],
        estado: (Number(saldoDespuesAbono) || 0) <= 0 ? 'liquidado' : cliente.estado,
        actualizadoEn: new Date().toISOString()
      };

      celebrar();
      setGuardando(false);
      onGuardarPago(nuevoPago, clienteActualizado);
      onClose();
      return;
    }

    const nuevoPago: PagoRealizado = {
      id: `pago-${Date.now()}`,
      reciboNumero,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      clienteEmail: emailNotif,
      clienteTelefono: cliente.telefono,
      mesNumero: Number(mesPagoManual) || 0,
      montoTotal: Number(cuotaManual) || 0,
      abonoCapital: Number(abonoCapitalManual) || 0,
      abonoInteres: Number(abonoInteresManual) || 0,
      saldoRestante: Number(saldoRestanteManual) || 0,
      fechaPago: fechaIso,
      metodo,
      referencia: referencia.trim() || `PAGO-CUOTA-${mesPagoManual}`,
      enviadoPorEmail: false,
      emailDestino: emailNotif,
      loteNombre: cliente.loteNombre,
      medidasTexto: `x1: ${cliente.medidas.x1}m, x2: ${cliente.medidas.x2}m, y1: ${cliente.medidas.y1}m (${cliente.medidas.areaM2} m²)`,
      tipoPago: 'cuota_normal'
    };

    let encontroMes = false;
    const nuevaAmortizacion = (cliente.amortizacion || []).map(cuota => {
      if (cuota.mes === Number(mesPagoManual)) {
        encontroMes = true;
        return {
          ...cuota,
          cuota: Number(cuotaManual) || 0,
          capital: Number(abonoCapitalManual) || 0,
          interes: Number(abonoInteresManual) || 0,
          saldoFinal: Number(saldoRestanteManual) || 0,
          estado: 'pagado' as const,
          fechaPago: fechaIso,
          reciboId: reciboNumero,
          metodoPago: metodo
        };
      }
      return cuota;
    });

    if (!encontroMes && Number(mesPagoManual) > 0) {
      const cuotaManualNueva: AmortizacionItem = {
        mes: Number(mesPagoManual),
        fechaVencimiento: fechaPago,
        saldoInicial: saldoInsolutoActual,
        cuota: Number(cuotaManual) || 0,
        capital: Number(abonoCapitalManual) || 0,
        interes: Number(abonoInteresManual) || 0,
        saldoFinal: Number(saldoRestanteManual) || 0,
        estado: 'pagado',
        fechaPago: fechaIso,
        reciboId: reciboNumero,
        metodoPago: metodo
      };
      nuevaAmortizacion.push(cuotaManualNueva);
      nuevaAmortizacion.sort((a, b) => a.mes - b.mes);
    }

    const clienteActualizado: ClienteComprador = {
      ...cliente,
      email: emailNotif,
      cuotaMensual: Number(cuotaManual) || 0,
      tasaInteresAnual: Number(tasaInteresManual) || 0,
      plazoMeses: Number(plazoMesesManual) || 0,
      amortizacion: nuevaAmortizacion,
      pagos: [nuevoPago, ...(cliente.pagos || [])],
      estado: (Number(saldoRestanteManual) || 0) <= 0 ? 'liquidado' : 'activo',
      actualizadoEn: new Date().toISOString()
    };

    celebrar();
    setGuardando(false);
    onGuardarPago(nuevoPago, clienteActualizado);
    onClose();
  };

  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">

        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base">Registrar Pago & Abonos</h3>
              <p className="text-xs text-slate-400">{cliente.nombre} • {cliente.loteNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTipoPagoModo('cuota')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${tipoPagoModo === 'cuota' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Clock className="w-4 h-4" />
              Registrar Cuota
            </button>
            <button
              type="button"
              onClick={() => setTipoPagoModo('capital')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${tipoPagoModo === 'capital' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Sparkles className="w-4 h-4" />
              Abono Extra a Capital
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          <div className="bg-sky-950/25 border border-sky-500/30 rounded-2xl p-4">
            <div className="mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">Datos financieros manuales</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Estos valores no son calculados por el sistema. Podés escribir la cuota, tasa y plazo que correspondan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Cuota ({monedaSimbolo}):</label>
                <input
                  type="number"
                  step="0.01"
                  value={cuotaManual}
                  onChange={(e) => setCuotaManual(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Tasa de interés (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={tasaInteresManual}
                  onChange={(e) => setTasaInteresManual(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">Plazo / número de meses:</label>
                <input
                  type="number"
                  step="1"
                  value={plazoMesesManual}
                  onChange={(e) => setPlazoMesesManual(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {tipoPagoModo === 'cuota' ? (
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300">Datos de esta cuota — todos editables</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Cuota pagada:</label>
                  <select
                    value={mesPagoManual}
                    onChange={(e) => setMesPagoManual(Number(e.target.value))}
                    className={inputClass}
                  >
                    {opcionesCuota.map((n) => (
                      <option key={n} value={n}>
                        Cuota {n}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Contrato: {maxCuotasContrato} cuotas máximas según la Promesa de Venta.
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Saldo restante ({monedaSimbolo}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saldoRestanteManual}
                    onChange={(e) => setSaldoRestanteManual(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Abono a capital ({monedaSimbolo}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={abonoCapitalManual}
                    onChange={(e) => setAbonoCapitalManual(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Abono a intereses ({monedaSimbolo}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={abonoInteresManual}
                    onChange={(e) => setAbonoInteresManual(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/20 rounded-2xl p-4 border border-amber-500/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-300">Abono a capital — ingreso manual</h4>
              <p className="text-[11px] text-slate-400">
                El sistema no recalcula automáticamente la cuota, la tasa ni el número de meses.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Monto del abono ({monedaSimbolo}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoAbonoCapital}
                    onChange={(e) => setMontoAbonoCapital(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Saldo restante después del abono ({monedaSimbolo}):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saldoDespuesAbono}
                    onChange={(e) => setSaldoDespuesAbono(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Fecha del Pago Realizado:</label>
              <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Método de Pago:</label>
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
                    className={`py-2 px-2.5 rounded-xl font-medium text-center border cursor-pointer ${metodo === m.id ? 'bg-emerald-600 text-white border-emerald-500 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">N° de Referencia / Comprobante Bancario:</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Escribí la referencia que corresponda"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email del Cliente para Enviar el Recibo:</label>
              <input
                type="email"
                value={emailNotif}
                onChange={(e) => setEmailNotif(e.target.value)}
                placeholder="cliente@correo.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg cursor-pointer ${tipoPagoModo === 'capital' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'}`}
            >
              {tipoPagoModo === 'capital' ? 'Guardar Abono Manual' : 'Guardar Pago Manual'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
