import React, { useState } from 'react';

interface AccesoMovilModalProps {
  isOpen: boolean;
  onClose: () => void;
  urlPublica?: string;
}

export const AccesoMovilModal: React.FC<AccesoMovilModalProps> = ({
  isOpen,
  onClose,
  urlPublica = 'https://rick2818.github.io/Quinta-Celia-2026/'
}) => {
  const [copiado, setCopiado] = useState(false);
  const [pestañaGuia, setPestañaGuia] = useState<'android' | 'iphone'>('android');

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(urlPublica)}&color=020617&bgcolor=ffffff&qzone=2`;

  const handleCopiarEnlace = () => {
    navigator.clipboard.writeText(urlPublica);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const mensajeWhatsApp = encodeURIComponent(
    `👋 Hola, te comparto el acceso oficial al sistema de cobranza y terrenos de Quinta Celia:\n\n🔗 ${urlPublica}\n\n(Abre el enlace y selecciona "Añadir a pantalla de inicio" para tener el acceso directo en tu celular).`
  );

  const enlaceWhatsApp = `https://api.whatsapp.com/send?text=${mensajeWhatsApp}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl font-bold">
              📱
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Acceso Directo para Celulares</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Nube 24/7
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lleva la aplicación en el bolsillo para el trabajo en el terreno
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">

          {/* Banner de beneficios */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
            <span className="text-2xl shrink-0">⚡</span>
            <div>
              <p className="font-bold text-emerald-300">Independiente de la laptop:</p>
              <p className="text-slate-300 mt-0.5">
                La aplicación funciona aunque la computadora esté apagada. Los cobros y datos que registres en el terreno se guardan en la nube y aparecerán en la laptop automáticamente.
              </p>
            </div>
          </div>

          {/* Sección Código QR & Botones */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
            {/* Imagen QR */}
            <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0 flex flex-col items-center">
              <img 
                src={qrImageUrl} 
                alt="Código QR Quinta Celia" 
                className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
              />
              <span className="text-[10px] text-slate-600 font-mono mt-1 font-semibold">
                Escanea con tu cámara
              </span>
            </div>

            {/* Acciones para compartir */}
            <div className="space-y-3 flex-1 w-full text-center sm:text-left">
              <div>
                <h4 className="text-sm font-bold text-white">Escanea o Comparte el Enlace</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apunta la cámara de cualquier teléfono al código QR para abrir el módulo al instante.
                </p>
              </div>

              {/* Botón WhatsApp */}
              <a
                href={enlaceWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                <span>Enviar por WhatsApp al Celular</span>
              </a>

              {/* Botón Copiar URL */}
              <button
                onClick={handleCopiarEnlace}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{copiado ? '✓' : '🔗'}</span>
                <span>{copiado ? '¡Enlace copiado al portapapeles!' : 'Copiar Enlace Directo'}</span>
              </button>

              <p className="text-[11px] font-mono text-slate-500 break-all px-1">
                {urlPublica}
              </p>
            </div>
          </div>

          {/* Guía Paso a Paso para Crear el Acceso Directo */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📌</span>
                <span>Cómo fijar el icono en la pantalla de tu celular:</span>
              </h4>

              {/* Selector de SO */}
              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => setPestañaGuia('android')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    pestañaGuia === 'android'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Android
                </button>
                <button
                  onClick={() => setPestañaGuia('iphone')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    pestañaGuia === 'iphone'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  iPhone
                </button>
              </div>
            </div>

            {pestañaGuia === 'android' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <p className="font-bold text-white">Abre en Google Chrome</p>
                  <p className="text-slate-400 text-[11px]">
                    Abre el enlace o escanea el QR en Chrome desde tu teléfono Android.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <p className="font-bold text-white">Toca los 3 Puntos (⋮)</p>
                  <p className="text-slate-400 text-[11px]">
                    Presiona el menú de opciones en la esquina superior derecha.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <p className="font-bold text-white">Añadir a inicio</p>
                  <p className="text-slate-400 text-[11px]">
                    Elige <strong>"Añadir a la pantalla de inicio"</strong>. ¡Listo! Se creará el ícono de Quinta Celia.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <p className="font-bold text-white">Abre en Safari</p>
                  <p className="text-slate-400 text-[11px]">
                    Abre el enlace o escanea el QR con la cámara de tu iPhone en Safari.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <p className="font-bold text-white">Toca Compartir</p>
                  <p className="text-slate-400 text-[11px]">
                    Presiona el botón de Compartir (el ícono del cuadro con la flecha hacia arriba).
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <p className="font-bold text-white">Agregar a inicio</p>
                  <p className="text-slate-400 text-[11px]">
                    Desliza hacia abajo y toca <strong>"Agregar a pantalla de inicio"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer transition-all"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
