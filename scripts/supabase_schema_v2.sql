-- ====================================================================
-- QUINTA CELIA 2026 - ESQUEMA DE BASE DE DATOS AMPLIADO (V2)
-- Tablas para: Clientes Actuales, Nuevos Prospectos (Leads), 
-- Inventario de Lotes, Mensajes de WhatsApp y Agenda de Visitas
-- ====================================================================

-- 1. Tabla de Clientes y Terrenos Existente (Garantizando compatibilidad)
CREATE TABLE IF NOT EXISTS public.clientes_quinta_celia (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  cedula TEXT,
  lote_nombre TEXT,
  lote_numero TEXT,
  medida_x1 NUMERIC(10,2) DEFAULT 0,
  medida_x2 NUMERIC(10,2) DEFAULT 0,
  medida_y1 NUMERIC(10,2) DEFAULT 0,
  area_m2 NUMERIC(10,2) DEFAULT 0,
  precio_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  enganche NUMERIC(14,2) NOT NULL DEFAULT 0,
  monto_financiado NUMERIC(14,2) NOT NULL DEFAULT 0,
  plazo_meses INT NOT NULL DEFAULT 120,
  tasa_interes_anual NUMERIC(5,2) NOT NULL DEFAULT 0,
  cuota_mensual NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  estado TEXT DEFAULT 'activo', -- 'activo', 'liquidado', 'en_mora'
  topografo_dictamen TEXT,
  topografo_validado BOOLEAN DEFAULT true,
  datos_json JSONB,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Pagos y Recibos Oficiales
CREATE TABLE IF NOT EXISTS public.pagos_quinta_celia (
  id TEXT PRIMARY KEY,
  recibo_numero TEXT NOT NULL,
  cliente_id TEXT REFERENCES public.clientes_quinta_celia(id) ON DELETE CASCADE,
  cliente_nombre TEXT NOT NULL,
  mes_numero INT NOT NULL,
  monto_total NUMERIC(12,2) NOT NULL,
  abono_capital NUMERIC(12,2) NOT NULL,
  abono_interes NUMERIC(12,2) NOT NULL,
  saldo_restante NUMERIC(12,2) NOT NULL,
  fecha_pago DATE NOT NULL,
  metodo TEXT NOT NULL,
  referencia TEXT,
  datos_json JSONB,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. [NUEVO] Inventario Maestro de Lotes
CREATE TABLE IF NOT EXISTS public.inventario_lotes (
  id TEXT PRIMARY KEY,
  numero_lote TEXT NOT NULL UNIQUE,
  nombre_comercial TEXT NOT NULL,
  medida_x1 NUMERIC(10,2) NOT NULL, -- Frente (m)
  medida_x2 NUMERIC(10,2) NOT NULL, -- Fondo (m)
  medida_y1 NUMERIC(10,2) NOT NULL, -- Lateral (m)
  area_m2 NUMERIC(10,2) NOT NULL,
  varas_cuadradas NUMERIC(10,2) NOT NULL,
  precio_m2 NUMERIC(10,2) NOT NULL,
  precio_total NUMERIC(14,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'disponible', -- 'disponible', 'apartado', 'vendido'
  cliente_asignado_id TEXT REFERENCES public.clientes_quinta_celia(id) ON DELETE SET NULL,
  caracteristicas TEXT, -- ej. 'Vista al lago, con acceso a calle principal'
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. [NUEVO] Prospectos y Clientes Nuevos (Embudo CRM / Leads)
CREATE TABLE IF NOT EXISTS public.prospectos_leads (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  estado TEXT NOT NULL DEFAULT 'nuevo', -- 'nuevo', 'en_seguimiento', 'visita_agendada', 'interesado', 'convertido', 'descartado'
  presupuesto_estimado NUMERIC(14,2) DEFAULT 0,
  lote_interes_id TEXT REFERENCES public.inventario_lotes(id) ON DELETE SET NULL,
  canal_origen TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'facebook', 'visita_campo', 'referido'
  notas_vendedor TEXT,
  ultimo_contacto TIMESTAMPTZ DEFAULT NOW(),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. [NUEVO] Historial de Conversaciones de WhatsApp (Gemini Flash 2.5)
CREATE TABLE IF NOT EXISTS public.mensajes_whatsapp (
  id TEXT PRIMARY KEY,
  telefono TEXT NOT NULL, -- Número del cliente en formato internacional (+503...)
  remitente TEXT NOT NULL, -- 'cliente' o 'asistente_gemini'
  mensaje TEXT NOT NULL,
  intencion_detectada TEXT, -- 'consulta_saldo', 'cotizar_lote', 'agendar_visita', 'reportar_pago', 'faq'
  metadata_json JSONB, -- Datos extraídos por la IA (lote de interés, fecha solicitada, etc.)
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 6. [NUEVO] Agenda de Citas y Visitas al Terreno
CREATE TABLE IF NOT EXISTS public.visitas_terreno (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES public.prospectos_leads(id) ON DELETE SET NULL,
  nombre_visitante TEXT NOT NULL,
  telefono TEXT NOT NULL,
  fecha_hora_visita TIMESTAMPTZ NOT NULL,
  lote_interes TEXT,
  estado TEXT DEFAULT 'programada', -- 'programada', 'completada', 'reprogramada', 'cancelada'
  anfitrion_vendedor TEXT DEFAULT 'Ricardo',
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda optimizados
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON public.clientes_quinta_celia(cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes_quinta_celia(telefono);
CREATE INDEX IF NOT EXISTS idx_whatsapp_telefono ON public.mensajes_whatsapp(telefono);
CREATE INDEX IF NOT EXISTS idx_prospectos_telefono ON public.prospectos_leads(telefono);
CREATE INDEX IF NOT EXISTS idx_lotes_estado ON public.inventario_lotes(estado);
