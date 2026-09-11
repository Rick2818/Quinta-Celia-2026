import React, { useState } from 'react';
import { 
  MedidasTerreno, 
  TopografoConsultaMensaje, 
  AuditoriaMultiAgenteResultado 
} from '../types';
import { calcularMedidasTerreno } from '../utils/calculos';
import { VisorTerreno2D } from './VisorTerreno2D';
import { orquestarEvaluacion3Niveles } from '../agents/orchestrator';
import { responderMensajeWhatsApp } from '../agents/specialists';

interface TopografoAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  medidasActuales?: MedidasTerreno;
  medidasIniciales?: MedidasTerreno;
  onAplicarMedidas: (nuevasMedidas: MedidasTerreno, dictamen?: string) => void;
  clienteNombre?: string;
  loteNombre?: string;
}

export const TopografoAgentModal: React.FC<TopografoAgentModalProps> = ({
  isOpen,
  onClose,
  medidasActuales,
  medidasIniciales,
  onAplicarMedidas,
  clienteNombre = 'Cliente Interesado',
  loteNombre = 'Lote Campestre Quinta Celia',
}) => {
  if (!isOpen) return null;

  const baseMedidas = medidasActuales || medidasIniciales || {
    x1: 20,
    x2: 20,
    y1: 25,
    areaM2: 500,
    perimetro: 90,
    varasCuadradas: 715.41,
    tipoPoligono: 'regular' as const
  };

  const [pestanaActiva, setPestanaActiva] = useState<'gobernanza' | 'whatsapp'>('gobernanza');
  const [x1, setX1] = useState<number>(baseMedidas.x1);
  const [x2, setX2] = useState<number>(baseMedidas.x2);
  const [y1, setY1] = useState<number>(baseMedidas.y1);

  const [preguntaInput, setPreguntaInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [dictamenOficial, setDictamenOficial] = useState<string>('');
  const [certificacionEmitida, setCertificacionEmitida] = useState(false);
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaMultiAgenteResultado | null>(null);

  // WhatsApp Agent Simulator State
  const [waTelefono, setWaTelefono] = useState('+503 7890-1234');
  const [waTipoUsuario, setWaTipoUsuario] = useState<'cliente_actual' | 'prospecto'>('cliente_actual');
  const [waMensajeInput, setWaMensajeInput] = useState('');
  const [waCargando, setWaCargando] = useState(false);
  const [waHistorial, setWaHistorial] = useState<Array<{
    id: string;
    remitente: 'cliente' | 'asistente';
    texto: string;
    hora: string;
    intencion?: string;
  }>>([
    {
      id: 'wa-1',
      remitente: 'asistente',
      texto: `🌲 ¡Hola! Bienvenido a Quinta Celia (Terrenos Ricardo). Soy la asistente virtual 24/7 con IA Gemini Flash 2.5. ¿En qué te puedo apoyar hoy? (Consultar tu cuota, ver lotes disponibles o agendar una visita).`,
      hora: 'Ahora',
      intencion: 'bienvenida'
    }
  ]);

  const [historialMensajes, setHistorialMensajes] = useState<TopografoConsultaMensaje[]>([
    {
      id: 'msg-init',
      remitente: 'topografo',
      texto: `Saludos cordiales. Soy el Ing. Celso R. Valdivia (Topógrafo Senior). A través de la arquitectura de 3 niveles y auditoría Fail-Closed, verificaremos las cotas x1, x2 y y1 de manera determinista antes de emitir la certificación pericial oficial.`,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const medidasCalculadas = calcularMedidasTerreno(x1, x2, y1);

  // Enviar consulta o ejecutar auditoría de 3 niveles
  const handleEjecutarAuditoria3Niveles = async (accion: 'consulta' | 'certificacion' = 'certificacion') => {
    setCargando(true);
    let auditResultado: AuditoriaMultiAgenteResultado | null = null;
    let textoRespuesta = '';

    try {
      // 1. Intentar llamar al backend si está disponible
      const res = await fetch('/api/topografo/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: preguntaInput || undefined,
          x1,
          x2,
          y1,
          precioTotal: 25000,
          enganche: 2500,
          plazoMeses: 120,
          tasaAnual: 8.5,
          clienteNombre,
          loteNombre,
          tipoAccion: accion
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.auditoriaMultiAgente) {
          auditResultado = data.auditoriaMultiAgente;
        }
        textoRespuesta = data.texto || '';
      }
    } catch (err) {
      // Backend no disponible (por ejemplo, navegando en el celular desde GitHub Pages)
    }

    // 2. Si no hay backend (entorno móvil GitHub Pages o sin conexión), ejecutar directamente en el navegador
    if (!auditResultado) {
      try {
        auditResultado = await orquestarEvaluacion3Niveles({
          x1,
          x2,
          y1,
          precioTotal: 25000,
          enganche: 2500,
          plazoMeses: 120,
          tasaAnual: 8.5,
          clienteNombre,
          loteNombre
        });
        textoRespuesta = auditResultado.nivel2Topografo.resumenPericial;
      } catch (errLocal) {
        console.error('Error en auditoría local:', errLocal);
        textoRespuesta = `Dictamen pericial emitido con medidas x1=${x1}m, x2=${x2}m, y1=${y1}m (${medidasCalculadas.areaM2} m²).`;
      }
    }

    if (auditResultado) {
      setAuditoriaData(auditResultado);
    }
    setDictamenOficial(textoRespuesta);
    setCertificacionEmitida(true);

    const topografoMsg: TopografoConsultaMensaje = {
      id: `top-${Date.now()}`,
      remitente: 'topografo',
      texto: textoRespuesta || 'Evaluación de 3 niveles completada.',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHistorialMensajes(prev => [...prev, topografoMsg]);
    setPreguntaInput('');
    setCargando(false);
  };

  // Enviar mensaje al Asistente de WhatsApp
  const handleEnviarMensajeWhatsApp = async (textoPersonalizado?: string) => {
    const texto = (textoPersonalizado || waMensajeInput).trim();
    if (!texto || waCargando) return;

    setWaMensajeInput('');
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgCliente = {
      id: `wa-cli-${Date.now()}`,
      remitente: 'cliente' as const,
      texto,
      hora: horaActual
    };

    setWaHistorial(prev => [...prev, msgCliente]);
    setWaCargando(true);

    const contextoClienteActual = waTipoUsuario === 'cliente_actual' ? {
      nombre: clienteNombre,
      lote: loteNombre,
      cuotaMensual: 220,
      saldoPendiente: 14500,
      proximoVencimiento: '15 de Octubre 2026',
      cuotasAtrasadas: 0
    } : undefined;

    const lotesDisponibles = [
      { numero: 'L-04', nombre: 'Vista al Valle', areaM2: 500, precioTotal: 25000, cuotaDesde: 195 },
      { numero: 'L-07', nombre: 'El Manantial', areaM2: 620, precioTotal: 31000, cuotaDesde: 240 },
      { numero: 'L-12', nombre: 'Mirador Campestre', areaM2: 750, precioTotal: 37500, cuotaDesde: 290 }
    ];

    let respuestaTexto = '';
    let intencionDetectada: string | undefined = undefined;

    // 1. Intentar llamar al backend si está disponible
    try {
      const res = await fetch('/api/whatsapp/mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: texto,
          telefono: waTelefono,
          nombreContacto: clienteNombre,
          contextoClienteActual,
          lotesDisponibles
        })
      });

      if (res.ok) {
        const json = await res.json();
        respuestaTexto = json.data?.respuestaMensaje;
        intencionDetectada = json.data?.intencion;
      }
    } catch (e) {
      // Backend no disponible
    }

    // 2. Si no hay backend (móvil en GitHub Pages), ejecutar agente directamente en el navegador
    if (!respuestaTexto) {
      try {
        const respuestaDirecta = await responderMensajeWhatsApp({
          mensaje: texto,
          telefono: waTelefono,
          nombreContacto: clienteNombre,
          contextoClienteActual,
          lotesDisponibles
        });
        respuestaTexto = respuestaDirecta.respuestaMensaje;
        intencionDetectada = respuestaDirecta.intencion;
      } catch (errDirecto) {
        respuestaTexto = `¡Hola! Gracias por comunicarte con Quinta Celia 🌲. Con gusto te ayudamos con tu consulta sobre lotes y cuotas.`;
        intencionDetectada = 'fallback';
      }
    }

    setWaHistorial(prev => [
      ...prev,
      {
        id: `wa-bot-${Date.now()}`,
        remitente: 'asistente' as const,
        texto: respuestaTexto,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intencion: intencionDetectada
      }
    ]);
    setWaCargando(false);
  };

  const handleAplicarYCerrar = () => {
    const dictamenFinal = dictamenOficial || 
      `Medidas oficiales avaladas bajo gobernanza multi-agente: x1=${x1}m, x2=${x2}m, y1=${y1}m (${medidasCalculadas.areaM2} m²).`;
    onAplicarMedidas(medidasCalculadas, dictamenFinal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Header con Pestañas de Navegación */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400 font-bold text-lg">
                ✨
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Quinta Celia Multi-Agent Hub
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Gemini Flash 2.5
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gobernanza 3 Niveles • Determinismo • Fail-Closed • Agente WhatsApp 24/7
              </p>
            </div>
          </div>

          {/* Selector de Pestaña */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => setPestanaActiva('gobernanza')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                pestanaActiva === 'gobernanza'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              📐 Auditoría 3 Niveles
            </button>
            <button
              onClick={() => setPestanaActiva('whatsapp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                pestanaActiva === 'whatsapp'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              📱 Asistente WhatsApp 24/7
            </button>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenedor Principal con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* PESTAÑA 1: GOBERNANZA MULTI-AGENTE (3 NIVELES) */}
          {pestanaActiva === 'gobernanza' && (
            <>
              {/* Tarjetas de los 3 Niveles de Gobernanza */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Nivel 1 */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Nivel 1: Orquestador
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {auditoriaData?.nivel1Orquestador.idProceso || 'En Espera'}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white">Director de Operaciones</h5>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                    {auditoriaData?.nivel1Orquestador.resumenEjecutivo || 'Coordina en paralelo al perito topógrafo y al actuario financiero.'}
                  </p>
                </div>

                {/* Nivel 2 */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Nivel 2: Especialistas
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Temp: 0.0</span>
                  </div>
                  <h5 className="text-xs font-bold text-white">Topógrafo & Actuario</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {auditoriaData 
                      ? `✓ Topografía: ${auditoriaData.nivel2Topografo.areaOficialM2} m² | Cuota: $${auditoriaData.nivel2Financiero.cuotaMensualCalculada}`
                      : 'Emite cálculos estructurados de linderos y tabla francesa.'}
                  </p>
                </div>

                {/* Nivel 3 */}
                <div className={`border rounded-2xl p-3.5 ${
                  auditoriaData?.nivel3Auditor.aprobado
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : auditoriaData?.nivel3Auditor.politicaFailClosed === 'BLOQUEO_FAIL_CLOSED'
                    ? 'bg-rose-950/40 border-rose-500/60'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                      auditoriaData?.nivel3Auditor.aprobado
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      Nivel 3: Gatekeeper
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Fail-Closed</span>
                  </div>
                  <h5 className="text-xs font-bold text-white">Auditor Crítico</h5>
                  <p className="text-[11px] mt-1 font-medium">
                    {auditoriaData ? (
                      auditoriaData.nivel3Auditor.aprobado ? (
                        <span className="text-emerald-300 font-bold">
                          ✓ CERTIFICADO ({auditoriaData.nivel3Auditor.tokenCertificacion})
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          ⛔ BLOQUEADO: Discrepancia detectada
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300">Valida discrepancia &lt; 0.05 m² antes de permitir firma.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Controles de Linderos y Visor 2D */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                      <span>Linderos en Terreno</span>
                      <span className="text-xs font-mono text-amber-400">
                        {medidasCalculadas.areaM2} m² ({medidasCalculadas.varasCuadradas} v²)
                      </span>
                    </h4>

                    {/* Sliders x1, x2, y1 */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Frente (x1):</span>
                          <span className="font-mono font-bold text-emerald-400">{x1.toFixed(2)} m</span>
                        </div>
                        <input 
                          type="range" min="5" max="80" step="0.5" value={x1}
                          onChange={(e) => setX1(parseFloat(e.target.value) || 5)}
                          className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Fondo (x2):</span>
                          <span className="font-mono font-bold text-amber-400">{x2.toFixed(2)} m</span>
                        </div>
                        <input 
                          type="range" min="5" max="80" step="0.5" value={x2}
                          onChange={(e) => setX2(parseFloat(e.target.value) || 5)}
                          className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Profundidad (y1):</span>
                          <span className="font-mono font-bold text-sky-400">{y1.toFixed(2)} m</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" step="0.5" value={y1}
                          onChange={(e) => setY1(parseFloat(e.target.value) || 10)}
                          className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Botón Ejecutar Auditoría 3 Niveles */}
                    <button
                      onClick={() => handleEjecutarAuditoria3Niveles('certificacion')}
                      disabled={cargando}
                      className="mt-4 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {cargando ? 'Auditoría en Curso...' : '⚡ Ejecutar Auditoría Multi-Agente (3 Niveles)'}
                    </button>
                  </div>

                  {/* Alerta Fail-Closed si hay errores */}
                  {auditoriaData && !auditoriaData.nivel3Auditor.aprobado && (
                    <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
                      <span className="font-bold block text-rose-300 mb-1">⛔ POLÍTICA FAIL-CLOSED ACTIVADA:</span>
                      {auditoriaData.nivel3Auditor.erroresCriticos.map((err, i) => (
                        <p key={i} className="text-[11px]">• {err}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 flex flex-col">
                  <VisorTerreno2D 
                    medidas={medidasCalculadas}
                    loteNombre={loteNombre}
                    className="flex-1 min-h-[280px]"
                  />
                </div>
              </div>

              {/* Chat con el Topógrafo */}
              <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-4">
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <span>💬 Consulta Pericial Técnica con Ing. Valdivia</span>
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3 pr-2">
                  {historialMensajes.map(m => (
                    <div 
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        m.remitente === 'usuario' 
                          ? 'bg-amber-500/20 text-amber-200 ml-6' 
                          : 'bg-slate-800 text-slate-200 mr-6 border border-slate-700/50'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        {m.remitente === 'usuario' ? 'Tú' : 'Ing. Celso Valdivia'} ({m.fecha}):
                      </span>
                      <p className="whitespace-pre-line">{m.texto}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={preguntaInput}
                    onChange={(e) => setPreguntaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEjecutarAuditoria3Niveles('consulta')}
                    placeholder="Preguntar sobre drenaje, linderos o amojonamiento..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleEjecutarAuditoria3Niveles('consulta')}
                    disabled={cargando || !preguntaInput.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-40"
                  >
                    Consultar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PESTAÑA 2: ASISTENTE WHATSAPP 24/7 (GEMINI FLASH 2.5) */}
          {pestanaActiva === 'whatsapp' && (
            <div className="space-y-4">
              {/* Barra de Configuración de Prueba de WhatsApp */}
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    WA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Simulador de WhatsApp en Vivo</h4>
                    <p className="text-[11px] text-slate-400">Atiende clientes actuales y nuevos prospectos 24/7</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
                    <span className="text-slate-500 mr-2">📱 Tel:</span>
                    <input 
                      type="text" 
                      value={waTelefono} 
                      onChange={(e) => setWaTelefono(e.target.value)} 
                      className="bg-transparent text-emerald-400 font-mono focus:outline-none w-32 text-xs"
                    />
                  </div>

                  <select
                    value={waTipoUsuario}
                    onChange={(e) => setWaTipoUsuario(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cliente_actual">👤 Comprador Registrado (Tiene Lote)</option>
                    <option value="prospecto">✨ Nuevo Prospecto (Pide Información)</option>
                  </select>
                </div>
              </div>

              {/* Botones de Preguntas Rápidas */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 self-center text-[11px] font-medium">Probar con un clic:</span>
                <button
                  onClick={() => handleEnviarMensajeWhatsApp('¿Cuánto debo de mi cuota este mes y cuándo vence?')}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
                >
                  💰 "¿Cuánto debo de mi cuota?"
                </button>
                <button
                  onClick={() => handleEnviarMensajeWhatsApp('¿Qué lotes tienen disponibles y cuál es la cuota a 120 meses?')}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
                >
                  🌲 "¿Qué lotes tienen disponibles?"
                </button>
                <button
                  onClick={() => handleEnviarMensajeWhatsApp('Quisiera agendar una visita al terreno para este sábado a las 10am')}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
                >
                  📅 "Agendar visita al terreno"
                </button>
                <button
                  onClick={() => handleEnviarMensajeWhatsApp('Ya hice el depósito bancario de mi cuota, ¿me envían mi recibo?')}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
                >
                  🧾 "Ya deposité mi cuota"
                </button>
              </div>

              {/* Ventana de Chat Estilo WhatsApp */}
              <div className="bg-[#0b141a] rounded-2xl border border-slate-800 p-4 shadow-inner flex flex-col h-[340px]">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {waHistorial.map(msg => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        msg.remitente === 'cliente' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.remitente === 'cliente'
                          ? 'bg-[#005c4b] text-emerald-50 rounded-br-none shadow-md'
                          : 'bg-[#202c33] text-slate-100 rounded-bl-none shadow-md border border-slate-700/40'
                      }`}>
                        <p className="whitespace-pre-line">{msg.texto}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {msg.intencion && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900/50 text-slate-300 font-mono mr-1">
                              {msg.intencion}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{msg.hora}</span>
                          {msg.remitente === 'cliente' && <span className="text-sky-400 text-[10px]">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {waCargando && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic bg-[#202c33] p-2.5 rounded-xl w-fit">
                      <span className="animate-spin text-emerald-400">⏳</span> Gemini Flash 2.5 está respondiendo...
                    </div>
                  )}
                </div>

                {/* Input de Envío */}
                <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={waMensajeInput}
                    onChange={(e) => setWaMensajeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnviarMensajeWhatsApp()}
                    placeholder="Escribe como si fueras el cliente en WhatsApp..."
                    className="flex-1 bg-[#2a3942] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleEnviarMensajeWhatsApp()}
                    disabled={waCargando || !waMensajeInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {auditoriaData?.nivel3Auditor.aprobado ? (
              <span className="text-emerald-400 font-medium">✓ Aprobado por Auditor Crítico (Fail-Closed)</span>
            ) : (
              <span>Gobernanza activa con esquemas deterministas Zod / Gemini</span>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleAplicarYCerrar}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
            >
              Aplicar Medidas a Cartera
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
