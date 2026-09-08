import { 
  MedidasTerreno, 
  AmortizacionItem, 
  ClienteComprador, 
  PagoRealizado, 
  BackupData, 
  SistemaConfig 
} from '../types';

/**
 * Calcula las medidas geométricas del terreno basado en x1 (frente), x2 (fondo) y y1 (profundidad)
 * Modelo trapezoidal estándar en lotificación y topografía de terrenos campestres.
 */
export function calcularMedidasTerreno(x1: number, x2: number, y1: number): MedidasTerreno {
  const safeX1 = Math.min(10000, Math.max(0.1, Number(x1) || 20));
  const safeX2 = Math.min(10000, Math.max(0.1, Number(x2) || 20));
  const safeY1 = Math.min(10000, Math.max(0.1, Number(y1) || 30));

  // Área por fórmula de trapecio: Area = ((x1 + x2) / 2) * y1
  const areaM2 = Math.round(((safeX1 + safeX2) / 2) * safeY1 * 100) / 100;
  
  // Cálculo de lados laterales usando Pitágoras si x1 != x2
  const diferenciaSemibases = Math.abs(safeX2 - safeX1) / 2;
  const ladoInclinado = Math.sqrt(Math.pow(safeY1, 2) + Math.pow(diferenciaSemibases, 2));
  const perimetro = Math.round((safeX1 + safeX2 + (2 * ladoInclinado)) * 100) / 100;
  
  // Conversión habitual en Centroamérica/Latinoamérica: 1 m² = ~1.4308 varas cuadradas (v²)
  const varasCuadradas = Math.round(areaM2 * 1.430828 * 100) / 100;

  let tipoPoligono: 'regular' | 'trapezoidal' | 'irregular' = 'regular';
  if (Math.abs(safeX1 - safeX2) > 0.05) {
    tipoPoligono = 'trapezoidal';
  }

  return {
    x1: safeX1,
    x2: safeX2,
    y1: safeY1,
    areaM2,
    perimetro,
    varasCuadradas,
    tipoPoligono,
    anguloInclinacion: 2.5 // Pendiente suave campestre típica
  };
}

/**
 * Calcula la cuota mensual fija (Fórmula de amortización francesa / cuota nivelada)
 */
export function calcularCuotaMensual(monto: number, tasaAnual: number, plazoMeses: number): number {
  const safeMonto = Math.max(0, Number(monto) || 0);
  const safePlazo = Math.max(1, Math.round(Number(plazoMeses) || 1));
  const safeTasa = Math.max(0, Number(tasaAnual) || 0);

  if (safeMonto <= 0) return 0;
  
  // Si no hay intereses (0% de interés promocional Quinta Celia)
  if (safeTasa <= 0) {
    return Math.round((safeMonto / safePlazo) * 100) / 100;
  }

  const r = (safeTasa / 100) / 12; // Tasa mensual
  const n = safePlazo;
  
  const factor = Math.pow(1 + r, n);
  if (!isFinite(factor) || (factor - 1) === 0) {
    return Math.round((safeMonto / safePlazo) * 100) / 100;
  }

  const cuota = safeMonto * (r * factor) / (factor - 1);
  return isFinite(cuota) ? Math.round(cuota * 100) / 100 : 0;
}

/**
 * Genera la tabla completa de amortización mes a mes
 */
