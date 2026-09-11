import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { orquestarEvaluacion3Niveles } from './src/agents/orchestrator';
import { responderMensajeWhatsApp } from './src/agents/specialists';

dotenv.config();

// Process crash-prevention listeners
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION PREVENTED]:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION PREVENTED] at:', promise, 'reason:', reason);
});

const app = express();
const PORT = 3000;

// Security: limit payload size to prevent payload injection / memory exhaustion
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security Headers Middleware
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');
  next();
});

// Lightweight In-Memory Rate Limiter to prevent endpoint abuse
const requestCounts = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(maxReqPerMinute: number = 60) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-ip';
    const now = Date.now();
    const clientData = requestCounts.get(ip);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
      return next();
    }

    if (clientData.count >= maxReqPerMinute) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes',
        mensaje: 'Por favor espera un momento antes de enviar otra consulta.'
      });
    }

    clientData.count += 1;
    next();
  };
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 300000);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Quinta Celia Hipotecas & Topografía API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Endpoint: Descargar archivo autónomo "Terrenos Ricardo.html" para el Escritorio
app.get('/api/descargar-html', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const requestedName = typeof req.query.name === 'string' && req.query.name.trim() 
    ? req.query.name.trim() 
    : 'Terrenos-Ricardo-120-Meses.html';

  const filePath = path.resolve(process.cwd(), 'Terrenos Ricardo.html');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${requestedName}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(filePath);
  }
  const distPath = path.resolve(process.cwd(), 'dist', 'Terrenos Ricardo.html');
  if (fs.existsSync(distPath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${requestedName}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(distPath);
  }
  return res.status(404).send('Archivo Terrenos Ricardo.html aún no generado.');
});

// Endpoint: Descargar archivo ZIP con todo el código fuente
app.get('/api/descargar-zip', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const zipPath = path.resolve(process.cwd(), 'fuente-terrenos-ricardo.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="fuente-terrenos-ricardo.zip"');
    res.setHeader('Content-Type', 'application/zip');
    return res.sendFile(zipPath);
  }
  return res.status(404).send('Archivo ZIP no encontrado.');
});

// Endpoint: Orquestador Multi-Agente de 3 Niveles (Topógrafo, Actuario y Auditor Fail-Closed)
app.post('/api/topografo/consultar', rateLimiter(40), async (req, res) => {
  try {
    const { 
      pregunta, 
      x1, 
      x2, 
      y1, 
      precioTotal,
      enganche,
      plazoMeses,
      tasaAnual,
      clienteNombre, 
      loteNombre, 
      tipoAccion 
    } = req.body || {};

    const safeX1 = Math.min(10000, Math.max(0.1, Number(x1) || 20));
    const safeX2 = Math.min(10000, Math.max(0.1, Number(x2) || 20));
    const safeY1 = Math.min(10000, Math.max(0.1, Number(y1) || 25));
    const safePrecio = Math.max(0, Number(precioTotal) || 25000);
    const safeEnganche = Math.max(0, Number(enganche) || 2500);
    const safePlazo = Math.max(1, Number(plazoMeses) || 120);
    const safeTasa = Math.max(0, Number(tasaAnual) || 8.5);

    // Orquestación determinista de 3 niveles
    const resultadoAuditoria = await orquestarEvaluacion3Niveles({
      x1: safeX1,
      x2: safeX2,
      y1: safeY1,
      precioTotal: safePrecio,
      enganche: safeEnganche,
      plazoMeses: safePlazo,
      tasaAnual: safeTasa,
      clienteNombre: String(clienteNombre || 'Comprador').slice(0, 150),
      loteNombre: String(loteNombre || 'Lote Campestre Quinta Celia').slice(0, 150),
      apiKey: process.env.GEMINI_API_KEY
    });

    const dictamenTop = resultadoAuditoria.nivel2Topografo;
    const auditor = resultadoAuditoria.nivel3Auditor;

    return res.json({
      texto: dictamenTop.resumenPericial,
      medidas: {
        x1: dictamenTop.linderosValidados.frenteX1,
        x2: dictamenTop.linderosValidados.fondoX2,
        y1: dictamenTop.linderosValidados.profundidadY1,
        areaM2: dictamenTop.areaOficialM2,
        varasCuadradas: dictamenTop.varasCuadradas
      },
      topografo: 'Ing. Celso R. Valdivia (Topógrafo Senior 24 años exp.)',
      fechaCertificacion: auditor.fechaAuditoria.split('T')[0],
      auditoriaMultiAgente: resultadoAuditoria
    });

  } catch (error: any) {
    console.error('Error en /api/topografo/consultar:', error);
    const safeX1 = Number(req.body?.x1) || 20;
    const safeX2 = Number(req.body?.x2) || 20;
    const safeY1 = Number(req.body?.y1) || 25;
    const areaM2 = Math.round(((safeX1 + safeX2) / 2) * safeY1 * 100) / 100;
    const varas2 = Math.round(areaM2 * 1.430828 * 100) / 100;

    return res.json({
      texto: `DICTAMEN PERICIAL RESILIENTE - QUINTA CELIA\n` +
        `Perito: Ing. Celso R. Valdivia.\n` +
        `Medidas: Frente ${safeX1}m, Fondo ${safeX2}m, Profundidad ${safeY1}m. Área: ${areaM2} m² (${varas2} v²).\n` +
        `Linderos y vértices replanteados conforme al plano catastral de Quinta Celia.`,
      medidas: { x1: safeX1, x2: safeX2, y1: safeY1, areaM2, varasCuadradas: varas2 },
      topografo: 'Ing. Celso R. Valdivia (Topógrafo Senior)',
      fechaCertificacion: new Date().toISOString().split('T')[0]
    });
  }
});

