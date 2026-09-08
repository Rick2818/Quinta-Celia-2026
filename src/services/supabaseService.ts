import { ClienteComprador, PagoRealizado, SupabaseSettings } from '../types';

const STORAGE_KEY_SETTINGS = 'quinta_celia_supabase_config_v1';
const STORAGE_KEY_CLIENTES = 'quinta_celia_clientes_v1';
const STORAGE_KEY_PAGOS = 'quinta_celia_pagos_v1';

export const defaultSupabaseSettings: SupabaseSettings = {
  url: '',
  anonKey: '',
  tableNameClientes: 'clientes_quinta_celia',
  tableNamePagos: 'pagos_quinta_celia',
  conectado: false,
};

export function obtenerSupabaseConfig(): SupabaseSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer config de Supabase:', e);
  }
  return defaultSupabaseSettings;
}

export function guardarSupabaseConfig(config: SupabaseSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(config));
  } catch (e) {
    console.error('Error al guardar config de Supabase:', e);
  }
}

/**
 * Prueba la conectividad real con Supabase REST API
 */
export async function probarConexionSupabase(url: string, anonKey: string, tabla: string = 'clientes_quinta_celia'): Promise<{ exito: boolean; mensaje: string }> {
  if (!url || !anonKey) {
    return { exito: false, mensaje: 'Por favor ingresa la URL del proyecto y el Anon Public Key de Supabase.' };
  }

  const cleanUrl = url.trim().replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/rest/v1/${tabla}?select=count&limit=1`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': anonKey.trim(),
        'Authorization': `Bearer ${anonKey.trim()}`,
        'Content-Type': 'application/json',
      }
    });

    if (res.ok || res.status === 200 || res.status === 206) {
      return { exito: true, mensaje: '¡Conexión establecida con éxito con Supabase!' };
    } else if (res.status === 404) {
      return { 
        exito: false, 
        mensaje: `Supabase respondió pero la tabla "${tabla}" no existe aún. Ejecuta el Script SQL proporcionado en el editor SQL de Supabase.` 
      };
    } else {
      const errText = await res.text().catch(() => '');
      return { 
        exito: false, 
        mensaje: `Error Supabase (${res.status}): ${errText || res.statusText}` 
      };
    }
  } catch (error: any) {
    return { 
      exito: false, 
      mensaje: `Fallo de red al conectar a Supabase: ${error?.message || 'Verifica la URL'}` 
    };
  }
}

/**
 * Guarda o actualiza un cliente en Supabase si está configurado
 */
export async function guardarClienteSupabase(cliente: ClienteComprador, config: SupabaseSettings): Promise<boolean> {
  if (!config.conectado || !config.url || !config.anonKey) {
    return false; // Se guardará en local
  }

  const cleanUrl = config.url.trim().replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/rest/v1/${config.tableNameClientes || 'clientes_quinta_celia'}`;

  const payload = {
    nombre: cliente.nombre,
    email: cliente.email,
    telefono: cliente.telefono,
    direccion: cliente.direccion,
    cedula: cliente.cedula,
    lote_nombre: cliente.loteNombre,
    lote_numero: cliente.loteNumero,
    medida_x1: cliente.medidas.x1,
    medida_x2: cliente.medidas.x2,
    medida_y1: cliente.medidas.y1,
    area_m2: cliente.medidas.areaM2,
    precio_total: cliente.precioTotal,
    enganche: cliente.enganche,
    monto_financiado: cliente.montoFinanciado,
    plazo_meses: cliente.plazoMeses,
    tasa_interes_anual: cliente.tasaInteresAnual,
    cuota_mensual: cliente.cuotaMensual,
    fecha_inicio: cliente.fechaInicio,
    estado: cliente.estado,
    topografo_dictamen: cliente.topografoDictamen,
    topografo_validado: cliente.topografoValidado,
    actualizado_en: new Date().toISOString()
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey.trim(),
        'Authorization': `Bearer ${config.anonKey.trim()}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('Supabase post error, cached locally:', err);
    return false;
  }
}

/**
 * Registra pago en Supabase
 */
export async function registrarPagoSupabase(pago: PagoRealizado, config: SupabaseSettings): Promise<boolean> {
  if (!config.conectado || !config.url || !config.anonKey) return false;

  const cleanUrl = config.url.trim().replace(/\/+$/, '');
  const endpoint = `${cleanUrl}/rest/v1/${config.tableNamePagos || 'pagos_quinta_celia'}`;

  const payload = {
    recibo_numero: pago.reciboNumero,
    cliente_id: pago.clienteId,
    mes_numero: pago.mesNumero,
    monto_total: pago.montoTotal,
    abono_capital: pago.abonoCapital,
    abono_interes: pago.abonoInteres,
    saldo_restante: pago.saldoRestante,
    fecha_pago: pago.fechaPago,
    metodo: pago.metodo,
    referencia: pago.referencia,
    enviado_por_email: pago.enviadoPorEmail,
    email_destino: pago.emailDestino
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey.trim(),
        'Authorization': `Bearer ${config.anonKey.trim()}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.warn('Supabase error on payment:', e);
    return false;
  }
}

