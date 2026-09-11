// src/agents/schemas.ts
// Esquemas estructurados deterministas para Gemini y tipos TypeScript

import { Type, Schema } from '@google/genai';

// 1. Esquema estructurado para Nivel 2: Agente Topógrafo (Ing. Valdivia)
export const TopografoResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dictamenValido: { type: Type.BOOLEAN },
    geometriaTipo: { 
      type: Type.STRING, 
      enum: ['regular', 'trapezoidal', 'irregular'] 
    },
    areaOficialM2: { type: Type.NUMBER },
    varasCuadradas: { type: Type.NUMBER },
    linderosValidados: {
      type: Type.OBJECT,
      properties: {
        frenteX1: { type: Type.NUMBER },
        fondoX2: { type: Type.NUMBER },
        profundidadY1: { type: Type.NUMBER }
      },
      required: ['frenteX1', 'fondoX2', 'profundidadY1']
    },
    observacionesTecnicas: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    riesgoDeslizamientoODrenaje: { 
      type: Type.STRING, 
      enum: ['bajo', 'medio', 'alto'] 
    },
    resumenPericial: { type: Type.STRING }
  },
  required: [
    'dictamenValido',
    'geometriaTipo',
    'areaOficialM2',
    'varasCuadradas',
    'linderosValidados',
    'observacionesTecnicas',
    'riesgoDeslizamientoODrenaje',
    'resumenPericial'
  ]
};

// 2. Esquema estructurado para Nivel 2: Agente Actuario Financiero
export const FinancieroResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    financiamientoViable: { type: Type.BOOLEAN },
    precioTotalCalculado: { type: Type.NUMBER },
    engancheSugerido: { type: Type.NUMBER },
    montoFinanciado: { type: Type.NUMBER },
    cuotaMensualCalculada: { type: Type.NUMBER },
    tasaAnual: { type: Type.NUMBER },
    plazoMeses: { type: Type.INTEGER },
    alertasFinancieras: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    resumenActuarial: { type: Type.STRING }
  },
  required: [
    'financiamientoViable',
    'precioTotalCalculado',
    'engancheSugerido',
    'montoFinanciado',
    'cuotaMensualCalculada',
    'tasaAnual',
    'plazoMeses',
    'alertasFinancieras',
    'resumenActuarial'
  ]
};

// 3. Esquema estructurado para Agente WhatsApp (Gemini Flash 2.5 + Google MCP)
export const WhatsAppResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intencion: {
      type: Type.STRING,
      enum: ['consulta_saldo', 'cotizar_lote', 'agendar_visita', 'agendar_meet', 'consultar_ubicacion', 'reportar_pago', 'faq', 'desconocido']
    },
    respuestaMensaje: { type: Type.STRING },
    clienteIdentificado: { type: Type.BOOLEAN },
    datosAccion: {
      type: Type.OBJECT,
      properties: {
        loteNumero: { type: Type.STRING },
        montoConsultado: { type: Type.NUMBER },
        fechaCitaSugerida: { type: Type.STRING },
        horaCitaSugerida: { type: Type.STRING },
        tipoCita: { type: Type.STRING, enum: ['presencial_terreno', 'google_meet_virtual'] },
        enlaceGoogleCalendar: { type: Type.STRING },
        enlaceGoogleMeet: { type: Type.STRING },
        enlaceGmailConfirmacion: { type: Type.STRING },
        enlaceGoogleMaps: { type: Type.STRING },
        accionRequerida: { type: Type.STRING }
      }
    }
  },
  required: ['intencion', 'respuestaMensaje', 'clienteIdentificado']
};

