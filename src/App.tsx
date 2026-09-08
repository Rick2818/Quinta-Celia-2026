import React, { useState, useEffect } from 'react';
import { 
  ClienteComprador, 
  PagoRealizado, 
  MedidasTerreno, 
  SupabaseSettings,
  SistemaConfig 
} from './types';
import { 
  calcularMedidasTerreno, 
  calcularCuotaMensual, 
  formatMoneda,
  actualizarMoraAmortizacion 
} from './utils/calculos';
import { CLIENTES_SEED } from './data/seedData';
import { 
  obtenerSupabaseConfig, 
  guardarSupabaseConfig, 
  cargarClientesDesdeSupabase, 
  guardarClienteEnSupabase, 
  guardarPagoEnSupabase,
  defaultSupabaseSettings
} from './services/supabaseService';

import { QuintaCeliaLogo } from './components/BrandAssets';
import { SimuladorHipotecario } from './components/SimuladorHipotecario';
import { ControlPagosClientes } from './components/ControlPagosClientes';
import { TopografoAgentModal } from './components/TopografoAgentModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { NuevoCompradorModal } from './components/NuevoCompradorModal';
import { RegistroPagoModal } from './components/RegistroPagoModal';
import { ReciboPagoModal } from './components/ReciboPagoModal';
import { ExportarEscritorioModal } from './components/ExportarEscritorioModal';
import { BackupModal } from './components/BackupModal';
import { BuscarClienteModal } from './components/BuscarClienteModal';


