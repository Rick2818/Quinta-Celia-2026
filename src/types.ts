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
  creadoEn: string;
  actualizadoEn: string;
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