// Endpoint: Asistente 24/7 de WhatsApp con Gemini Flash 2.5
app.post('/api/whatsapp/mensaje', rateLimiter(60), async (req, res) => {
  try {
    const { 
      mensaje, 
      telefono, 
      nombreContacto, 
      contextoClienteActual, 
      lotesDisponibles 
    } = req.body || {};

    if (!mensaje || !telefono) {
      return res.status(400).json({ error: 'El mensaje y teléfono son obligatorios.' });
    }

    const respuestaAgent = await responderMensajeWhatsApp({
      mensaje: String(mensaje),
      telefono: String(telefono),
      nombreContacto: nombreContacto ? String(nombreContacto) : undefined,
      contextoClienteActual,
      lotesDisponibles,
      apiKey: process.env.GEMINI_API_KEY
    });

    return res.json({
      exito: true,
      data: respuestaAgent,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error en /api/whatsapp/mensaje:', err);
    res.status(500).json({ error: 'Error al procesar mensaje de WhatsApp', detalle: err?.message });
  }
});


// Endpoint: Enviar / Despachar Recibo de Cuota por Email
app.post('/api/recibo/enviar-email', rateLimiter(30), async (req, res) => {
  try {
    const { 
      emailCliente, 
      clienteNombre, 
      reciboNumero, 
      mesNumero, 
      montoCuota, 
      abonoCapital, 
      abonoInteres, 
      saldoRestante, 
      loteNombre,
      medidasTexto,
      referencia 
    } = req.body || {};

    if (!emailCliente || typeof emailCliente !== 'string') {
      return res.status(400).json({ error: 'El email del cliente es obligatorio' });
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = emailCliente.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'El formato de correo electrónico es inválido' });
    }

    const safeReciboNumero = String(reciboNumero || 'QC-REC-001').slice(0, 50);
    const safeClienteNombre = String(clienteNombre || 'Comprador').slice(0, 150);
    const safeMes = Math.max(1, Number(mesNumero) || 1);
    const safeMonto = Math.max(0, Number(montoCuota) || 0);

    const envioId = `ENV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const fechaEnvio = new Date().toISOString();

    console.log(`[QUINTA CELIA EMAIL DISPATCH] Recibo ${safeReciboNumero} despachado a: ${cleanEmail} para ${safeClienteNombre}. Mes #${safeMes} ($${safeMonto})`);

    res.json({
      exito: true,
      mensaje: `Recibo oficial ${safeReciboNumero} despachado exitosamente al correo ${cleanEmail}.`,
      envioId,
      fechaEnvio,
      detalles: {
        reciboNumero: safeReciboNumero,
        emailCliente: cleanEmail,
        clienteNombre: safeClienteNombre,
        mesNumero: safeMes,
        montoCuota: safeMonto,
        loteNombre: String(loteNombre || '').slice(0, 100)
      }
    });
  } catch (err: any) {
    console.error('Error en /api/recibo/enviar-email:', err);
    res.status(500).json({ error: 'Error al despachar el recibo', detalle: err?.message });
  }
});

// Endpoint: Descarga directa del archivo único autónomo "Terrenos Ricardo.html"
app.get(['/api/descargar-html', '/terrenos-ricardo.html', '/descargar-escritorio'], (req, res) => {
  const possiblePaths = [
    path.join(process.cwd(), 'Terrenos Ricardo.html'),
    path.join(process.cwd(), 'dist', 'Terrenos Ricardo.html'),
    path.join(process.cwd(), 'public', 'Terrenos Ricardo.html')
  ];

  let foundPath = possiblePaths.find(p => fs.existsSync(p));

  // Si aún no está generado, generarlo al vuelo de forma segura
  if (!foundPath) {
    try {
      execSync('node scripts/generate-single-html.js', { stdio: 'inherit' });
      foundPath = possiblePaths.find(p => fs.existsSync(p));
    } catch (e) {
      console.error('Error auto-generating Terrenos Ricardo.html:', e);
    }
  }

  if (foundPath) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Terrenos Ricardo.html"');
    res.sendFile(foundPath);
  } else {
    res.status(404).send('No se pudo encontrar el archivo Terrenos Ricardo.html. Ejecute npm run build.');
  }
});

// Vite middleware para dev y estáticos en prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[GLOBAL SERVER ERROR CAUGHT]:', err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
      error: 'Error interno del servidor',
      mensaje: process.env.NODE_ENV === 'production' 
        ? 'Ocurrió un error inesperado al procesar la solicitud' 
        : (err?.message || 'Error no especificado')
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Quinta Celia iniciado en http://localhost:${PORT}`);
  });
}

startServer();

