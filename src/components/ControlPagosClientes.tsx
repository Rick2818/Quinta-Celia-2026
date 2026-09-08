import React, { useState } from 'react';
import { ClienteComprador, PagoRealizado, MedidasTerreno } from '../types';
import { formatMoneda } from '../utils/calculos';
import { TablaAmortizacion } from './TablaAmortizacion';
import { VisorTerreno2D } from './VisorTerreno2D';

interface ControlPagosClientesProps {
  clientes: ClienteComprador[];
  clienteSeleccionadoId?: string;
  onSeleccionarCliente: (id: string) => void;
  onNuevoClienteClick: () => void;
  onRegistrarPagoClick: (cliente: ClienteComprador, mes?: number) => void;
  onVerReciboClick: (pago: PagoRealizado, cliente: ClienteComprador) => void;
  onAbrirTopografoConMedidas: (medidas: MedidasTerreno, clienteNombre?: string) => void;
  monedaSimbolo?: string;
}

export const ControlPagosClientes: React.FC<ControlPagosClientesProps> = ({
  clientes,
  clienteSeleccionadoId,
  onSeleccionarCliente,
  onNuevoClienteClick,
  onRegistrarPagoClick,
  onVerReciboClick,
  onAbrirTopografoConMedidas,
  monedaSimbolo = '$'
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'liquidado'>('todos');

  // Cliente activo
  const clienteActivo = clientes.find(c => c.id === clienteSeleccionadoId) || clientes[0];

  // Filtrado
  const clientesFiltrados = clientes.filter(c => {
    if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.loteNombre.toLowerCase().includes(q) ||
        c.loteNumero.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <span>Control de Pagos y Cartera de Clientes</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {clientes.length} Compradores Registrados
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Seguimiento de cuotas mensuales, amortizaciones y despachos de recibos oficiales
          </p>
        </div>

        <button
          onClick={onNuevoClienteClick}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Registrar Nuevo Comprador
        </button>
      </div>

      {/* Main Layout: Buyer Selector (Sidebar / Grid) + Active Buyer Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Buyers List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, lote..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <div className="flex gap-1 text-[11px]">
              {(['todos', 'activo', 'liquidado'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroEstado(f)}
                  className={`flex-1 py-1 rounded-lg font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    filtroEstado === f
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* List of Buyers */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {clientesFiltrados.length === 0 ? (
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                No hay compradores que coincidan con la búsqueda.
              </div>
            ) : (
              clientesFiltrados.map(cliente => {
                const esSeleccionado = clienteActivo && clienteActivo.id === cliente.id;
                const cuotasPagadas = cliente.amortizacion.filter(c => c.estado === 'pagado').length;
                const totalCuotas = cliente.amortizacion.length;
                const porcentaje = Math.round((cuotasPagadas / totalCuotas) * 100);

                return (
                  <div
                    key={cliente.id}
                    onClick={() => onSeleccionarCliente(cliente.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      esSeleccionado
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-xs truncate">
                          {cliente.nombre}
                        </h4>
                        <p className="text-[11px] text-emerald-400 font-mono">
                          {cliente.loteNombre} (Lote #{cliente.loteNumero})
                        </p>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        cliente.estado === 'liquidado'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}>
                        {cliente.estado === 'liquidado' ? 'LIQUIDADO' : `${cuotasPagadas}/${totalCuotas} m`}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 space-y-0.5 font-sans">
                      <div className="flex items-center gap-1.5 truncate">
                        <span>📱 {cliente.telefono || 'Sin teléfono'}</span>
                        {cliente.email && <span className="text-slate-500">• {cliente.email}</span>}
                      </div>
                      <div className="flex justify-between text-[11px] pt-1">
                        <span className="font-mono text-slate-300">Cuota: <strong className="text-white">{formatMoneda(cliente.cuotaMensual)}</strong></span>
                        <span className="font-mono text-amber-400">{porcentaje}% pagado</span>
                      </div>
                    </div>

                    {/* Mini Progress */}
                    <div className="mt-2 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Col: Active Buyer's Complete Dashboard & Amortization Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {clienteActivo ? (
            <>
              {/* Buyer Header Dossier Card */}
              <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                      Expediente del Titular
                    </span>
                    <h3 className="text-xl font-display font-extrabold text-white">
                      {clienteActivo.nombre}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      DUI/Cédula: <strong className="text-slate-200 font-mono">{clienteActivo.cedula || 'Pendiente'}</strong> • Registrado el: {new Date(clienteActivo.creadoEn).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onRegistrarPagoClick(clienteActivo)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>$</span>
                      <span>Registrar Pago de Cuota</span>
                    </button>
                    <button
                      onClick={() => onRegistrarPagoClick(clienteActivo)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Realizar un abono extraordinario para reducir plazo o cuota mensual"
                    >
                      <span>✨</span>
                      <span>Abonar a Capital</span>
                    </button>
                    {clienteActivo.pagos && clienteActivo.pagos.length > 0 && (
                      <button
                        onClick={() => onVerReciboClick(clienteActivo.pagos[0], clienteActivo)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors"
                      >
                        Ver Último Recibo
                      </button>
                    )}
                  </div>

                </div>

                {/* Contact Data + Terrain Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 text-xs">
                  
                  {/* Contacto */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacto & Correo</span>
                    <p className="text-slate-200 flex items-center justify-between">
                      <span>📱 {clienteActivo.telefono}</span>
                      {clienteActivo.telefono && (
                        <a
                          href={`https://wa.me/${clienteActivo.telefono.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-400 hover:underline font-mono"
                        >
                          Abrir WhatsApp ↗
                        </a>
                      )}
                    </p>
                    <p className="text-slate-300 font-mono truncate">✉️ {clienteActivo.email}</p>
                    <p className="text-slate-400 truncate">📍 {clienteActivo.direccion || 'Quinta Celia'}</p>
                  </div>

                  {/* Terreno y Medidas */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Lote e Inmueble</span>
                      <button
                        onClick={() => onAbrirTopografoConMedidas(clienteActivo.medidas, clienteActivo.nombre)}
                        className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                      >
                        Ver Topografía ↗
                      </button>
                    </div>
                    <p className="text-white font-bold">{clienteActivo.loteNombre} (Lote #{clienteActivo.loteNumero})</p>
                    <p className="font-mono text-amber-300 text-[11px]">
                      x1: {clienteActivo.medidas.x1}m | x2: {clienteActivo.medidas.x2}m | y1: {clienteActivo.medidas.y1}m
                    </p>
                    <p className="font-mono text-emerald-400 text-[11px]">
                      Área: {clienteActivo.medidas.areaM2.toLocaleString()} m² ({clienteActivo.medidas.varasCuadradas.toLocaleString()} v²)
                    </p>
                  </div>

                  {/* Condiciones Financieras */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1 sm:col-span-2 lg:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Condición Hipotecaria</span>
                    <p className="text-slate-300 flex justify-between">
                      <span>Precio Total:</span>
                      <strong className="text-white font-mono">{formatMoneda(clienteActivo.precioTotal)}</strong>
                    </p>
                    <p className="text-slate-300 flex justify-between">
                      <span>Enganche Pagado:</span>
                      <strong className="text-emerald-400 font-mono">{formatMoneda(clienteActivo.enganche)} ({clienteActivo.enganchePorcentaje}%)</strong>
                    </p>
                    <p className="text-slate-300 flex justify-between">
                      <span>Financiado:</span>
                      <strong className="text-sky-400 font-mono">{formatMoneda(clienteActivo.montoFinanciado)} ({clienteActivo.plazoMeses} meses)</strong>
                    </p>
                  </div>

                </div>
              </div>

              {/* 2D Mini Visualizer & Topographer Dictamen Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-xl">
                  <VisorTerreno2D
                    medidas={clienteActivo.medidas}
                    nombreLote={clienteActivo.loteNombre}
                    numeroLote={clienteActivo.loteNumero}
                    clienteAsignado={clienteActivo.nombre}
                  />
                </div>

                <div className="md:col-span-7 bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                        Certificación Topográfica de Medidas Finales
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      "{clienteActivo.topografoDictamen || 'Medidas finales x1, x2 y y1 verificadas y protocolizadas.'}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Topógrafo Oficial: <strong className="text-slate-200">Ing. Celso R. Valdivia</strong></span>
                    <button
                      onClick={() => onAbrirTopografoConMedidas(clienteActivo.medidas, clienteActivo.nombre)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-semibold cursor-pointer"
                    >
                      Consultar Agente Topógrafo
                    </button>
                  </div>
                </div>
              </div>

              {/* Amortization Table & Monthly Payment Schedule */}
              <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Tabla de Amortización Mensual Detallada</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Desglose de Capital, Intereses y Saldos
                  </span>
                </div>

                <TablaAmortizacion
                  cliente={clienteActivo}
                  onRegistrarPagoClick={(mes) => onRegistrarPagoClick(clienteActivo, mes)}
                  onVerReciboClick={(pago) => onVerReciboClick(pago, clienteActivo)}
                  monedaSimbolo={monedaSimbolo}
                />
              </div>
            </>
          ) : (
            <div className="bg-slate-900/80 rounded-3xl p-12 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-3xl flex items-center justify-center mx-auto text-slate-500">
                👥
              </div>
              <h3 className="text-lg font-bold text-white">No hay ningún comprador seleccionado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Selecciona un cliente de la lista de la izquierda o crea uno nuevo para gestionar sus pagos mensuales y tabla de amortización.
              </p>
              <button
                onClick={onNuevoClienteClick}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg cursor-pointer"
              >
                + Registrar Primer Comprador
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
