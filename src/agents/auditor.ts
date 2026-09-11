// src/agents/auditor.ts
// Nivel 3: Auditor Crítico & Verificador (Fail-Closed Gatekeeper)
// Valida de forma 100% determinista la congruencia geométrica y financiera.

import { 
  DictamenNivel2Topografo, 
  DictamenNivel2Financiero, 
  DictamenNivel3Auditor 
} from '../types';

export interface DatosEntradaAuditoria {
  x1: number;
  x2: number;
  y1: number;
  areaEsperadaM2: number;
  precioTotal: number;
  enganche: number;
  plazoMeses: number;
  tasaAnual: number;
  cuotaEsperada: number;
}

export function auditarExpedienteLote(
  entrada: DatosEntradaAuditoria,
  dictamenTopografo: DictamenNivel2Topografo,
  dictamenFinanciero: DictamenNivel2Financiero
): DictamenNivel3Auditor {
  const erroresCriticos: string[] = [];

  // 1. Verificación Geométrica Estricta
  const areaCalculadaFisica = Math.round(((entrada.x1 + entrada.x2) / 2) * entrada.y1 * 100) / 100;
  const discrepanciaArea = Math.round(Math.abs(dictamenTopografo.areaOficialM2 - areaCalculadaFisica) * 100) / 100;

  // Tolerancia máxima permitida en catastro pericial: 0.05 m²
  if (discrepanciaArea > 0.05) {
    erroresCriticos.push(
      `Discrepancia geométrica inaceptable: El área reportada por el topógrafo (${dictamenTopografo.areaOficialM2} m²) no coincide con el cálculo pericial de linderos (${areaCalculadaFisica} m²). Tolerancia excedida por ${discrepanciaArea} m².`
    );
  }

  if (entrada.x1 <= 0 || entrada.x2 <= 0 || entrada.y1 <= 0) {
    erroresCriticos.push('Linderos inválidos: Las dimensiones x1, x2 y y1 deben ser mayores a 0.');
  }

  // 2. Verificación de Riesgo Geológico
  if (dictamenTopografo.riesgoDeslizamientoODrenaje === 'alto') {
    erroresCriticos.push('Riesgo geológico/hidrológico ALTO detectado. Se exige estudio de suelo previo a certificación.');
  }

  // 3. Verificación Financiera y Aritmética
  const montoFinanciadoCalculado = Math.max(0, entrada.precioTotal - entrada.enganche);
  if (Math.abs(dictamenFinanciero.montoFinanciado - montoFinanciadoCalculado) > 1.0) {
    erroresCriticos.push(
      `Inconsistencia contable: El monto financiado ($${dictamenFinanciero.montoFinanciado}) difiere del Precio - Enganche ($${montoFinanciadoCalculado}).`
    );
  }

  if (dictamenFinanciero.cuotaMensualCalculada <= 0 && entrada.plazoMeses > 0 && montoFinanciadoCalculado > 0) {
    erroresCriticos.push('Cálculo de cuota nulo o negativo en amortización activa.');
  }

  // 4. POLÍTICA FAIL-CLOSED: Si existe cualquier anomalía crítica, BLOQUEA
  const aprobado = erroresCriticos.length === 0;
  const fechaAuditoria = new Date().toISOString();

  if (!aprobado) {
    return {
      aprobado: false,
      politicaFailClosed: 'BLOQUEO_FAIL_CLOSED',
      toleranciaGeometricaMm: 50,
      discrepanciaAreaM2: discrepanciaArea,
      erroresCriticos,
      firmadoDigitalmente: false,
      fechaAuditoria
    };
  }

  // Si pasa todas las pruebas con 0 errores: Emite sello pericial digital
  const hashSello = `QC-AUDIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 89999 + 10000)}`;

  return {
    aprobado: true,
    politicaFailClosed: 'APROBADO_PASO',
    toleranciaGeometricaMm: 50,
    discrepanciaAreaM2: discrepanciaArea,
    erroresCriticos: [],
    firmadoDigitalmente: true,
    tokenCertificacion: hashSello,
    fechaAuditoria
  };
}
