-- ================================================================
-- QUINTA CELIA - ENDURECIMIENTO RLS PARA CLIENTES Y PAGOS REALES
-- Ejecutar en Supabase SQL Editor con rol owner/admin.
-- ================================================================

ALTER TABLE public.clientes_quinta_celia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_quinta_celia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a anon en clientes" ON public.clientes_quinta_celia;
DROP POLICY IF EXISTS "Permitir todo a anon en pagos" ON public.pagos_quinta_celia;
DROP POLICY IF EXISTS "Clientes autenticados lectura" ON public.clientes_quinta_celia;
DROP POLICY IF EXISTS "Clientes autenticados escritura" ON public.clientes_quinta_celia;
DROP POLICY IF EXISTS "Pagos autenticados lectura" ON public.pagos_quinta_celia;
DROP POLICY IF EXISTS "Pagos autenticados escritura" ON public.pagos_quinta_celia;

REVOKE ALL ON public.clientes_quinta_celia FROM anon;
REVOKE ALL ON public.pagos_quinta_celia FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes_quinta_celia TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagos_quinta_celia TO authenticated;

CREATE POLICY "Clientes autenticados lectura" ON public.clientes_quinta_celia
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clientes autenticados escritura" ON public.clientes_quinta_celia
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Pagos autenticados lectura" ON public.pagos_quinta_celia
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Pagos autenticados escritura" ON public.pagos_quinta_celia
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