export function generarTablaAmortizacion(
  monto: number,
  tasaAnual: number,
  plazoMeses: number,
  fechaInicioStr: string
): AmortizacionItem[] {
  const tabla: AmortizacionItem[] = [];
  const safeMonto = Math.max(0, Number(monto) || 0);
  const safePlazo = Math.min(600, Math.max(1, Math.round(Number(plazoMeses) || 1)));
  const safeTasa = Math.max(0, Number(tasaAnual) || 0);

  if (safeMonto <= 0) return tabla;

  const cuota = calcularCuotaMensual(safeMonto, safeTasa, safePlazo);
  const r = (safeTasa / 100) / 12;
  
  let saldoActual = safeMonto;
  
  let fechaBase = new Date();
  if (fechaInicioStr) {
    const parsed = new Date(fechaInicioStr);
    if (!isNaN(parsed.getTime())) {
      fechaBase = parsed;
    }
  }

  for (let mes = 1; mes <= safePlazo; mes++) {
    const fechaVenc = new Date(fechaBase);
    fechaVenc.setMonth(fechaVenc.getMonth() + mes);

    const interes = safeTasa > 0 ? Math.round((saldoActual * r) * 100) / 100 : 0;
    let capital = Math.round((cuota - interes) * 100) / 100;
    
    // Ajuste en el último mes por redondeo de centavos
    if (mes === safePlazo || capital > saldoActual) {
      capital = saldoActual;
    }

    const saldoFinal = Math.max(0, Math.round((saldoActual - capital) * 100) / 100);

    const fechaVencIso = !isNaN(fechaVenc.getTime()) 
      ? fechaVenc.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];

    tabla.push({
      mes,
      fechaVencimiento: fechaVencIso,
      saldoInicial: saldoActual,
      cuota: mes === safePlazo ? Math.round((capital + interes) * 100) / 100 : cuota,
      capital,
      interes,
      saldoFinal,
      estado: 'pendiente'
    });

    saldoActual = saldoFinal;
    if (saldoActual <= 0) break;
  }

  return tabla;
}

/**
 * Formato de moneda profesional
 */