export default function App() {
  // Navigation Tabs
  const [pestañaActiva, setPestañaActiva] = useState<'simulador' | 'clientes' | 'topografo'>('simulador');

  // Clientes y Almacenamiento
  const [clientes, setClientes] = useState<ClienteComprador[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('quinta_celia_clientes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Protección activa: error al leer clientes locales, usando datos semilla.', e);
    }
    return CLIENTES_SEED;
  });

  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>(
    clientes[0]?.id || ''
  );

  // Supabase Configuration
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseSettings>(() => {
    try {
      return obtenerSupabaseConfig();
    } catch {
      return defaultSupabaseSettings;
    }
  });

  // Sistema y Divisas Configuration
  const [configSistema, setConfigSistema] = useState<SistemaConfig>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('quinta_celia_config_sistema');
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return {
      monedaSimbolo: '$',
      monedaCodigo: 'USD',
      tasaMoraMensual: 5.0, // Regla de negocio Quinta Celia: 3% a 5%
      diasGraciaMora: 5,
    };
  });

  // Guardar configuración del sistema
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('quinta_celia_config_sistema', JSON.stringify(configSistema));
      }
    } catch (e) {
      console.warn('Error al guardar configuración del sistema:', e);
    }
  }, [configSistema]);

  // Actualizar mora en cuotas cuando cambia la configuración o al inicio
  useEffect(() => {
    setClientes(prev => prev.map(c => ({
      ...c,
      amortizacion: actualizarMoraAmortizacion(c.amortizacion || [], configSistema.tasaMoraMensual, configSistema.diasGraciaMora)
    })));
  }, [configSistema.tasaMoraMensual, configSistema.diasGraciaMora]);

  // Medidas topográficas activas en simulador (x1, x2, y1)
  const [medidasActivas, setMedidasActivas] = useState<MedidasTerreno>(() => 
    calcularMedidasTerreno(20, 20, 25)
  );

  // Modals state
  const [isTopografoOpen, setIsTopografoOpen] = useState(false);
  const [topografoClienteNombre, setTopografoClienteNombre] = useState<string | undefined>(undefined);

  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false);
  const [datosSimulacionPrellenados, setDatosSimulacionPrellenados] = useState<any>(null);

  const [isRegistroPagoOpen, setIsRegistroPagoOpen] = useState(false);
  const [clienteParaPago, setClienteParaPago] = useState<ClienteComprador | null>(null);
  const [mesParaPago, setMesParaPago] = useState<number | undefined>(undefined);

  const [isReciboOpen, setIsReciboOpen] = useState(false);
  const [pagoParaRecibo, setPagoParaRecibo] = useState<PagoRealizado | null>(null);
  const [clienteParaRecibo, setClienteParaRecibo] = useState<ClienteComprador | null>(null);

  const [isExportarEscritorioOpen, setIsExportarEscritorioOpen] = useState(false);
  const [isBuscarClienteOpen, setIsBuscarClienteOpen] = useState(false);

  // Atajo global de teclado para abrir búsqueda (Ctrl+K o Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'b')) {
        e.preventDefault();
        setIsBuscarClienteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSeleccionarClienteDesdeBusqueda = (cliente: ClienteComprador) => {
    setClientes(prev => {
      if (!prev.some(c => c.id === cliente.id)) {
        return [cliente, ...prev];
      }
      return prev;
    });
    setClienteSeleccionadoId(cliente.id);
    setPestañaActiva('clientes');
    mostrarNotificacion(`Expediente de "${cliente.nombre}" cargado.`, 'info');
  };


  // Toast Notification
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'info'; mensaje: string } | null>(null);

  const mostrarNotificacion = (mensaje: string, tipo: 'exito' | 'info' = 'exito') => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // Guardar clientes en localStorage de forma segura
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('quinta_celia_clientes', JSON.stringify(clientes));
      }
    } catch (e) {
      console.warn('No se pudo persistir en localStorage (cuota excedida o modo privado):', e);
    }
  }, [clientes]);


  // Intentar cargar datos de Supabase si está conectado
  useEffect(() => {
    if (supabaseConfig.conectado && supabaseConfig.url && supabaseConfig.anonKey) {
      cargarClientesDesdeSupabase(supabaseConfig).then(clientesRemotos => {
        if (clientesRemotos && clientesRemotos.length > 0) {
          setClientes(clientesRemotos);
          mostrarNotificacion(`Sincronizados ${clientesRemotos.length} clientes desde Supabase Cloud.`, 'info');
        }
      }).catch(err => console.log('Supabase sync notice:', err));
    }
  }, [supabaseConfig.conectado]);

  // Total de pagos registrados en todo el sistema para correlativo de recibos
  const totalPagosHistoricos = clientes.reduce((acc, c) => acc + (c.pagos?.length || 0), 0);

  // Handlers
  const handleGuardarNuevoCliente = async (nuevoCliente: ClienteComprador) => {
    setClientes(prev => [nuevoCliente, ...prev]);
    setClienteSeleccionadoId(nuevoCliente.id);
    setPestañaActiva('clientes');
    mostrarNotificacion(`✓ Comprador "${nuevoCliente.nombre}" registrado exitosamente.`);

    if (supabaseConfig.conectado) {
      const res = await guardarClienteEnSupabase(supabaseConfig, nuevoCliente);
      if (res.exito) {
        mostrarNotificacion(`✓ Cliente respaldado en Supabase.`);
      }
    }
  };

  const handleGuardarPago = async (nuevoPago: PagoRealizado, clienteActualizado: ClienteComprador) => {
    setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));
    mostrarNotificacion(`✓ Pago de Cuota #${nuevoPago.mesNumero} registrado. Recibo: ${nuevoPago.reciboNumero}`);

    // Abrir automáticamente el modal de recibo oficial para visualización y despacho por email
    setPagoParaRecibo(nuevoPago);
    setClienteParaRecibo(clienteActualizado);
    setIsReciboOpen(true);

    if (supabaseConfig.conectado) {
      await guardarPagoEnSupabase(supabaseConfig, nuevoPago);
      await guardarClienteEnSupabase(supabaseConfig, clienteActualizado);
    }
  };

  const handleActualizarEmailCliente = (nuevoEmail: string) => {
    if (clienteParaRecibo) {
      const clienteAct = { ...clienteParaRecibo, email: nuevoEmail };
      setClientes(prev => prev.map(c => c.id === clienteAct.id ? clienteAct : c));
      setClienteParaRecibo(clienteAct);
      mostrarNotificacion(`Email actualizado para ${clienteAct.nombre}`);
    }
  };

  const handleProcederDesdeSimulador = (datosSim: any) => {
    setDatosSimulacionPrellenados(datosSim);
    setIsNuevoClienteOpen(true);
  };

  const [descargandoZipNavbar, setDescargandoZipNavbar] = useState(false);

  const handleDescargarZipNavbar = async () => {
    setDescargandoZipNavbar(true);
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`/api/descargar-zip${cacheBuster}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (!response.ok) throw new Error('Error al descargar ZIP');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'fuente-terrenos-ricardo.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      mostrarNotificacion('¡Paquete ZIP descargado exitosamente!');
    } catch (err) {
      window.location.href = `/api/descargar-zip?t=${Date.now()}`;
    } finally {
      setDescargandoZipNavbar(false);
    }
  };

  const handleAbrirTopografoDesdeMedidas = (medidas: MedidasTerreno, clienteNombre?: string) => {
    setMedidasActivas(medidas);
    setTopografoClienteNombre(clienteNombre);
    setIsTopografoOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Main Navigation Bar */}
      <nav className="no-print sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Tabs */}
            <div className="flex items-center gap-2 sm:gap-3">
              <QuintaCeliaLogo size="sm" variant="light" className="mr-1 hidden sm:inline-flex select-none" />

              <button
                id="btn-tab-simulador"
                onClick={() => setPestañaActiva('simulador')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  pestañaActiva === 'simulador'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>📊</span>
                <span>Cotizador de Terrenos</span>
              </button>

              <button
                id="btn-tab-clientes"
                onClick={() => setPestañaActiva('clientes')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  pestañaActiva === 'clientes'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>👥</span>
                <span>Control de Pagos ({clientes.length})</span>
              </button>

              <button
                id="btn-tab-topografo"
                onClick={() => {
                  setTopografoClienteNombre(undefined);
                  setIsTopografoOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>📐</span>
                <span className="hidden sm:inline">Topógrafo Senior AI</span>
                <span className="sm:hidden">Topógrafo</span>
              </button>
            </div>

            {/* Right Tools (Search, Export/Desktop, ZIP, Backup, Supabase & New Buyer) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="btn-nav-buscar-cliente"
                onClick={() => setIsBuscarClienteOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                title="Buscar cliente por Nombre o DUI en la base de datos (Ctrl+K)"
              >
                <span>🔍</span>
                <span>Buscar Cliente</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono hidden sm:inline">DUI</span>
              </button>

              <button
                id="btn-nav-backup"
                onClick={() => setIsBackupOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Centro de Respaldos JSON/CSV y Configuración de Divisas/Mora"
              >
                <span>🛡️</span>
                <span className="hidden sm:inline">Respaldos</span>
              </button>

              <button
                id="btn-nav-descargar-zip"
                onClick={handleDescargarZipNavbar}
                disabled={descargandoZipNavbar}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 ring-1 ring-amber-300/50"
                title="Descargar paquete ZIP con todo el código fuente del proyecto (ideal para Antigravity)"
              >
                <span>📦</span>
                <span>{descargandoZipNavbar ? 'Descargando...' : 'Descargar ZIP'}</span>
              </button>


              <button
                id="btn-guardar-escritorio"
                onClick={() => setIsExportarEscritorioOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Descargar Terrenos Ricardo.html para Windows"
              >
                <span>💾</span>
                <span className="hidden sm:inline">Guardar en Escritorio</span>
                <span className="sm:hidden">Escritorio</span>
              </button>

              <button
                onClick={() => setIsSupabaseOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  supabaseConfig.conectado
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Configuración de base de datos Supabase"
              >
                <span className={`w-2 h-2 rounded-full ${supabaseConfig.conectado ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="hidden md:inline">{supabaseConfig.conectado ? 'Supabase Conectado' : 'Configurar Supabase'}</span>
                <span className="md:hidden">Supabase</span>
              </button>

              <button
                onClick={() => {
                  setDatosSimulacionPrellenados(null);
                  setIsNuevoClienteOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>+</span>
                <span className="hidden sm:inline">Nuevo Comprador</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Notification Toast */}
      {notificacion && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-900 border-emerald-500 text-white'
              : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}>
            <span>{notificacion.mensaje}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {pestañaActiva === 'simulador' && (
          <SimuladorHipotecario
            medidasTopograficas={medidasActivas}
            onAbrirTopografo={() => {
              setTopografoClienteNombre(undefined);
              setIsTopografoOpen(true);
            }}
            onCrearClienteConSimulacion={handleProcederDesdeSimulador}
          />
        )}

        {pestañaActiva === 'clientes' && (
          <ControlPagosClientes
            clientes={clientes}
            clienteSeleccionadoId={clienteSeleccionadoId}
            onSeleccionarCliente={(id) => setClienteSeleccionadoId(id)}
            onNuevoClienteClick={() => {
              setDatosSimulacionPrellenados(null);
              setIsNuevoClienteOpen(true);
            }}
            onBuscarClienteClick={() => setIsBuscarClienteOpen(true)}
            onRegistrarPagoClick={(cliente, mes) => {
              setClienteParaPago(cliente);
              setMesParaPago(mes);
              setIsRegistroPagoOpen(true);
            }}
            onVerReciboClick={(pago, cliente) => {
              setPagoParaRecibo(pago);
              setClienteParaRecibo(cliente);
              setIsReciboOpen(true);
            }}
            onAbrirTopografoConMedidas={handleAbrirTopografoDesdeMedidas}
            monedaSimbolo={configSistema.monedaSimbolo}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 py-6 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-300">Quinta Celia</span>
            <span>• Cotizador de Terrenos & Control de Cartera</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Topografía Oficial: x1, x2, y1</span>
            <span>•</span>
            <span>Amortización Francesa Nivelada</span>
            <span>•</span>
            <span>Supabase Cloud Sync</span>
          </div>
        </div>
      </footer>

      {/* ===================== MODALS ===================== */}

      {/* 1. Topógrafo AI Senior Modal */}
      <TopografoAgentModal
        isOpen={isTopografoOpen}
        onClose={() => setIsTopografoOpen(false)}
        medidasIniciales={medidasActivas}
        clienteNombre={topografoClienteNombre}
        onAplicarMedidas={(nuevasMedidas) => {
          setMedidasActivas(nuevasMedidas);
          mostrarNotificacion(`✓ Medidas finales x1=${nuevasMedidas.x1}m, x2=${nuevasMedidas.x2}m, y1=${nuevasMedidas.y1}m actualizadas con aval del Topógrafo.`);
        }}
      />

      {/* 2. Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        configActual={supabaseConfig}
        onGuardarConfig={(nueva) => {
          setSupabaseConfig(nueva);
          mostrarNotificacion(nueva.conectado ? '✓ Conexión con Supabase guardada y activa.' : 'Modo local activo.');
        }}
      />

      {/* 3. Nuevo Comprador / Lead Modal */}
      <NuevoCompradorModal
        isOpen={isNuevoClienteOpen}
        onClose={() => setIsNuevoClienteOpen(false)}
        datosIniciales={datosSimulacionPrellenados}
        onGuardarCliente={handleGuardarNuevoCliente}
        onAbrirTopografo={() => {
          setIsTopografoOpen(true);
        }}
      />

      {/* 4. Registro de Pago de Cuota y Abonos Modal */}
      {clienteParaPago && (
        <RegistroPagoModal
          isOpen={isRegistroPagoOpen}
          onClose={() => {
            setIsRegistroPagoOpen(false);
            setClienteParaPago(null);
          }}
          cliente={clienteParaPago}
          mesSugerido={mesParaPago}
          totalPagosHistoricos={totalPagosHistoricos}
          onGuardarPago={handleGuardarPago}
          monedaSimbolo={configSistema.monedaSimbolo}
        />
      )}

      {/* 5. Recibo Oficial y Despacho por Correo Electrónico Modal */}
      {pagoParaRecibo && clienteParaRecibo && (
        <ReciboPagoModal
          isOpen={isReciboOpen}
          onClose={() => {
            setIsReciboOpen(false);
            setPagoParaRecibo(null);
            setClienteParaRecibo(null);
          }}
          pago={pagoParaRecibo}
          cliente={clienteParaRecibo}
          onActualizarEmailCliente={handleActualizarEmailCliente}
        />
      )}

      {/* 6. Modal Guardar en Escritorio & Exportar Código Fuente */}
      <ExportarEscritorioModal
        isOpen={isExportarEscritorioOpen}
        onClose={() => setIsExportarEscritorioOpen(false)}
      />

      {/* 7. Modal de Copias de Seguridad & Configuración de Divisas */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        clientes={clientes}
        configSistema={configSistema}
        configSupabase={supabaseConfig}
        onActualizarConfigSistema={(nueva) => {
          setConfigSistema(nueva);
          mostrarNotificacion('✓ Configuración financiera y regla de mora guardada.');
        }}
        onRestaurarDatos={(nuevosClientes, nuevaConfig) => {
          setClientes(nuevosClientes);
          if (nuevosClientes.length > 0) {
            setClienteSeleccionadoId(nuevosClientes[0].id);
          }
          if (nuevaConfig) {
            setConfigSistema(nuevaConfig);
          }
          mostrarNotificacion(`✓ Base de datos restaurada: ${nuevosClientes.length} compradores cargados.`);
        }}
      />

      {/* 8. Modal de Búsqueda Avanzada por Nombre o DUI */}
      <BuscarClienteModal
        isOpen={isBuscarClienteOpen}
        onClose={() => setIsBuscarClienteOpen(false)}
        clientes={clientes}
        onSeleccionarCliente={handleSeleccionarClienteDesdeBusqueda}
        onRegistrarPagoCliente={(cliente) => {
          setClienteParaPago(cliente);
          setMesParaPago(undefined);
          setIsRegistroPagoOpen(true);
        }}
        onNuevoClienteConDatos={(datos) => {
          setDatosSimulacionPrellenados(datos);
          setIsNuevoClienteOpen(true);
        }}
        supabaseConfig={supabaseConfig}
        monedaSimbolo={configSistema.monedaSimbolo}
      />

    </div>
  );
}