/**
 * Carga de datos local con persistencia y datos iniciales de muestra de Quinta Celia
 */
export function cargarClientesLocales(): ClienteComprador[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTES);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error('Error cargando clientes locales:', e);
  }

  // Clientes iniciales para experiencia inmediata
  return getDemoClientes();
}

export function guardarClientesLocales(clientes: ClienteComprador[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
  } catch (e) {
    console.error('Error guardando clientes:', e);
  }
}

export function cargarPagosLocales(): PagoRealizado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAGOS);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('Error cargando pagos:', e);
  }
  return [];
}

export function guardarPagosLocales(pagos: PagoRealizado[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PAGOS, JSON.stringify(pagos));
  } catch (e) {
    console.error('Error guardando pagos:', e);
  }
}

function getDemoClientes(): ClienteComprador[] {
  // Lote 14 Quinta Celia
  const m1 = {
    x1: 20.00, // frente
    x2: 24.50, // fondo
    y1: 30.00, // profundidad
    areaM2: 667.50,
    perimetro: 104.84,
    varasCuadradas: 955.08,
    tipoPoligono: 'trapezoidal' as const,
    anguloInclinacion: 2.1
  };

  const plazo1 = 36;
  const precioM2_1 = 45;
  const precioTotal1 = Math.round(m1.areaM2 * precioM2_1); // $30,037.50
  const enganche1 = 6000;
  const montoFinanciado1 = precioTotal1 - enganche1;
  const tasa1 = 9.5;
  const r1 = (tasa1 / 100) / 12;
  const cuota1 = Math.round((montoFinanciado1 * (r1 * Math.pow(1 + r1, plazo1)) / (Math.pow(1 + r1, plazo1) - 1)) * 100) / 100;

  // Generar primeras cuotas con 2 ya pagadas
  const amortizacion1 = [];
  let saldo = montoFinanciado1;
  for (let i = 1; i <= plazo1; i++) {
    const interes = Math.round((saldo * r1) * 100) / 100;
    const capital = Math.round((cuota1 - interes) * 100) / 100;
    const saldoFinal = Math.max(0, Math.round((saldo - capital) * 100) / 100);
    const pagado = i <= 2;
    amortizacion1.push({
      mes: i,
      fechaVencimiento: `2026-0${i < 10 ? '0' + i : i}-15`,
      saldoInicial: saldo,
      cuota: cuota1,
      capital,
      interes,
      saldoFinal,
      estado: pagado ? ('pagado' as const) : ('pendiente' as const),
      fechaPago: pagado ? `2026-0${i < 10 ? '0' + i : i}-12` : undefined,
      reciboId: pagado ? `QC-REC-2026-0000${i}` : undefined,
      metodoPago: pagado ? 'transferencia' : undefined
    });
    saldo = saldoFinal;
  }

  const pagosDemo: PagoRealizado[] = [
    {
      id: 'pago-demo-1',
      reciboNumero: 'QC-REC-2026-00001',
      clienteId: 'cliente-demo-1',
      clienteNombre: 'Ing. Roberto Méndez Salguero',
      clienteEmail: 'roberto.mendez@example.com',
      clienteTelefono: '+503 7845-9921',
      mesNumero: 1,
      montoTotal: cuota1,
      abonoCapital: amortizacion1[0].capital,
      abonoInteres: amortizacion1[0].interes,
      saldoRestante: amortizacion1[0].saldoFinal,
      fechaPago: '2026-01-12T10:30:00Z',
      metodo: 'transferencia',
      referencia: 'TRF-BANCO-778921',
      enviadoPorEmail: true,
      emailDestino: 'roberto.mendez@example.com',
      fechaEnvioEmail: '2026-01-12T10:32:00Z',
      loteNombre: 'Lote 14 - Mirador Los Robles',
      medidasTexto: 'Frente x1: 20.0m | Fondo x2: 24.5m | Lateral y1: 30.0m (667.50 m²)'
    },
    {
      id: 'pago-demo-2',
      reciboNumero: 'QC-REC-2026-00002',
      clienteId: 'cliente-demo-1',
      clienteNombre: 'Ing. Roberto Méndez Salguero',
      clienteEmail: 'roberto.mendez@example.com',
      clienteTelefono: '+503 7845-9921',
      mesNumero: 2,
      montoTotal: cuota1,
      abonoCapital: amortizacion1[1].capital,
      abonoInteres: amortizacion1[1].interes,
      saldoRestante: amortizacion1[1].saldoFinal,
      fechaPago: '2026-02-14T14:15:00Z',
      metodo: 'deposito',
      referencia: 'DEP-AGENCIA-44120',
      enviadoPorEmail: true,
      emailDestino: 'roberto.mendez@example.com',
      fechaEnvioEmail: '2026-02-14T14:18:00Z',
      loteNombre: 'Lote 14 - Mirador Los Robles',
      medidasTexto: 'Frente x1: 20.0m | Fondo x2: 24.5m | Lateral y1: 30.0m (667.50 m²)'
    }
  ];

  return [
    {
      id: 'cliente-demo-1',
      nombre: 'Ing. Roberto Méndez Salguero',
      email: 'roberto.mendez@example.com',
      telefono: '+503 7845-9921',
      direccion: 'Colonia Las Palmeras, Pasaje 3, Casa #18, San Salvador',
      cedula: '04892114-8',
      loteNombre: 'Lote 14 - Mirador Los Robles',
      loteNumero: '14-A',
      medidas: m1,
      topografoValidado: true,
      topografoNombre: 'Ing. Celso R. Valdivia (Topógrafo Senior 24 años exp.)',
      topografoDictamen: 'Levantamiento geodésico verificado con estación total Leica TS07. Mojones de concreto M1-M4 fundidos in-situ. Tolerancia milimétrica conforme a plano de lotificación Quinta Celia. Lote con pendiente natural del 2.1% hacia el norte, óptimo drenaje pluvial.',
      topografoFecha: '2026-01-05',
      precioM2: precioM2_1,
      precioTotal: precioTotal1,
      enganche: enganche1,
      enganchePorcentaje: 20,
      montoFinanciado: montoFinanciado1,
      plazoMeses: plazo1,
      tasaInteresAnual: tasa1,
      cuotaMensual: cuota1,
      fechaInicio: '2026-01-01',
      estado: 'activo',
      amortizacion: amortizacion1,
      pagos: pagosDemo,
      notas: 'Comprador solicitó estudio de suelo adicional para cimentación de cabaña campestre.',
      creadoEn: '2026-01-05T09:00:00Z',
      actualizadoEn: '2026-02-14T14:20:00Z'
    },
    {
      id: 'cliente-demo-2',
      nombre: 'Licda. Marcela Elena Cruz',
      email: 'marcela.cruz.abogada@gmail.com',
      telefono: '+503 7102-3349',
      direccion: 'Residencial Santa Elena, Senda Los Pinos #44, Antiguo Cuscatlán',
      cedula: '03112998-1',
      loteNombre: 'Lote 08 - Sendero El Cedro',
      loteNumero: '08-B',
      medidas: {
        x1: 18.00,
        x2: 18.00,
        y1: 28.00,
        areaM2: 504.00,
        perimetro: 92.00,
        varasCuadradas: 721.14,
        tipoPoligono: 'regular',
        anguloInclinacion: 1.8
      },
      topografoValidado: true,
      topografoNombre: 'Ing. Celso R. Valdivia (Topógrafo Senior 24 años exp.)',
      topografoDictamen: 'Plano regular rectilíneo 18.00m x 28.00m con linderos perimetrales colindantes a servidumbre ecológica. Se certifican cotas x1=18.00m, x2=18.00m, y1=28.00m para cierre de escritura.',
      topografoFecha: '2026-02-10',
      precioM2: 50,
      precioTotal: 25200,
      enganche: 5040,
      enganchePorcentaje: 20,
      montoFinanciado: 20160,
      plazoMeses: 24,
      tasaInteresAnual: 8.5,
      cuotaMensual: 916.14,
      fechaInicio: '2026-02-15',
      estado: 'activo',
      amortizacion: [],
      pagos: [],
      notas: 'Entrega de mojones programada para fin de mes.',
      creadoEn: '2026-02-10T11:00:00Z',
      actualizadoEn: '2026-02-10T11:00:00Z'
    }
  ];
}

