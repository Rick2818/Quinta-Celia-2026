export interface MedidasTerreno {
  x1: number; // Frente principal en metros
  x2: number; // Fondo / lindero posterior en metros
  y1: number; // Profundidad / lateral en metros
  areaM2: number;
  perimetro: number;
  varasCuadradas: number;
  tipoPoligono: 'regular' | 'trapezoidal' | 'irregular';
  anguloInclinacion?: number; // Pendiente estimada %
}

export interface AmortizacionItem {
  mes: number;
  fechaVencimiento: string;
  saldoInicial: number;
  cuota: number;
  capital: number;
  interes: number;
  saldoFinal: number;
  estado: 'pendiente' | 'pagado' | 'vencido';
  fechaPago?: string;
  reciboId?: string;
  metodoPago?: string;
  diasAtraso?: number;
  montoMora?: number;
  esAbonoCapital?: boolean;
}

export interface PagoRealizado {
  id: string;
  reciboNumero: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  mesNumero: number;
  montoTotal: number;
  abonoCapital: number;
  abonoInteres: number;
  saldoRestante: number;
  fechaPago: string;
  metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'deposito';
  referencia: string;
  enviadoPorEmail: boolean;
  emailDestino: string;
  fechaEnvioEmail?: string;
  loteNombre: string;
  medidasTexto: string;
  tipoPago?: 'cuota_normal' | 'abono_capital_extra' | 'liquidacion_total';
  efectoAbono?: 'reducir_plazo' | 'reducir_cuota';
  diasMora?: number;
  recargoMora?: number;
}

export interface ClienteComprador {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  cedula: string;
  loteNombre: string;
  loteNumero: string;
  
  // Topografía oficial validada por el agente
  medidas: MedidasTerreno;
  topografoValidado: boolean;
  topografoNombre: string;
  topografoDictamen: string;
  topografoFecha: string;

  // Condiciones de la hipoteca
  precioM2: number;
  precioTotal: number;
  enganche: number; // En valor monetario
  enganchePorcentaje: number;
  montoFinanciado: number;
  plazoMeses: number;
  tasaInteresAnual: number;
  cuotaMensual: number;
  fechaInicio: string;
  
  // Estado y registros
  estado: 'activo' | 'liquidado' | 'en_mora';
  amortizacion: AmortizacionItem[];
  pagos: PagoRealizado[];
  notas: string;

  // Bóveda de Documentos Legales (DUI, Promesa de Venta, Escritura)
  documentos?: {
    copiaDui?: DocumentoExpediente;
    promesaVenta?: DocumentoExpediente;
    escrituraCompraVenta?: DocumentoExpediente;
    otros?: DocumentoExpediente[];
  };

  creadoEn: string;
  actualizadoEn: string;
}

export interface DocumentoExpediente {
  id: string;
  tipo: 'copia_dui' | 'promesa_venta' | 'escritura_compraventa' | 'otro';
  nombreArchivo: string;
  tamanoBytes?: number;
  tipoMime?: string; // 'image/jpeg', 'image/png', 'application/pdf', etc.
  dataUrl?: string; // Base64 Data URL para visualización inmediata offline o enlace en la nube
  fechaSubida: string;
  notas?: string;
}


export interface SupabaseSettings {
  url: string;
  anonKey: string;
  tableNameClientes: string;
  tableNamePagos: string;
  conectado: boolean;
  ultimaSincronizacion?: string;
}

export interface TopografoConsultaMensaje {
  id: string;
  remitente: 'usuario' | 'topografo';
  texto: string;
  fecha: string;
  medidasSugeridas?: {
    x1: number;
    x2: number;
    y1: number;
    areaM2: number;
  };
}

export interface SistemaConfig {
  monedaSimbolo: string;
  monedaCodigo: string;
  tasaMoraMensual: number;
  diasGraciaMora: number;
}

export interface BackupData {
  version: string;
  fechaExportacion: string;
  sistema: string;
  clientes: ClienteComprador[];
  configuracion?: {
    sistema?: SistemaConfig;
    supabase?: SupabaseSettings;
  };
}

// ==========================================
// NUEVOS TIPOS: INVENTARIO, LEADS & WHATSAPP
// ==========================================

export interface LoteInventario {
  id: string;
  numeroLote: string;
  nombreComercial: string;
  medidaX1: number;
  medidaX2: number;
  medidaY1: number;
  areaM2: number;
  varasCuadradas: number;
  precioM2: number;
  precioTotal: number;
  estado: 'disponible' | 'apartado' | 'vendido';
  clienteAsignadoId?: string;
  caracteristicas?: string;
  creadoEn: string;
}

export interface ProspectoLead {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  estado: 'nuevo' | 'en_seguimiento' | 'visita_agendada' | 'interesado' | 'convertido' | 'descartado';
  presupuestoEstimado?: number;
  loteInteresId?: string;
  canalOrigen: 'whatsapp' | 'facebook' | 'visita_campo' | 'referido';
  notasVendedor?: string;
  ultimoContacto: string;
  creadoEn: string;
}

export interface MensajeWhatsApp {
  id: string;
  telefono: string;
  remitente: 'cliente' | 'asistente_gemini';
  mensaje: string;
  intencionDetectada?: 'consulta_saldo' | 'cotizar_lote' | 'agendar_visita' | 'reportar_pago' | 'faq';
  metadataJson?: Record<string, any>;
  creadoEn: string;
}

export interface VisitaTerreno {
  id: string;
  leadId?: string;
  nombreVisitante: string;
  telefono: string;
  fechaHoraVisita: string;
  loteInteres?: string;
  estado: 'programada' | 'completada' | 'reprogramada' | 'cancelada';
  anfitrionVendedor: string;
  notas?: string;
  creadoEn: string;
}

// ==========================================
// ARQUITECTURA MULTI-AGENTE: 3 NIVELES
// ==========================================

export interface DictamenNivel2Topografo {
  dictamenValido: boolean;
  geometriaTipo: 'regular' | 'trapezoidal' | 'irregular';
  areaOficialM2: number;
  varasCuadradas: number;
  linderosValidados: {
    frenteX1: number;
    fondoX2: number;
    profundidadY1: number;
  };
  observacionesTecnicas: string[];
  riesgoDeslizamientoODrenaje: 'bajo' | 'medio' | 'alto';
  resumenPericial: string;
}

export interface DictamenNivel2Financiero {
  financiamientoViable: boolean;
  precioTotalCalculado: number;
  engancheSugerido: number;
  montoFinanciado: number;
  cuotaMensualCalculada: number;
  tasaAnual: number;
  plazoMeses: number;
  alertasFinancieras: string[];
  resumenActuarial: string;
}

export interface DictamenNivel3Auditor {
  aprobado: boolean;
  politicaFailClosed: 'APROBADO_PASO' | 'BLOQUEO_FAIL_CLOSED';
  toleranciaGeometricaMm: number;
  discrepanciaAreaM2: number;
  erroresCriticos: string[];
  firmadoDigitalmente: boolean;
  tokenCertificacion?: string;
  fechaAuditoria: string;
}

export interface AuditoriaMultiAgenteResultado {
  nivel1Orquestador: {
    idProceso: string;
    timestamp: string;
    estado: 'completado' | 'bloqueado';
    resumenEjecutivo: string;
  };
  nivel2Topografo: DictamenNivel2Topografo;
  nivel2Financiero: DictamenNivel2Financiero;
  nivel3Auditor: DictamenNivel3Auditor;
}


