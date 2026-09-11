// scripts/test-supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvblossugxhxttmkfpnf.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_VQsDcGd6Lx6nusumq8Fl5A_N5pESetG';

const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY);

async function test() {
  console.log('Testing Supabase Client...');
  
  // 1. Test Select
  const { data: selectData, error: selectError } = await supabase
    .from('clientes_quinta_celia')
    .select('*')
    .limit(5);
  
  console.log('SELECT RESULT:', { count: selectData?.length, selectError });

  // 2. Test Insert
  const { data: insertData, error: insertError } = await supabase
    .from('clientes_quinta_celia')
    .upsert({
      id: 'cliente-nube-verificado',
      nombre: 'Ricardo (Propietario Quinta Celia)',
      cedula: '00000000-1',
      telefono: '+503 7574-3444',
      lote_nombre: 'El Manantial (Macrolote Campestre)',
      precio_total: 25000,
      enganche: 5000,
      monto_financiado: 20000,
      cuota_mensual: 247.97,
      plazo_meses: 120,
      tasa_interes_anual: 8.5,
      estado: 'activo'
    })
    .select();

  console.log('INSERT RESULT:', { insertData, insertError });
}

test();
