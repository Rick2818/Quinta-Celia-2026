import React, { useState } from 'react';

interface ExportarEscritorioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportarEscritorioModal: React.FC<ExportarEscritorioModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [descargando, setDescargando] = useState(false);
  const [descargandoZip, setDescargandoZip] = useState(false);
  const [descargadoExito, setDescargadoExito] = useState(false);
  const [copiadoExito, setCopiadoExito] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  // Descarga 100% en memoria con Blob local (evita navegación a nuevas pestañas y bloqueos de Cookie Check)
  const handleDescargarHtmlDirecto = async () => {
    setDescargando(true);
    setErrorDescarga(null);
    setDescargadoExito(false);

    try {
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`/api/descargar-html${cacheBuster}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (!response.ok) {
        throw new Error('No se pudo obtener el archivo desde el servidor');
      }
      const htmlText = await response.text();

      // Verificar que no sea la página de error de cookies de Cloud Run
      if (htmlText.includes('blocking a required security cookie') || htmlText.includes('Cookie check')) {
        throw new Error('Se detectó intercepción de cookies. Usa el botón de copiar código.');
      }

      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Terrenos-Ricardo-120-Meses.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      setDescargadoExito(true);
    } catch (err: any) {
      console.warn('Error con fetch normal, intentando data URI:', err);
      try {
        const cacheBuster = `?t=${Date.now()}`;
        const resp2 = await fetch(`/Terrenos%20Ricardo.html${cacheBuster}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
        const text2 = await resp2.text();
        const blob2 = new Blob([text2], { type: 'text/html;charset=utf-8' });
        const blobUrl2 = window.URL.createObjectURL(blob2);
        const link2 = document.createElement('a');
        link2.href = blobUrl2;
        link2.download = 'Terrenos Ricardo.html';
        document.body.appendChild(link2);
        link2.click();
        document.body.removeChild(link2);
        setDescargadoExito(true);
      } catch (err2: any) {
        setErrorDescarga(err.message || 'El navegador bloqueó la descarga en este contenedor.');
      }
    } finally {
      setDescargando(false);
    }
  };

  // Descarga directa del ZIP sin abrir nueva pestaña
  const handleDescargarZipDirecto = async () => {
    setDescargandoZip(true);
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`/api/descargar-zip${cacheBuster}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'fuente-terrenos-ricardo.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      // Fallback
      window.location.href = `/api/descargar-zip?t=${Date.now()}`;
    } finally {
      setDescargandoZip(false);
    }
  };

  // Opción infalible: Copiar todo el código al portapapeles
  const handleCopiarCodigo = async () => {
    setCopiando(true);
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`/api/descargar-html${cacheBuster}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const htmlText = await response.text();
      await navigator.clipboard.writeText(htmlText);
      setCopiadoExito(true);
      setTimeout(() => setCopiadoExito(false), 5000);
    } catch (err) {
      console.error('Error al copiar:', err);
    } finally {
      setCopiando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-lg">
              📦
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base">
                Exportar Proyecto & Guardar en Escritorio
              </h3>
              <p className="text-xs text-slate-400">
                Paquete ZIP para Antigravity y archivo HTML autónomo para Windows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">

          {/* Opción 1 DESTACADA: Paquete ZIP Completo (Para Antigravity) */}
          <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-amber-950/40 p-5 rounded-2xl border-2 border-amber-500/60 shadow-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  ⭐ Para Antigravity 2.0 / Código Completo
                </span>
                <h4 className="text-white text-base font-extrabold flex items-center gap-2">
                  <span>Descargar Paquete ZIP del Proyecto</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold">.ZIP</span>
                </h4>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Contiene <strong>todo el proyecto completo</strong>: código fuente TypeScript, componentes React, scripts de inicio, estilos Tailwind y configuración lista para importar en Antigravity, VS Code o GitHub.
                </p>
              </div>
              <span className="text-3xl">📦</span>
            </div>

            <button
              id="btn-descargar-zip-modal"
              onClick={handleDescargarZipDirecto}
              disabled={descargandoZip}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all ring-2 ring-amber-300/60"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{descargandoZip ? 'Generando archivo ZIP...' : '📥 Descargar Paquete ZIP (Antigravity 2.0)'}</span>
            </button>
          </div>

          {/* Opción 2: Archivo Terrenos Ricardo.html */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                  Opción 2: Archivo HTML para Windows (Sin Internet)
                </span>
                <h4 className="text-white text-sm font-bold flex items-center gap-2">
                  <span>Descargar "Terrenos-Ricardo-120-Meses.html"</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">120m Activo</span>
                </h4>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Archivo HTML 100% autónomo con el Módulo Administrativo Finca Celia configurado hasta <strong>120 meses (10 años)</strong>, desglose de amortización completa y compatible con doble clic en Windows.
                </p>

              </div>
              <span className="text-2xl">⚡</span>
            </div>

            <button
              id="btn-descargar-html-directo"
              onClick={handleDescargarHtmlDirecto}
              disabled={descargando}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{descargando ? 'Generando archivo en memoria...' : '📥 Descargar "Terrenos-Ricardo-120-Meses.html"'}</span>
            </button>

            {descargadoExito && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-center space-y-1">
                <p className="text-emerald-300 font-bold text-xs">
                  ✓ ¡Descarga completada con éxito!
                </p>
                <p className="text-slate-300 text-[11px]">
                  Búscalo en tu carpeta <strong>Descargas</strong> como <strong>"Terrenos-Ricardo-120-Meses.html"</strong>.
                </p>
              </div>
            )}

            {errorDescarga && (
              <p className="text-center text-rose-400 font-semibold text-[11px]">
                {errorDescarga}
              </p>
            )}

            {/* Alternativa: Copiar código HTML */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                ¿Prefieres copiar el código HTML?
              </span>
              <button
                id="btn-copiar-codigo-html"
                onClick={handleCopiarCodigo}
                disabled={copiando}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>📋</span>
                <span>{copiando ? 'Copiando...' : copiadoExito ? '✓ ¡Copiado!' : 'Copiar Código HTML'}</span>
              </button>
            </div>
            {copiadoExito && (
              <p className="text-amber-300 text-[11px] bg-slate-950/80 p-2 rounded-lg border border-amber-500/30">
                ✓ Código copiado al portapapeles.
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

