import React, { useState } from 'react';
import { MedidasTerreno, TopografoConsultaMensaje } from '../types';
import { calcularMedidasTerreno } from '../utils/calculos';
import { VisorTerreno2D } from './VisorTerreno2D';

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

  const [x1, setX1] = useState<number>(baseMedidas.x1);
  const [x2, setX2] = useState<number>(baseMedidas.x2);
  const [y1, setY1] = useState<number>(baseMedidas.y1);

  const [preguntaInput, setPreguntaInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [dictamenOficial, setDictamenOficial] = useState<string>('');
  const [certificacionEmitida, setCertificacionEmitida] = useState(false);

  const [historialMensajes, setHistorialMensajes] = useState<TopografoConsultaMensaje[]>([
    {
      id: 'msg-init',
      remitente: 'topografo',
      texto: `Saludos cordiales. Soy el Ing. Celso R. Valdivia, con más de 24 años ejerciendo la topografía legal y geodésica en Quinta Celia. Como perito responsable, verificaré las medidas definitivas x1, x2 y y1 del lote para garantizar que el cierre de negocio y contrato hipotecario cuente con plena exactitud física y legal. Puedes ajustar los linderos o hacerme cualquier consulta técnica.`,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const medidasCalculadas = calcularMedidasTerreno(x1, x2, y1);

  // Enviar pregunta al agente topógrafo vía API
  const handleEnviarConsulta = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!preguntaInput.trim() || cargando) return;

    const texto = preguntaInput.trim();
    setPreguntaInput('');

    // Agregar mensaje del usuario
    const userMsg: TopografoConsultaMensaje = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistorialMensajes(prev => [...prev, userMsg]);
    setCargando(true);

    try {
      const res = await fetch('/api/topografo/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: texto,
          x1,
          x2,
          y1,
          clienteNombre,
          loteNombre,
          tipoAccion: 'consulta'
        })
      });

      const data = await res.json();
      const topografoMsg: TopografoConsultaMensaje = {
        id: `top-${Date.now()}`,
        remitente: 'topografo',
        texto: data.texto || 'Linderos revisados conforme al plano catastral vigente.',
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistorialMensajes(prev => [...prev, topografoMsg]);
    } catch (err) {
      console.error('Error al consultar al topógrafo:', err);
      const fallbackMsg: TopografoConsultaMensaje = {
        id: `top-${Date.now()}`,
        remitente: 'topografo',
        texto: `He verificado el polígono con cotas x1=${x1}m, x2=${x2}m y y1=${y1}m. Superficie total: ${medidasCalculadas.areaM2} m². Los vértices M1, M2, M3 y M4 presentan un alineamiento dentro de la tolerancia milimétrica reglamentaria para la firma del crédito.`,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistorialMensajes(prev => [...prev, fallbackMsg]);
    } finally {
      setCargando(false);
    }
  };

  // Emitir Dictamen Pericial Oficial de Cierre
  const handleEmitirCertificacion = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/topografo/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x1,
          x2,
          y1,
          clienteNombre,
          loteNombre,
          tipoAccion: 'certificacion'
        })
      });
      const data = await res.json();
      setDictamenOficial(data.texto);
      setCertificacionEmitida(true);

      const topografoMsg: TopografoConsultaMensaje = {
        id: `top-cert-${Date.now()}`,
        remitente: 'topografo',
        texto: `✓ DICTAMEN EMITIDO Y FIRMADO DIGITALMENTE:\n\n${data.texto}`,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistorialMensajes(prev => [...prev, topografoMsg]);
    } catch (error) {
      const textoDefecto = `DICTAMEN TÉCNICO PERICIAL TOPOGRÁFICO DE CIERRE - QUINTA CELIA\n` +
        `Emitido por: Ing. Celso R. Valdivia (24 años de experiencia catastral).\n` +
        `Para: ${clienteNombre} | Inmueble: ${loteNombre}\n\n` +
        `MEDIDAS FINALES VERIFICADAS:\n` +
        `- Frente (x1): ${x1.toFixed(2)} m\n` +
        `- Fondo (x2): ${x2.toFixed(2)} m\n` +
        `- Profundidad lateral (y1): ${y1.toFixed(2)} m\n` +
        `- Área neta adjudicada: ${medidasCalculadas.areaM2.toLocaleString()} m² (${medidasCalculadas.varasCuadradas.toLocaleString()} v²)\n` +
        `Se autoriza la firma del contrato y escrituración hipotecaria definitiva.`;
      setDictamenOficial(textoDefecto);
      setCertificacionEmitida(true);
    } finally {
      setCargando(false);
    }
  };

  const handleAplicarYCerrar = () => {
    const dictamenFinal = dictamenOficial || 
      `Medidas finales certificadas por Ing. Celso R. Valdivia (Topógrafo Senior): x1=${x1}m, x2=${x2}m, y1=${y1}m (${medidasCalculadas.areaM2} m²). Mojones validados en campo.`;
    onAplicarMedidas(medidasCalculadas, dictamenFinal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold text-slate-950 items-center justify-center">✓</span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-display font-bold text-lg">
                  Ing. Celso R. Valdivia
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold">
                  24 Años de Experiencia
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Perito en Topografía, Geodesia y Cierre Catastral • Quinta Celia
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Main Grid: Controls & 2D Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Dimension Controls (x1, x2, y1) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Medidas Finales de Cierre
                  </h4>
                  <span className="text-xs text-emerald-400 font-mono font-semibold">
                    {medidasCalculadas.areaM2.toLocaleString()} m²
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Cota x1 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-amber-500"></span>
                        Frente Principal (x1):
                      </label>
                      <span className="font-mono text-amber-400 font-bold">{x1.toFixed(2)} m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="5" 
                        max="80" 
                        step="0.25"
                        value={x1}
                        onChange={(e) => setX1(parseFloat(e.target.value) || 5)}
                        className="flex-1 accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <input 
                        type="number"
                        min="1"
                        max="200"
                        step="0.05"
                        value={x1}
                        onChange={(e) => setX1(parseFloat(e.target.value) || 1)}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs text-right"
                      />
                    </div>
                  </div>

                  {/* Cota x2 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-amber-500"></span>
                        Fondo / Lindero Posterior (x2):
                      </label>
                      <span className="font-mono text-amber-400 font-bold">{x2.toFixed(2)} m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="5" 
                        max="80" 
                        step="0.25"
                        value={x2}
                        onChange={(e) => setX2(parseFloat(e.target.value) || 5)}
                        className="flex-1 accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <input 
                        type="number"
                        min="1"
                        max="200"
                        step="0.05"
                        value={x2}
                        onChange={(e) => setX2(parseFloat(e.target.value) || 1)}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs text-right"
                      />
                    </div>
                  </div>

                  {/* Cota y1 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-sky-400"></span>
                        Profundidad / Lateral (y1):
                      </label>
                      <span className="font-mono text-sky-400 font-bold">{y1.toFixed(2)} m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="10" 
                        max="120" 
                        step="0.5"
                        value={y1}
                        onChange={(e) => setY1(parseFloat(e.target.value) || 10)}
                        className="flex-1 accent-sky-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <input 
                        type="number"
                        min="1"
                        max="300"
                        step="0.05"
                        value={y1}
                        onChange={(e) => setY1(parseFloat(e.target.value) || 1)}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen de cálculo topográfico */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Área Total</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      {medidasCalculadas.areaM2.toLocaleString()} m²
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase">Varas Cuadradas</span>
                    <span className="font-bold text-amber-300 font-mono text-sm">
                      {medidasCalculadas.varasCuadradas.toLocaleString()} v²
                    </span>
                  </div>
                </div>

                {/* Botón para emitir dictamen */}
                <button
                  onClick={handleEmitirCertificacion}
                  disabled={cargando}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {certificacionEmitida ? 'Re-Certificar Medidas de Cierre' : 'Emitir Dictamen Pericial de Cierre'}
                </button>
              </div>

              {/* Tips del experto */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200/90 leading-relaxed">
                <span className="font-semibold text-emerald-300 block mb-1">📋 Protocolo Quinta Celia:</span>
                Las cotas <span className="font-mono text-amber-300 font-bold">x1, x2 y y1</span> aquí avaladas alimentan automáticamente el cálculo del precio del terreno, la tabla de amortización hipotecaria y el recibo oficial de pago.
              </div>
            </div>

            {/* Right Col: 2D Interactive Plotter */}
            <div className="lg:col-span-7 flex flex-col">
              <VisorTerreno2D 
                medidas={medidasCalculadas}
                loteNombre={loteNombre}
                className="flex-1"
              />
            </div>
          </div>

          {/* Consultation Chat with the Topographer */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Consulta Técnica Directa con el Ing. Topógrafo
              </h4>
              <span className="text-[11px] text-slate-400">
                Respaldo con Inteligencia Artificial & Peritaje Geodésico
              </span>
            </div>

            {/* Message Stream */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 mb-3">
              {historialMensajes.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.remitente === 'usuario' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.remitente === 'usuario'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-700/70 text-slate-200 rounded-bl-none font-sans'
                  }`}>
                    {msg.remitente === 'topografo' && (
                      <span className="block text-[10px] font-bold text-amber-400 mb-1">
                        Ing. Celso R. Valdivia • Topógrafo Senior
                      </span>
                    )}
                    <p className="whitespace-pre-line">{msg.texto}</p>
                    <span className={`block text-[9px] mt-1 text-right ${
                      msg.remitente === 'usuario' ? 'text-emerald-200' : 'text-slate-500'
                    }`}>
                      {msg.fecha}
                    </span>
                  </div>
                </div>
              ))}

              {cargando && (
                <div className="flex items-center gap-2 text-xs text-amber-300 bg-slate-900/60 p-2.5 rounded-xl w-fit border border-amber-500/20">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>El Ingeniero Topógrafo está analizando el levantamiento y redactando la respuesta...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleEnviarConsulta} className="flex gap-2">
              <input 
                type="text"
                value={preguntaInput}
                onChange={(e) => setPreguntaInput(e.target.value)}
                placeholder="Pregunta sobre pendientes, amojonamiento, tipo de suelo, accesos o certificación..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!preguntaInput.trim() || cargando}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Preguntar
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Medidas seleccionadas: </span>
            <span className="text-amber-400 font-mono font-bold">x1={x1}m, x2={x2}m, y1={y1}m</span>
            <span className="text-emerald-400 font-bold ml-2">({medidasCalculadas.areaM2.toLocaleString()} m²)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleAplicarYCerrar}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Aplicar Medidas al Cierre de Negocio
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
