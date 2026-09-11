import React, { useState } from 'react';
import { ClienteComprador, PagoRealizado, MedidasTerreno } from '../types';
import { formatMoneda } from '../utils/calculos';
import { TablaAmortizacion } from './TablaAmortizacion';
import { VisorTerreno2D } from './VisorTerreno2D';
import { BovedaDocumentosModal } from './BovedaDocumentosModal';

interface ControlPagosClientesProps {
  clientes: ClienteComprador[];
  clienteSeleccionadoId?: string;
  onSeleccionarCliente: (id: string) => void;
  onNuevoClienteClick: () => void;
  onBuscarClienteClick?: () => void;
  onRegistrarPagoClick: (cliente: ClienteComprador, mes?: number) => void;
  onVerReciboClick: (pago: PagoRealizado, cliente: ClienteComprador) => void;
  onAbrirTopografoConMedidas: (medidas: MedidasTerreno, clienteNombre?: string) => void;
  onActualizarDocumentos?: (clienteId: string, documentos: NonNullable<ClienteComprador['documentos']>) => void;
  monedaSimbolo?: string;
}

export const ControlPagosClientes: React.FC<ControlPagosClientesProps> = ({
  clientes,
  clienteSeleccionadoId,
  onSeleccionarCliente,
  onNuevoClienteClick,
  onBuscarClienteClick,
  onRegistrarPagoClick,
  onVerReciboClick,
  onAbrirTopografoConMedidas,
  onActualizarDocumentos,
  monedaSimbolo = '$'
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'al_dia' | 'en_mora' | 'liquidado'>('todos');
  const [isBovedaOpen, setIsBovedaOpen] = useState(false);
  const [tipoDocBoveda, setTipoDocBoveda] = useState<'copiaDui' | 'promesaVenta' | 'escrituraCompraVenta'>('copiaDui');

  const handleAbrirBoveda = (tipo: 'copiaDui' | 'promesaVenta' | 'escrituraCompraVenta' = 'copiaDui') => {
    setTipoDocBoveda(tipo);
    setIsBovedaOpen(true);
  };

  // Cliente activo
  const clienteActivo = clientes.find(c => c.id === clienteSeleccionadoId) || clientes[0];

  const normalizar = (txt: string) =>
    (txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]/g, '');

  // Filtrado por Nombre, DUI, Lote, Teléfono, etc.
  const clientesFiltrados = clientes.filter(c => {
    if (filtroEstado !== 'todos') {
      const esLiquidado = c.estado === 'liquidado' || ((c.amortizacion || []).length > 0 && (c.amortizacion || []).filter(a => a.estado !== 'pagado').length === 0);
      const esMora = c.estado === 'en_mora' || (c.amortizacion || []).some(a => a.estado === 'vencido');
      
      if (filtroEstado === 'liquidado' && !esLiquidado) return false;
      if (filtroEstado === 'en_mora' && (!esMora || esLiquidado)) return false;
      if (filtroEstado === 'al_dia' && (esLiquidado || esMora)) return false;
    }
    if (busqueda) {
      const q = busqueda.toLowerCase().trim();
      const qNorm = normalizar(busqueda);
      return (
        c.nombre.toLowerCase().includes(q) ||
        normalizar(c.nombre).includes(qNorm) ||
        (c.cedula && (c.cedula.toLowerCase().includes(q) || normalizar(c.cedula).includes(qNorm))) ||
        (c.telefono && (c.telefono.toLowerCase().includes(q) || normalizar(c.telefono).includes(qNorm))) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.loteNombre && c.loteNombre.toLowerCase().includes(q)) ||
        (c.loteNumero && c.loteNumero.toLowerCase().includes(q)) ||
        (c.direccion && c.direccion.toLowerCase().includes(q))
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onBuscarClienteClick && (
            <button
              onClick={onBuscarClienteClick}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              title="Buscar o seleccionar cliente existente por Nombre o DUI"
            >
              <span>👤</span>
              <span>Cliente Existente</span>
            </button>
          )}

          <button
            onClick={onNuevoClienteClick}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
            title="Registrar un nuevo cliente o comprador"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Buyer Selector (Sidebar / Grid) + Active Buyer Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Buyers List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Buscar por Nombre, DUI, Lote, Celular..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'al_dia', label: 'Pagando' },
                { id: 'en_mora', label: 'En Mora' },
                { id: 'liquidado', label: 'Liquidados' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltroEstado(f.id as any)}
                  className={`py-1 rounded-lg font-bold tracking-tight transition-colors cursor-pointer text-center truncate ${
                    filtroEstado === f.id
                      ? f.id === 'en_mora'
                        ? 'bg-rose-600 text-white'
                        : f.id === 'liquidado'
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
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
                const esLiquidado = cliente.estado === 'liquidado' || ((cliente.amortizacion || []).length > 0 && (cliente.amortizacion || []).filter(a => a.estado !== 'pagado').length === 0);
                const esMora = cliente.estado === 'en_mora' || (cliente.amortizacion || []).some(a => a.estado === 'vencido');

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
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-xs truncate">
                          {cliente.nombre}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-[11px] text-emerald-400 font-mono">
                            {cliente.loteNombre} (Lote #{cliente.loteNumero})
                          </p>
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            DUI: {cliente.cedula || 'Sin registrar'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        esLiquidado
                          ? 'bg-purple-950 text-purple-300 border border-purple-700'
                          : esMora
                          ? 'bg-rose-950 text-rose-300 border border-rose-700'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}>
                        {esLiquidado ? 'LIQUIDADO' : esMora ? 'EN MORA' : `${cuotasPagadas}/${totalCuotas} m`}
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

              {/* Bóveda de Documentos Legales del Expediente (DUI, Promesa de Venta, Escritura) */}
              <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-base font-bold">
                      📁
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                        <span>Bóveda de Documentos Legales</span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono font-semibold">
                          Expediente de Ricardo
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Copia de DUI, Promesa de Venta (120 meses) y Escritura de Compra Venta final
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleAbrirBoveda('copiaDui')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transition-all active:scale-95"
                      title="Escanear DUI, Promesa de Venta o Escritura con la cámara de tu celular o computadora"
                    >
                      <span>📷</span>
                      <span>Escanear Documento con Cámara</span>
                    </button>
                    <button
                      onClick={() => handleAbrirBoveda('copiaDui')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>📂</span>
                      <span>Ver Expediente</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tarjeta DUI */}
                  <div className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 p-3.5 rounded-2xl flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🪪</span> Copia de DUI
                        </span>
                        {clienteActivo.documentos?.copiaDui ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Registrado
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Pendiente
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1">
                        {clienteActivo.documentos?.copiaDui?.nombreArchivo || 'Copia de DUI del titular'}
                      </p>
                      {clienteActivo.documentos?.copiaDui && (
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Subido: {new Date(clienteActivo.documentos.copiaDui.fechaSubida).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAbrirBoveda('copiaDui')}
                      className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        clienteActivo.documentos?.copiaDui
                          ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      }`}
                    >
                      {clienteActivo.documentos?.copiaDui ? '👁️ Ver / Descargar DUI' : '📷 Escanear / Subir Copia DUI'}
                    </button>
                  </div>

                  {/* Tarjeta Promesa de Venta */}
                  <div className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 p-3.5 rounded-2xl flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>📝</span> Promesa de Venta
                        </span>
                        {clienteActivo.documentos?.promesaVenta ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Firmada
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Pendiente
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1">
                        {clienteActivo.documentos?.promesaVenta?.nombreArchivo || 'Contrato 120 meses'}
                      </p>
                      {clienteActivo.documentos?.promesaVenta && (
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Subido: {new Date(clienteActivo.documentos.promesaVenta.fechaSubida).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAbrirBoveda('promesaVenta')}
                      className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        clienteActivo.documentos?.promesaVenta
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      }`}
                    >
                      {clienteActivo.documentos?.promesaVenta ? '👁️ Ver Promesa Venta' : '📷 Escanear / Subir Promesa'}
                    </button>
                  </div>

                  {/* Tarjeta Escritura de Compra Venta */}
                  <div className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 p-3.5 rounded-2xl flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🏛️</span> Escritura Compraventa
                        </span>
                        {clienteActivo.documentos?.escrituraCompraVenta ? (
                          <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            ✓ Protocolizada
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded">
                            Al liquidar cuotas
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1">
                        {clienteActivo.documentos?.escrituraCompraVenta?.nombreArchivo || 'Copia final al término de 120 meses'}
                      </p>
                      {clienteActivo.documentos?.escrituraCompraVenta && (
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                          Subido: {new Date(clienteActivo.documentos.escrituraCompraVenta.fechaSubida).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAbrirBoveda('escrituraCompraVenta')}
                      className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        clienteActivo.documentos?.escrituraCompraVenta
                          ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {clienteActivo.documentos?.escrituraCompraVenta ? '👁️ Ver Escritura Final' : '📷 Escanear / Subir Escritura'}
                    </button>
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

      {/* Modal Bóveda de Documentos Legales */}
      {clienteActivo && isBovedaOpen && (
        <BovedaDocumentosModal
          isOpen={isBovedaOpen}
          onClose={() => setIsBovedaOpen(false)}
          cliente={clienteActivo}
          tipoDocumentoInicial={tipoDocBoveda}
          onActualizarDocumentos={(clienteId, docs) => {
            if (onActualizarDocumentos) {
              onActualizarDocumentos(clienteId, docs);
            }
          }}
        />
      )}

    </div>
  );
};
