import { AmortizacionItem, ClienteComprador, PagoRealizado } from '../types';

interface AplicarPagosHistoricosConfig {
  cliente: ClienteComprador;
  prima?: number;
  cuotaMensual: number;
  plazoMeses: number;
  fechaPrimeraCuota: string;
  cuotasPagadas: number;
  tasaInteresAnual?: number;
  precioTotal?: number;
  metodo?: PagoRealizado['metodo'];
  referenciaPrefijo?: string;
}

function fechaCuotaHistorica(fechaPrimeraCuota: string, mes: number): string {
  const primera = new Date(`${fechaPrimeraCuota}T12:00:00.000Z`);
  if (isNaN(primera.getTime())) {
    throw new Error('Fecha de primera cuota invalida.');
  }

  if (mes === 1) return fechaPrimeraCuota;

  const fecha = new Date(Date.UTC(
    primera.getUTCFullYear(),
    primera.getUTCMonth(),
    25
  ));
  fecha.setUTCMonth(fecha.getUTCMonth() + (mes - 1));
  return fecha.toISOString().split('T')[0];
}

export function aplicarPagosHistoricos(config: AplicarPagosHistoricosConfig): ClienteComprador {
  const cuotaMensual = Math.max(0, Number(config.cuotaMensual) || 0);
  const plazoMeses = Math.max(1, Math.min(600, Math.round(Number(config.plazoMeses) || 1)));
  const cuotasPagadas = Math.max(0, Math.min(plazoMeses, Math.round(Number(config.cuotasPagadas) || 0)));
  const prima = Math.max(0, Number(config.prima ?? config.cliente.enganche) || 0);
  const montoFinanciado = Math.round((cuotaMensual * plazoMeses) * 100) / 100;
  const precioTotal = Math.max(prima + montoFinanciado, Number(config.precioTotal) || 0);
  const metodo = config.metodo || 'efectivo';
  const referenciaPrefijo = config.referenciaPrefijo || 'PAGO-CUOTA';

  const amortizacion: AmortizacionItem[] = Array.from({ length: plazoMeses }, (_, index) => {
    const mes = index + 1;
    const saldoInicial = Math.max(0, Math.round((montoFinanciado - (index * cuotaMensual)) * 100) / 100);
    const saldoFinal = Math.max(0, Math.round((saldoInicial - cuotaMensual) * 100) / 100);
    const fecha = fechaCuotaHistorica(config.fechaPrimeraCuota, mes);
    const pagado = mes <= cuotasPagadas;

    return {
      mes,
      fechaVencimiento: fecha,
      saldoInicial,
      cuota: cuotaMensual,
      capital: cuotaMensual,
      interes: 0,
      saldoFinal,
      estado: pagado ? 'pagado' : 'pendiente',
      ...(pagado ? {
        fechaPago: `${fecha}T12:00:00.000Z`,
        reciboId: `${config.cliente.id}-${String(mes).padStart(5, '0')}`,
        metodoPago: metodo
      } : {})
    };
  });

  const pagos: PagoRealizado[] = amortizacion
    .filter(item => item.estado === 'pagado')
    .map<PagoRealizado>(item => ({
      id: `pago-${config.cliente.id}-${String(item.mes).padStart(3, '0')}`,
      reciboNumero: item.reciboId || `${config.cliente.id}-${String(item.mes).padStart(5, '0')}`,
      clienteId: config.cliente.id,
      clienteNombre: config.cliente.nombre,
      clienteEmail: config.cliente.email,
      clienteTelefono: config.cliente.telefono,
      mesNumero: item.mes,
      montoTotal: cuotaMensual,
      abonoCapital: cuotaMensual,
      abonoInteres: 0,
      saldoRestante: item.saldoFinal,
      fechaPago: item.fechaPago || `${item.fechaVencimiento}T12:00:00.000Z`,
      metodo,
      referencia: `${referenciaPrefijo}-${String(item.mes).padStart(2, '0')}`,
      enviadoPorEmail: false,
      emailDestino: config.cliente.email,
      loteNombre: config.cliente.loteNombre,
      medidasTexto: `x1: ${config.cliente.medidas.x1}m, x2: ${config.cliente.medidas.x2}m, y1: ${config.cliente.medidas.y1}m (${config.cliente.medidas.areaM2} m2)`,
      tipoPago: 'cuota_normal'
    }))
    .reverse();

  return {
    ...config.cliente,
    enganche: prima,
    enganchePorcentaje: precioTotal > 0 ? Math.round((prima / precioTotal) * 10000) / 100 : 0,
    precioTotal,
    montoFinanciado,
    plazoMeses,
    tasaInteresAnual: Number(config.tasaInteresAnual ?? 0) || 0,
    cuotaMensual,
    fechaInicio: config.fechaPrimeraCuota,
    amortizacion,
    pagos,
    estado: amortizacion.every(item => item.estado === 'pagado') ? 'liquidado' : 'activo',
    actualizadoEn: new Date().toISOString()
  };
}
