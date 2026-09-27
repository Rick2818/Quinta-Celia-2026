// scripts/test-supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvblossugxhxttmkfpnf.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_VQsDcGd6Lx6nusumq8Fl5A_N5pESetG';

const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY);

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
