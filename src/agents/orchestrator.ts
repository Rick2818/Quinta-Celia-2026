// src/agents/orchestrator.ts
// Nivel 1: Orquestador Central de Gobernanza Multi-Agente
// Coordina Nivel 2 (Especialistas) y Nivel 3 (Auditor Fail-Closed)

import { ejecutarAgenteTopografo, ejecutarAgenteFinanciero } from './specialists';
import { auditarExpedienteLote } from './auditor';
import { AuditoriaMultiAgenteResultado } from '../types';

export interface ParametrosEvaluacionLote {
  x1: number;
  x2: number;
  y1: number;
  precioTotal: number;
  enganche: number;
  plazoMeses: number;
  tasaAnual: number;
  clienteNombre?: string;
  loteNombre?: string;
  apiKey?: string;
}

export async function orquestarEvaluacion3Niveles(
  params: ParametrosEvaluacionLote
): Promise<AuditoriaMultiAgenteResultado> {
  const idProceso = `PROC-QC-${Date.now().toString(36).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  // ----------------------------------------------------
  // NIVEL 2: EJECUCIÓN PARALELA DE ESPECIALISTAS (Fan-out)
  // ----------------------------------------------------
  const [dictamenTopografo, dictamenFinanciero] = await Promise.all([
    ejecutarAgenteTopografo({
      x1: params.x1,
      x2: params.x2,
      y1: params.y1,
      loteNombre: params.loteNombre,
      clienteNombre: params.clienteNombre,
      apiKey: params.apiKey
    }),
    ejecutarAgenteFinanciero({
      precioTotal: params.precioTotal,
      enganche: params.enganche,
      plazoMeses: params.plazoMeses,
      tasaAnual: params.tasaAnual,
      apiKey: params.apiKey
    })
  ]);

  // ----------------------------------------------------
  // NIVEL 3: AUDITOR CRÍTICO FAIL-CLOSED (Gatekeeper)
  // ----------------------------------------------------
  const dictamenAuditor = auditarExpedienteLote(
    {
      x1: params.x1,
      x2: params.x2,
      y1: params.y1,
      areaEsperadaM2: dictamenTopografo.areaOficialM2,
      precioTotal: params.precioTotal,
      enganche: params.enganche,
      plazoMeses: params.plazoMeses,
      tasaAnual: params.tasaAnual,
      cuotaEsperada: dictamenFinanciero.cuotaMensualCalculada
    },
    dictamenTopografo,
    dictamenFinanciero
  );

  // ----------------------------------------------------
  // NIVEL 1: SÍNTESIS Y DECISIÓN EJECUTIVA
  // ----------------------------------------------------
  const estadoFinal = dictamenAuditor.aprobado ? 'completado' : 'bloqueado';
  const resumenEjecutivo = dictamenAuditor.aprobado
    ? `Expediente certificado satisfactoriamente. Lote de ${dictamenTopografo.areaOficialM2} m² con cuota nivelada de $${dictamenFinanciero.cuotaMensualCalculada}. Sello pericial: ${dictamenAuditor.tokenCertificacion}.`
    : `OPERACIÓN BLOQUEADA POR POLÍTICA FAIL-CLOSED: Se detectaron discrepancias críticas: ${dictamenAuditor.erroresCriticos.join(' | ')}`;

  return {
    nivel1Orquestador: {
      idProceso,
      timestamp,
      estado: estadoFinal,
      resumenEjecutivo
    },
    nivel2Topografo: dictamenTopografo,
    nivel2Financiero: dictamenFinanciero,
    nivel3Auditor: dictamenAuditor
  };
}
