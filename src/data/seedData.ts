import { ClienteComprador, PagoRealizado } from '../types';
import { calcularMedidasTerreno, generarTablaAmortizacion } from '../utils/calculos';

const medidas1 = calcularMedidasTerreno(20, 20, 25); // 500 m²
const amortizacion1 = generarTablaAmortizacion(18000, 9.5, 36, '2026-01-15');

// Marcar los primeros 2 meses como pagados para el cliente 1
amortizacion1[0].estado = 'pagado';
amortizacion1[0].fechaPago = '2026-01-14T10:30:00.000Z';
amortizacion1[0].reciboId = 'QC-REC-2026-00001';
amortizacion1[0].metodoPago = 'transferencia';

amortizacion1[1].estado = 'pagado';
amortizacion1[1].fechaPago = '2026-02-14T15:20:00.000Z';
amortizacion1[1].reciboId = 'QC-REC-2026-00002';
amortizacion1[1].metodoPago = 'transferencia';

const pago1_1: PagoRealizado = {
  id: 'pago-seed-1',
  reciboNumero: 'QC-REC-2026-00001',
  clienteId: 'cliente-seed-1',
  clienteNombre: 'Lic. Roberto Alexander Castillo',
  clienteEmail: 'roberto.castillo@ejemplo.com',
  clienteTelefono: '+503 7845-9921',
  mesNumero: 1,
  montoTotal: amortizacion1[0].cuota,
  abonoCapital: amortizacion1[0].capital,
  abonoInteres: amortizacion1[0].interes,
  saldoRestante: amortizacion1[0].saldoFinal,
  fechaPago: '2026-01-14T10:30:00.000Z',
  metodo: 'transferencia',
  referencia: 'TRF-BANCOAGR-88219',
  enviadoPorEmail: true,
  emailDestino: 'roberto.castillo@ejemplo.com',
  loteNombre: 'Lote El Manantial',
  medidasTexto: 'x1: 20m, x2: 20m, y1: 25m (500 m²)'
};

const pago1_2: PagoRealizado = {
  id: 'pago-seed-2',
  reciboNumero: 'QC-REC-2026-00002',
  clienteId: 'cliente-seed-1',
  clienteNombre: 'Lic. Roberto Alexander Castillo',
  clienteEmail: 'roberto.castillo@ejemplo.com',
  clienteTelefono: '+503 7845-9921',
  mesNumero: 2,
  montoTotal: amortizacion1[1].cuota,
  abonoCapital: amortizacion1[1].capital,
  abonoInteres: amortizacion1[1].interes,
  saldoRestante: amortizacion1[1].saldoFinal,
  fechaPago: '2026-02-14T15:20:00.000Z',
  metodo: 'transferencia',
  referencia: 'TRF-BANCOAGR-91402',
  enviadoPorEmail: true,
  emailDestino: 'roberto.castillo@ejemplo.com',
  loteNombre: 'Lote El Manantial',
  medidasTexto: 'x1: 20m, x2: 20m, y1: 25m (500 m²)'
};

const medidas2 = calcularMedidasTerreno(22, 26, 32); // 768 m²
const amortizacion2 = generarTablaAmortizacion(28000, 8.5, 48, '2026-02-01');
amortizacion2[0].estado = 'pagado';
amortizacion2[0].fechaPago = '2026-02-01T11:00:00.000Z';
amortizacion2[0].reciboId = 'QC-REC-2026-00003';
amortizacion2[0].metodoPago = 'deposito';

