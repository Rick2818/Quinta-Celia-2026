// scripts/test-supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || PUBLISHABLE_KEY;

if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
  console.error('Configura SUPABASE_URL y SUPABASE_ANON_KEY antes de probar Supabase.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  },
});

async function test() {
  console.log('Testing Supabase Client (read-only)...');
  
  const { data: selectData, error: selectError } = await supabase
    .from('clientes_quinta_celia')
    .select('id,nombre,telefono,lote_nombre')
    .limit(5);
  
  console.log('CLIENTES SELECT:', { count: selectData?.length, selectError });

  const { data: pagosData, error: pagosError } = await supabase
    .from('pagos_quinta_celia')
    .select('id,recibo_numero,cliente_id,cliente_nombre,monto_total,fecha_pago,datos_json')
    .limit(5);

  console.log('PAGOS SELECT:', { count: pagosData?.length, pagosError });

  if (selectError || pagosError) {
    process.exitCode = 1;
  }
}

test();