export function formatMoneda(valor: number, moneda: string = '$'): string {
  if (isNaN(valor) || !isFinite(valor)) return `${moneda} 0.00`;
  return `${moneda} ${valor.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formato de fecha estándar
 */
export function formatFecha(fechaStr?: string): string {
  if (!fechaStr) return '-';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return fechaStr;
  }
}


/**
 * Generador de número de recibo consecutivo
 */
export function generarNumeroRecibo(indice: number): string {
  const anio = new Date().getFullYear();
  const pad = String(indice).padStart(5, '0');
  return `QC-REC-${anio}-${pad}`;
}

/**
 * Generador de script SQL para Supabase
 */
export function generarSupabaseSQL(): string {
  return `-- ====================================================
-- ESQUEMA OFICIAL SUPABASE PARA QUINTA CELIA HIPOTECAS
-- ====================================================

-- 1. Tabla de Clientes y Terrenos
CREATE TABLE IF NOT EXISTS public.clientes_quinta_celia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  cedula TEXT,
  lote_nombre TEXT,
  lote_numero TEXT,
  medida_x1 NUMERIC(10,2) DEFAULT 0,
  medida_x2 NUMERIC(10,2) DEFAULT 0,
  medida_y1 NUMERIC(10,2) DEFAULT 0,
  area_m2 NUMERIC(10,2) DEFAULT 0,
  precio_total NUMERIC(14,2) NOT NULL,
  enganche NUMERIC(14,2) NOT NULL,
  monto_financiado NUMERIC(14,2) NOT NULL,
  plazo_meses INT NOT NULL,
  tasa_interes_anual NUMERIC(5,2) NOT NULL,
  cuota_mensual NUMERIC(12,2) NOT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  estado TEXT DEFAULT 'activo',
  topografo_dictamen TEXT,
  topografo_validado BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Pagos de Cuotas y Recibos
CREATE TABLE IF NOT EXISTS public.pagos_quinta_celia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recibo_numero TEXT UNIQUE NOT NULL,
  cliente_id UUID REFERENCES public.clientes_quinta_celia(id) ON DELETE CASCADE,
  mes_numero INT NOT NULL,
  monto_total NUMERIC(12,2) NOT NULL,
  abono_capital NUMERIC(12,2) NOT NULL,
  abono_interes NUMERIC(12,2) NOT NULL,
  saldo_restante NUMERIC(14,2) NOT NULL,
  fecha_pago TIMESTAMPTZ DEFAULT NOW(),
  metodo TEXT DEFAULT 'transferencia',
  referencia TEXT,
  enviado_por_email BOOLEAN DEFAULT false,
  email_destino TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad RLS
ALTER TABLE public.clientes_quinta_celia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_quinta_celia ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para acceso con anon key (lectura y escritura pública para el simulador)
CREATE POLICY "Permitir todo a anon en clientes" ON public.clientes_quinta_celia
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en pagos" ON public.pagos_quinta_celia
  FOR ALL TO anon USING (true) WITH CHECK (true);
`;
}

/**
 * Evalúa y calcula la mora y días de retraso en la tabla de amortización
 * Regla de negocio Quinta Celia: Multa por mora entre el 3% y el 5% de la cuota vencida
 */
export function actualizarMoraAmortizacion(
  cuotas: AmortizacionItem[], 
  tasaMoraMensual: number = 5.0, 
  diasGracia: number = 5
): AmortizacionItem[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Asegurar que la tasa esté entre el rango reglamentario de 3% y 5%
  const tasaEfectiva = Math.min(5.0, Math.max(3.0, Number(tasaMoraMensual) || 5.0));

  return cuotas.map(item => {
    if (item.estado === 'pagado') {
      return { ...item, diasAtraso: 0, montoMora: 0 };
    }

    const fechaVenc = new Date(item.fechaVencimiento);
    fechaVenc.setHours(0, 0, 0, 0);

    if (isNaN(fechaVenc.getTime())) {
      return item;
    }

    const diffTiempo = hoy.getTime() - fechaVenc.getTime();
    const diasDiff = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

    if (diasDiff > diasGracia) {
      // Multa oficial entre 3% y 5% sobre el valor de la cuota vencida
      const moraCalculada = Math.round((item.cuota * (tasaEfectiva / 100)) * 100) / 100;
      return {
        ...item,
        estado: 'vencido',
        diasAtraso: diasDiff,
        montoMora: Math.max(1, moraCalculada)
      };
    } else {
      return {
        ...item,
        estado: 'pendiente',
        diasAtraso: 0,
        montoMora: 0
      };
    }
  });
}


/**
 * Aplica un Abono Extraordinario directo a Capital y recalcula la amortización
 */
export function aplicarAbonoCapital(
  cliente: ClienteComprador,
  montoAbono: number,
  efecto: 'reducir_plazo' | 'reducir_cuota',
  fechaPagoStr: string,
  metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'deposito' = 'transferencia',
  referencia: string = ''
): { clienteActualizado: ClienteComprador; nuevoPago: PagoRealizado } {
  const safeAbono = Math.max(0.01, Math.round(Number(montoAbono) * 100) / 100);
  const cuotasPagadas = (cliente.amortizacion || []).filter(c => c.estado === 'pagado');
  const cuotasPendientes = (cliente.amortizacion || []).filter(c => c.estado !== 'pagado');

  const saldoActual = cuotasPagadas.length > 0 
    ? cuotasPagadas[cuotasPagadas.length - 1].saldoFinal 
    : cliente.montoFinanciado;

  const nuevoSaldo = Math.max(0, Math.round((saldoActual - safeAbono) * 100) / 100);
  const nuevoReciboNumero = generarNumeroRecibo((cliente.pagos || []).length + 1);
  const fechaEfectiva = fechaPagoStr || new Date().toISOString().split('T')[0];

  const nuevoPago: PagoRealizado = {
    id: `pago-cap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reciboNumero: nuevoReciboNumero,
    clienteId: cliente.id,
    clienteNombre: cliente.nombre,
    clienteEmail: cliente.email,
    clienteTelefono: cliente.telefono,
    mesNumero: cuotasPagadas.length + 1,
    montoTotal: safeAbono,
    abonoCapital: safeAbono,
    abonoInteres: 0,
    saldoRestante: nuevoSaldo,
    fechaPago: fechaEfectiva,
    metodo,
    referencia: referencia || `Abono Extra a Capital (${efecto === 'reducir_plazo' ? 'Reducción de Plazo' : 'Reducción de Cuota'})`,
    enviadoPorEmail: false,
    emailDestino: cliente.email || '',
    loteNombre: cliente.loteNombre,
    medidasTexto: `${cliente.medidas.x1}m x ${cliente.medidas.x2}m x ${cliente.medidas.y1}m (${cliente.medidas.areaM2} m²)`,
    tipoPago: 'abono_capital_extra',
    efectoAbono: efecto,
    diasMora: 0,
    recargoMora: 0
  };

  let nuevaAmortizacion: AmortizacionItem[] = [...cuotasPagadas];
  let nuevaCuotaMensual = cliente.cuotaMensual;
  let nuevoEstado: 'activo' | 'liquidado' | 'en_mora' = cliente.estado;

  if (nuevoSaldo <= 0) {
    // Liquidación total de la deuda
    nuevoEstado = 'liquidado';
  } else {
    // Base de fecha para las cuotas restantes
    const primerFechaFutura = cuotasPendientes[0]?.fechaVencimiento || fechaEfectiva;
    const fechaBase = new Date(primerFechaFutura);
    const r = (cliente.tasaInteresAnual / 100) / 12;

    if (efecto === 'reducir_plazo') {
      // Mantiene la cuota mensual intacta y reduce la cantidad de meses
      let saldoEnProceso = nuevoSaldo;
      let mesIndex = cuotasPagadas.length + 1;

      while (saldoEnProceso > 0 && mesIndex <= 600) {
        const fechaCuota = new Date(fechaBase);
        fechaCuota.setMonth(fechaCuota.getMonth() + (mesIndex - (cuotasPagadas.length + 1)));

        const interes = cliente.tasaInteresAnual > 0 
          ? Math.round((saldoEnProceso * r) * 100) / 100 
          : 0;
        
        let capital = Math.round((cliente.cuotaMensual - interes) * 100) / 100;
        let cuotaMes = cliente.cuotaMensual;

        if (capital >= saldoEnProceso || saldoEnProceso - capital < 0.05) {
          capital = saldoEnProceso;
          cuotaMes = Math.round((capital + interes) * 100) / 100;
        }

        const saldoFinalMes = Math.max(0, Math.round((saldoEnProceso - capital) * 100) / 100);

        nuevaAmortizacion.push({
          mes: mesIndex,
          fechaVencimiento: fechaCuota.toISOString().split('T')[0],
          saldoInicial: saldoEnProceso,
          cuota: cuotaMes,
          capital,
          interes,
          saldoFinal: saldoFinalMes,
          estado: 'pendiente'
        });

        saldoEnProceso = saldoFinalMes;
        mesIndex++;
        if (saldoEnProceso <= 0) break;
      }
    } else {
      // Reducir la cuota mensual manteniendo el número de meses pendientes restantes
      const mesesRestantes = Math.max(1, cuotasPendientes.length);
      nuevaCuotaMensual = calcularCuotaMensual(nuevoSaldo, cliente.tasaInteresAnual, mesesRestantes);

      let saldoEnProceso = nuevoSaldo;
      let mesIndex = cuotasPagadas.length + 1;

      for (let i = 0; i < mesesRestantes; i++) {
        const fechaCuota = new Date(fechaBase);
        fechaCuota.setMonth(fechaCuota.getMonth() + i);

        const interes = cliente.tasaInteresAnual > 0 
          ? Math.round((saldoEnProceso * r) * 100) / 100 
          : 0;
        
        let capital = Math.round((nuevaCuotaMensual - interes) * 100) / 100;
        let cuotaMes = nuevaCuotaMensual;

        if (i === mesesRestantes - 1 || capital > saldoEnProceso) {
          capital = saldoEnProceso;
          cuotaMes = Math.round((capital + interes) * 100) / 100;
        }

        const saldoFinalMes = Math.max(0, Math.round((saldoEnProceso - capital) * 100) / 100);

        nuevaAmortizacion.push({
          mes: mesIndex,
          fechaVencimiento: fechaCuota.toISOString().split('T')[0],
          saldoInicial: saldoEnProceso,
          cuota: cuotaMes,
          capital,
          interes,
          saldoFinal: saldoFinalMes,
          estado: 'pendiente'
        });

        saldoEnProceso = saldoFinalMes;
        mesIndex++;
        if (saldoEnProceso <= 0) break;
      }
    }
  }

  const clienteActualizado: ClienteComprador = {
    ...cliente,
    cuotaMensual: nuevaCuotaMensual,
    estado: nuevoEstado,
    amortizacion: nuevaAmortizacion,
    pagos: [nuevoPago, ...(cliente.pagos || [])],
    actualizadoEn: new Date().toISOString()
  };

  return { clienteActualizado, nuevoPago };
}