const pago2_1: PagoRealizado = {
  id: 'pago-seed-3',
  reciboNumero: 'QC-REC-2026-00003',
  clienteId: 'cliente-seed-2',
  clienteNombre: 'Dra. María Elena Sandoval',
  clienteEmail: 'dra.sandoval@ejemplo.com',
  clienteTelefono: '+503 7102-8834',
  mesNumero: 1,
  montoTotal: amortizacion2[0].cuota,
  abonoCapital: amortizacion2[0].capital,
  abonoInteres: amortizacion2[0].interes,
  saldoRestante: amortizacion2[0].saldoFinal,
  fechaPago: '2026-02-01T11:00:00.000Z',
  metodo: 'deposito',
  referencia: 'DEP-CUSCATLAN-44109',
  enviadoPorEmail: true,
  emailDestino: 'dra.sandoval@ejemplo.com',
  loteNombre: 'Lote Mirador de las Acacias',
  medidasTexto: 'x1: 22m, x2: 26m, y1: 32m (768 m²)'
};

export const CLIENTES_SEED: ClienteComprador[] = [
  {
    id: 'cliente-seed-1',
    nombre: 'Lic. Roberto Alexander Castillo',
    email: 'roberto.castillo@ejemplo.com',
    telefono: '+503 7845-9921',
    direccion: 'Residencial Cumbres de la Escalón, Senda Los Pinos #44',
    cedula: '02847192-3',
    loteNombre: 'Lote El Manantial',
    loteNumero: '08',
    medidas: medidas1,
    topografoValidado: true,
    topografoNombre: 'Ing. Celso R. Valdivia (Topógrafo Senior 24 años exp.)',
    topografoDictamen: 'Levantamiento perimétrico con estación total y GPS diferencial. Medidas finales aprobadas: Frente (x1)=20.00m, Fondo (x2)=20.00m, Lateral (y1)=25.00m. Área neta calculada 500.00 m² (715.41 v²). Terreno regular con suave declive del 2% hacia el lindero poniente, excelente drenaje pluvial y sin riesgos geológicos. Conforme para escrituración definitiva.',
    topografoFecha: '2026-01-10',
    precioM2: 45,
    precioTotal: 22500,
    enganche: 4500,
    enganchePorcentaje: 20,
    montoFinanciado: 18000,
    plazoMeses: 36,
    tasaInteresAnual: 9.5,
    cuotaMensual: amortizacion1[0].cuota,
    fechaInicio: '2026-01-15',
    estado: 'activo',
    amortizacion: amortizacion1,
    pagos: [pago1_2, pago1_1],
    notas: 'Lead calificado con preaprobación inmediata. Desea iniciar construcción de cabaña campestre.',
    creadoEn: '2026-01-10T09:00:00.000Z',
    actualizadoEn: '2026-02-14T15:20:00.000Z'
  },
  {
    id: 'cliente-seed-2',
    nombre: 'Dra. María Elena Sandoval',
    email: 'dra.sandoval@ejemplo.com',
    telefono: '+503 7102-8834',
    direccion: 'Colonia San Benito, Boulevard del Hipódromo #105',
    cedula: '01938472-8',
    loteNombre: 'Lote Mirador de las Acacias',
    loteNumero: '14-B',
    medidas: medidas2,
    topografoValidado: true,
    topografoNombre: 'Ing. Celso R. Valdivia (Topógrafo Senior 24 años exp.)',
    topografoDictamen: 'Polígono trapezoidal con cotas oficiales x1=22.00m, x2=26.00m y profundidad y1=32.00m. Superficie total protocolizada de 768.00 m² (1,098.88 v²). Deslinde verificado con mojoneras de concreto en los cuatro vértices.',
    topografoFecha: '2026-01-25',
    precioM2: 46,
    precioTotal: 35000,
    enganche: 7000,
    enganchePorcentaje: 20,
    montoFinanciado: 28000,
    plazoMeses: 48,
    tasaInteresAnual: 8.5,
    cuotaMensual: amortizacion2[0].cuota,
    fechaInicio: '2026-02-01',
    estado: 'activo',
    amortizacion: amortizacion2,
    pagos: [pago2_1],
    notas: 'Interesada en plan de pago adelantado a capital sin penalidad.',
    creadoEn: '2026-01-25T14:30:00.000Z',
    actualizadoEn: '2026-02-01T11:00:00.000Z'
  }
];
