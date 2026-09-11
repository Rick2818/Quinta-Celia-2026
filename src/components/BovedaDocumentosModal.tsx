import React, { useState } from 'react';
import { DocumentoExpediente, ClienteComprador } from '../types';

interface BovedaDocumentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteComprador;
  onActualizarDocumentos: (clienteId: string, documentos: NonNullable<ClienteComprador['documentos']>) => void;
  tipoDocumentoInicial?: 'copiaDui' | 'promesaVenta' | 'escrituraCompraVenta';
}

export const BovedaDocumentosModal: React.FC<BovedaDocumentosModalProps> = ({
  isOpen,
  onClose,
  cliente,
  onActualizarDocumentos,
  tipoDocumentoInicial = 'copiaDui'
}) => {
  if (!isOpen) return null;

  const [tipoActivo, setTipoActivo] = useState<'copiaDui' | 'promesaVenta' | 'escrituraCompraVenta'>(tipoDocumentoInicial);
  const [documentosLocales, setDocumentosLocales] = useState<NonNullable<ClienteComprador['documentos']>>(
    cliente.documentos || {}
  );
  const [vistaPreviaDoc, setVistaPreviaDoc] = useState<DocumentoExpediente | null>(null);

  const docActual = documentosLocales[tipoActivo];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'copiaDui' | 'promesaVenta' | 'escrituraCompraVenta') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const nuevoDoc: DocumentoExpediente = {
        id: `doc-${Date.now()}`,
        tipo: tipo === 'copiaDui' ? 'copia_dui' : tipo === 'promesaVenta' ? 'promesa_venta' : 'escritura_compraventa',
        nombreArchivo: file.name,
        tamanoBytes: file.size,
        tipoMime: file.type,
        dataUrl,
        fechaSubida: new Date().toISOString()
      };

      const docsActualizados = {
        ...documentosLocales,
        [tipo]: nuevoDoc
      };

      setDocumentosLocales(docsActualizados);
      onActualizarDocumentos(cliente.id, docsActualizados);
    };

    reader.readAsDataURL(file);
  };

  const handleEliminarDocumento = (tipo: 'copiaDui' | 'promesaVenta' | 'escrituraCompraVenta') => {
    if (!confirm('¿Deseas eliminar este documento del expediente?')) return;
    const docsActualizados = { ...documentosLocales };
    delete docsActualizados[tipo];
    setDocumentosLocales(docsActualizados);
    onActualizarDocumentos(cliente.id, docsActualizados);
  };

  const formatTamano = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-lg font-bold">
              📂
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-base flex items-center gap-2">
                Bóveda de Documentos Legales
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Expediente Seguro
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Titular: <strong className="text-white">{cliente.nombre}</strong> • {cliente.loteNombre} (Lote #{cliente.loteNumero})
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

        {/* Pestañas de Documentos Clave */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTipoActivo('copiaDui')}
              className={`py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-left flex flex-col gap-0.5 ${
                tipoActivo === 'copiaDui'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs">🪪 Copia de DUI</span>
                {documentosLocales.copiaDui ? (
                  <span className={`text-[10px] font-bold ${tipoActivo === 'copiaDui' ? 'text-slate-900' : 'text-emerald-400'}`}>✓ Listo</span>
                ) : (
                  <span className={`text-[10px] ${tipoActivo === 'copiaDui' ? 'text-slate-800' : 'text-slate-500'}`}>Pendiente</span>
                )}
              </div>
              <span className={`text-[10px] font-normal truncate ${tipoActivo === 'copiaDui' ? 'text-slate-900' : 'text-slate-400'}`}>
                {documentosLocales.copiaDui?.nombreArchivo || 'Identificación oficial'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTipoActivo('promesaVenta')}
              className={`py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-left flex flex-col gap-0.5 ${
                tipoActivo === 'promesaVenta'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs">📝 Promesa de Venta</span>
                {documentosLocales.promesaVenta ? (
                  <span className={`text-[10px] font-bold ${tipoActivo === 'promesaVenta' ? 'text-slate-900' : 'text-emerald-400'}`}>✓ Firmada</span>
                ) : (
                  <span className={`text-[10px] ${tipoActivo === 'promesaVenta' ? 'text-slate-800' : 'text-slate-500'}`}>Pendiente</span>
                )}
              </div>
              <span className={`text-[10px] font-normal truncate ${tipoActivo === 'promesaVenta' ? 'text-slate-900' : 'text-slate-400'}`}>
                {documentosLocales.promesaVenta?.nombreArchivo || 'Contrato 120 meses'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTipoActivo('escrituraCompraVenta')}
              className={`py-2.5 px-3 rounded-xl font-bold transition-all cursor-pointer text-left flex flex-col gap-0.5 ${
                tipoActivo === 'escrituraCompraVenta'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs">🏛️ Escritura Final</span>
                {documentosLocales.escrituraCompraVenta ? (
                  <span className={`text-[10px] font-bold ${tipoActivo === 'escrituraCompraVenta' ? 'text-slate-900' : 'text-sky-400'}`}>✓ Otorgada</span>
                ) : cliente.estado === 'liquidado' ? (
                  <span className="text-[10px] text-amber-400 font-bold">Por Entregar</span>
                ) : (
                  <span className="text-[10px] text-slate-500">Fin del período</span>
                )}
              </div>
              <span className={`text-[10px] font-normal truncate ${tipoActivo === 'escrituraCompraVenta' ? 'text-slate-900' : 'text-slate-400'}`}>
                {documentosLocales.escrituraCompraVenta?.nombreArchivo || 'Compraventa notarial'}
              </span>
            </button>
          </div>

          {/* Panel Activo del Documento Seleccionado */}
          <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/60 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {tipoActivo === 'copiaDui' && '🪪 Copia de DUI (Documento Único de Identidad)'}
                  {tipoActivo === 'promesaVenta' && '📝 Copia de Promesa de Venta Firmada'}
                  {tipoActivo === 'escrituraCompraVenta' && '🏛️ Copia de la Escritura de Compra Venta (Final de Período)'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {tipoActivo === 'copiaDui' && 'Copia digital o fotografía del documento de identidad del comprador.'}
                  {tipoActivo === 'promesaVenta' && 'Contrato privado o protocolizado al inicio del plan de financiamiento a 120 meses.'}
                  {tipoActivo === 'escrituraCompraVenta' && 'Escritura pública otorgada ante notario al completar las 120 cuotas o liquidación total.'}
                </p>
              </div>

              {/* Botón de Cargar / Reemplazar */}
              <label className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0">
                <span>📁</span>
                <span>{docActual ? 'Reemplazar Archivo' : 'Subir Documento'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, tipoActivo)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Si ya hay documento cargado */}
            {docActual ? (
              <div className="space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                      {docActual.tipoMime?.includes('pdf') ? '📄' : '🖼️'}
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs">{docActual.nombreArchivo}</h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{formatTamano(docActual.tamanoBytes)}</span>
                        <span>•</span>
                        <span>Cargado el: {new Date(docActual.fechaSubida).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {docActual.dataUrl && (
                      <a
                        href={docActual.dataUrl}
                        download={docActual.nombreArchivo}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>⬇️</span>
                        <span>Descargar</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setVistaPreviaDoc(docActual)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>👁️</span>
                      <span>Ver Documento</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarDocumento(tipoActivo)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition-colors cursor-pointer"
                      title="Eliminar archivo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Vista Previa Embebida si es Imagen */}
                {docActual.dataUrl && docActual.tipoMime?.startsWith('image/') && (
                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 p-2 text-center">
                    <img
                      src={docActual.dataUrl}
                      alt={docActual.nombreArchivo}
                      className="max-h-72 mx-auto rounded-xl object-contain shadow-md"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-950/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 text-2xl flex items-center justify-center mx-auto text-slate-400">
                  📄
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Ningún archivo adjunto aún</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Formatos admitidos: Imágenes (JPG, PNG, WebP) o Documentos PDF
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 cursor-pointer transition-colors shadow">
                  <span>Subir {tipoActivo === 'copiaDui' ? 'DUI' : tipoActivo === 'promesaVenta' ? 'Promesa de Venta' : 'Escritura'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, tipoActivo)}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Aviso para la Escritura de Compra Venta */}
            {tipoActivo === 'escrituraCompraVenta' && !docActual && (
              <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-[11px] flex items-start gap-2">
                <span className="text-base">ℹ️</span>
                <div>
                  <strong className="block text-sky-300 font-semibold">Entrega de Escritura al Final del Período:</strong>
                  La escritura de compraventa definitiva se otorga y adjunta en esta casilla una vez que el comprador cancele la cuota 120 o liquide anticipadamente el saldo total del inmueble.
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Los documentos se almacenan localmente y se respaldan en la nube Supabase.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar Bóveda
          </button>
        </div>

      </div>

      {/* Modal de Vista Previa a Pantalla Completa */}
      {vistaPreviaDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <span className="text-white font-bold text-xs">{vistaPreviaDoc.nombreArchivo}</span>
              <button
                onClick={() => setVistaPreviaDoc(null)}
                className="text-slate-400 hover:text-white px-2 py-1"
              >
                ✕ Cerrar
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center">
              {vistaPreviaDoc.tipoMime?.startsWith('image/') ? (
                <img
                  src={vistaPreviaDoc.dataUrl}
                  alt={vistaPreviaDoc.nombreArchivo}
                  className="max-h-[75vh] object-contain rounded-xl"
                />
              ) : (
                <iframe
                  src={vistaPreviaDoc.dataUrl}
                  title={vistaPreviaDoc.nombreArchivo}
                  className="w-full h-[75vh] rounded-xl border border-slate-800"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