/**
 * Exporta toda la base de datos a un archivo JSON descargable
 */
export function exportarBaseDeDatosJSON(
  clientes: ClienteComprador[],
  configSistema?: SistemaConfig,
  configSupabase?: any
): void {
  const backup: BackupData = {
    version: '2.0-2026',
    fechaExportacion: new Date().toISOString(),
    sistema: 'Quinta Celia - Terrenos Ricardo Hipotecas & Cobranzas',
    clientes,
    configuracion: {
      sistema: configSistema,
      supabase: configSupabase
    }
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fechaCorta = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `quinta_celia_backup_${fechaCorta}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Valida y procesa el contenido de un archivo JSON de respaldo
 */
export function validarArchivoBackupJSON(contenidoTexto: string): BackupData {
  const data = JSON.parse(contenidoTexto);
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no contiene un formato JSON válido.');
  }
  if (!Array.isArray(data.clientes)) {
    throw new Error('El respaldo no contiene un listado de clientes válido.');
  }
  return data as BackupData;
}

/**
 * Exporta el consolidado de clientes a un archivo CSV compatible con Microsoft Excel
 */
export function exportarCarteraClientesCSV(clientes: ClienteComprador[], moneda: string = '$'): void {
  const encabezados = [
    'ID',
    'Cliente',
    'Email',
    'Teléfono',
    'Cédula',
    'Lote',
    'Área m²',
    `Precio Total (${moneda})`,
    `Enganche (${moneda})`,
    `Monto Financiado (${moneda})`,
    'Plazo Meses',
    'Tasa Anual %',
    `Cuota Mensual (${moneda})`,
    `Capital Pagado (${moneda})`,
    `Interés Pagado (${moneda})`,
    `Saldo Restante (${moneda})`,
    'Cuotas Pagadas',
    'Estado',
    'Fecha Inicio'
  ];

  const filas = clientes.map(c => {
    const amort = c.amortizacion || [];
    const pagadas = amort.filter(a => a.estado === 'pagado');
    const capPagado = pagadas.reduce((acc, a) => acc + a.capital, 0);
    const intPagado = pagadas.reduce((acc, a) => acc + a.interes, 0);
    const saldoPendiente = pagadas.length > 0 
      ? pagadas[pagadas.length - 1].saldoFinal 
      : c.montoFinanciado;

    return [
      `"${c.id}"`,
      `"${c.nombre.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.telefono.replace(/"/g, '""')}"`,
      `"${c.cedula.replace(/"/g, '""')}"`,
      `"${c.loteNombre.replace(/"/g, '""')} #${c.loteNumero}"`,
      c.medidas?.areaM2 || 0,
      c.precioTotal,
      c.enganche,
      c.montoFinanciado,
      c.plazoMeses,
      c.tasaInteresAnual,
      c.cuotaMensual,
      Math.round(capPagado * 100) / 100,
      Math.round(intPagado * 100) / 100,
      Math.round(saldoPendiente * 100) / 100,
      `${pagadas.length}/${amort.length}`,
      `"${c.estado}"`,
      `"${c.fechaInicio}"`
    ].join(';');
  });

  const csvCompleto = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n');
  const blob = new Blob([csvCompleto], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fechaCorta = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `cartera_clientes_quinta_celia_${fechaCorta}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta la tabla de amortización de un cliente a CSV
 */
export function exportarAmortizacionClienteCSV(cliente: ClienteComprador, moneda: string = '$'): void {
  const encabezados = [
    'Mes',
    'Fecha Vencimiento',
    `Saldo Inicial (${moneda})`,
    `Cuota (${moneda})`,
    `Abono Capital (${moneda})`,
    `Interés (${moneda})`,
    `Mora (${moneda})`,
    `Saldo Final (${moneda})`,
    'Estado',
    'Fecha de Pago',
    'Recibo N°'
  ];

  const filas = (cliente.amortizacion || []).map(c => [
    c.mes,
    `"${c.fechaVencimiento}"`,
    c.saldoInicial,
    c.cuota,
    c.capital,
    c.interes,
    c.montoMora || 0,
    c.saldoFinal,
    `"${c.estado}"`,
    `"${c.fechaPago || '-'}"`,
    `"${c.reciboId || '-'}"`
  ].join(';'));

  const csvCompleto = '\uFEFF' + [
    `"Estado de Cuenta y Tabla de Amortización - ${cliente.nombre} (${cliente.loteNombre})"`,
    encabezados.join(';'),
    ...filas
  ].join('\r\n');

  const blob = new Blob([csvCompleto], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const seguroNombre = cliente.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
  a.href = url;
  a.download = `amortizacion_${seguroNombre}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

