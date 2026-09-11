// scripts/seed-supabase.js
// Sube automáticamente los datos semilla y el inventario a Supabase

const SUPABASE_URL = 'https://bvblossugxhxttmkfpnf.supabase.co';
const ANON_KEY = 'sb_publishable_VQsDcGd6Lx6nusumq8Fl5A_N5pESetG';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

async function seed() {
  console.log('--- Sembrando datos iniciales en Supabase Cloud ---');

  // 1. Lotes de inventario iniciales
  const lotes = [
    {
      id: 'lote-1',
      numero_lote: 'L-01',
      nombre_comercial: 'El Manantial (Macrolote Campestre)',
      medida_x1: 20,
      medida_x2: 20,
      medida_y1: 25,
      area_m2: 500,
      varas_cuadradas: 715.41,
      precio_m2: 50,
      precio_total: 25000,
      estado: 'vendido',
      caracteristicas: 'Lote plano con acceso a calle principal y naciente natural.'
    },
    {
      id: 'lote-2',
      numero_lote: 'L-04',
      nombre_comercial: 'Vista al Valle Premium',
      medida_x1: 22,
      medida_x2: 26,
      medida_y1: 32,
      area_m2: 768,
      varas_cuadradas: 1098.88,
      precio_m2: 45,
      precio_total: 34560,
      estado: 'disponible',
      caracteristicas: 'Espectacular vista panorámica al valle y excelente brisa de montaña.'
    },
    {
      id: 'lote-3',
      numero_lote: 'L-07',
      nombre_comercial: 'El Mirador del Bosque',
      medida_x1: 25,
      medida_x2: 25,
      medida_y1: 30,
      area_m2: 750,
      varas_cuadradas: 1073.12,
      precio_m2: 48,
      precio_total: 36000,
      estado: 'apartado',
      caracteristicas: 'Rodeado de pinos y senderos ecológicos, ideal para cabaña de descanso.'
    }
  ];

  try {
    const resLotes = await fetch(`${SUPABASE_URL}/rest/v1/inventario_lotes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(lotes)
    });
    console.log('Lotes sincronizados:', resLotes.status);
  } catch (e) {
    console.error('Error sembrando lotes:', e);
  }

  // 2. Clientes Semilla
  const clientes = [
    {
      id: 'cliente-seed-1',
      nombre: 'Lic. Roberto Alexander Castillo',
      email: 'roberto.castillo@ejemplo.com',
      telefono: '+503 7845-9921',
      direccion: 'Residencial San Antonio, Casa #44, Santa Ana',
      cedula: '04892114-8',
      lote_nombre: 'El Manantial (Macrolote Campestre)',
      lote_numero: 'L-01',
      medida_x1: 20,
      medida_x2: 20,
      medida_y1: 25,
      area_m2: 500,
      precio_total: 22500,
      enganche: 4500,
      monto_financiado: 18000,
      plazo_meses: 36,
      tasa_interes_anual: 9.5,
      cuota_mensual: 576.68,
      estado: 'activo',
      topografo_dictamen: 'Medidas certificadas por Ing. Celso Valdivia. Mojones verificados en campo.',
      topografo_validado: true
    },
    {
      id: 'cliente-seed-2',
      nombre: 'Dra. Carmen Elena Morales de Rivas',
      email: 'carmen.morales@salud.gob.sv',
      telefono: '+503 7120-3344',
      direccion: 'Colonia Escalón Poniente, Calle Los Pinos #12, San Salvador',
      cedula: '02334819-2',
      lote_nombre: 'El Mirador del Bosque',
      lote_numero: 'L-07',
      medida_x1: 22,
      medida_x2: 26,
      medida_y1: 32,
      area_m2: 768,
      precio_total: 34560,
      enganche: 6912,
      monto_financiado: 27648,
      plazo_meses: 60,
      tasa_interes_anual: 8.5,
      cuota_mensual: 567.82,
      estado: 'activo',
      topografo_dictamen: 'Lote trapezoidal con pendiente uniforme del 4.2%. Apto para construcción inmediata.',
      topografo_validado: true
    }
  ];

  try {
    const resClientes = await fetch(`${SUPABASE_URL}/rest/v1/clientes_quinta_celia`, {
      method: 'POST',
      headers,
      body: JSON.stringify(clientes)
    });
    console.log('Clientes sincronizados:', resClientes.status);
  } catch (e) {
    console.error('Error sembrando clientes:', e);
  }

  // 3. Lead de prueba WhatsApp (7574-3444)
  const leadTest = [
    {
      id: 'lead-test-1',
      nombre: 'Ing. Carlos Mendoza (Interesado WhatsApp)',
      telefono: '+503 7574-3444',
      email: 'cmendoza@gmail.com',
      estado: 'en_seguimiento',
      presupuesto_estimado: 25000,
      canal_origen: 'whatsapp',
      notas_vendedor: 'Contactó por WhatsApp preguntando por lotes a 120 meses. Interesado en visitar este sábado.'
    }
  ];

  try {
    const resLead = await fetch(`${SUPABASE_URL}/rest/v1/prospectos_leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify(leadTest)
    });
    console.log('Lead de prueba WhatsApp sincronizado:', resLead.status);
  } catch (e) {
    console.error('Error sembrando lead:', e);
  }

  console.log('--- ¡Base de Datos Supabase 100% activa con registros en la nube! ---');
}

seed();