/**
 * Carga clientes desde Supabase (o retorna null si no está conectado o falla)
 */
export async function cargarClientesDesdeSupabase(config: SupabaseSettings): Promise<ClienteComprador[] | null> {
  if (!config.conectado || !config.url || !config.anonKey) return null;

  try {
    const cleanUrl = config.url.trim().replace(/\/+$/, '');
    const endpoint = `${cleanUrl}/rest/v1/${config.tableNameClientes || 'clientes_quinta_celia'}?select=*&order=creado_en.desc`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey.trim(),
        'Authorization': `Bearer ${config.anonKey.trim()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;

    return rows.map((r: any) => ({
      id: r.id || `cli-${Date.now()}`,
      nombre: r.nombre || 'Comprador',
      email: r.email || '',
      telefono: r.telefono || '',
      direccion: r.direccion || '',
      cedula: r.cedula || '',
      loteNombre: r.lote_nombre || 'Lote Quinta Celia',
      loteNumero: r.lote_numero || '1',
      medidas: {
        x1: Number(r.medida_x1) || 20,
        x2: Number(r.medida_x2) || 20,
        y1: Number(r.medida_y1) || 25,
        areaM2: Number(r.area_m2) || 500,
        perimetro: 90,
        varasCuadradas: Math.round((Number(r.area_m2) || 500) * 1.4308),
        tipoPoligono: 'regular' as const,
        anguloInclinacion: 2
      },
      topografoValidado: r.topografo_validado ?? true,
      topografoNombre: 'Ing. Celso R. Valdivia (20+ años exp.)',
      topografoDictamen: r.topografo_dictamen || 'Medidas x1, x2 y y1 validadas.',
      topografoFecha: new Date().toISOString().split('T')[0],
      precioM2: Number(r.precio_m2) || 45,
      precioTotal: Number(r.precio_total) || 20000,
      enganche: Number(r.enganche) || 4000,
      enganchePorcentaje: 20,
      montoFinanciado: Number(r.monto_financiado) || 16000,
      plazoMeses: Number(r.plazo_meses) || 36,
      tasaInteresAnual: Number(r.tasa_interes_anual) || 9.5,
      cuotaMensual: Number(r.cuota_mensual) || 500,
      fechaInicio: r.fecha_inicio || new Date().toISOString().split('T')[0],
      estado: r.estado || 'activo',
      amortizacion: [],
      pagos: [],
      notas: '',
      creadoEn: r.creado_en || new Date().toISOString(),
      actualizadoEn: r.actualizado_en || new Date().toISOString()
    }));
  } catch (err) {
    console.warn('Error fetching from Supabase:', err);
    return null;
  }
}

export async function guardarClienteEnSupabase(config: SupabaseSettings, cliente: ClienteComprador): Promise<{ exito: boolean; mensaje?: string }> {
  const ok = await guardarClienteSupabase(cliente, config);
  return { exito: ok, mensaje: ok ? 'Guardado en Supabase' : 'Guardado local' };
}

export async function guardarPagoEnSupabase(config: SupabaseSettings, pago: PagoRealizado): Promise<{ exito: boolean }> {
  const ok = await registrarPagoSupabase(pago, config);
  return { exito: ok };
}

