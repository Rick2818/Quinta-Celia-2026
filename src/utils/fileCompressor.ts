/**
 * Utilidad de compresión y optimización de archivos (Imágenes y Documentos)
 * Previene QuotaExceededError en localStorage y payloads excesivos en Supabase/REST.
 */

export interface ArchivoOptimizado {
  dataUrl: string;
  nombreArchivo: string;
  tamanoBytes: number;
  tipoMime: string;
  reducidoPorcentaje?: number;
}

const MAX_PDF_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB máximo para PDF
const MAX_IMAGE_DIMENSION = 1600; // Máxima resolución para conservar nitidez en DUI / Contratos
const IMAGE_QUALITY = 0.80; // Calidad WebP/JPEG balanceada

/**
 * Optimiza un archivo antes de almacenarlo en memoria, localStorage o enviarlo a la nube.
 */
export async function optimizarArchivoDocumento(file: File): Promise<ArchivoOptimizado> {
  const tamanoOriginal = file.size;

  // 1. Manejo de PDFs
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    if (tamanoOriginal > MAX_PDF_SIZE_BYTES) {
      throw new Error(`El archivo PDF "${file.name}" (${(tamanoOriginal / (1024 * 1024)).toFixed(1)}MB) supera el límite recomendado de 4.5MB. Por favor comprímelo o sube un extracto.`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          nombreArchivo: file.name,
          tamanoBytes: tamanoOriginal,
          tipoMime: 'application/pdf',
          reducidoPorcentaje: 0
        });
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo PDF.'));
      reader.readAsDataURL(file);
    });
  }

  // 2. Manejo de Imágenes (JPG, PNG, WebP, HEIC/otros)
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        const img = new Image();

        img.onload = () => {
          try {
            // Calcular nuevas dimensiones manteniendo aspect ratio
            let { width, height } = img;
            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
              if (width > height) {
                height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
                width = MAX_IMAGE_DIMENSION;
              } else {
                width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
                height = MAX_IMAGE_DIMENSION;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              // Fallback directo si no hay contexto canvas
              return resolve({
                dataUrl: rawDataUrl,
                nombreArchivo: file.name,
                tamanoBytes: tamanoOriginal,
                tipoMime: file.type
              });
            }

            // Suavizado bicúbico para nitidez en textos de cédula / DUI
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Exportar preferentemente en image/jpeg para compatibilidad universal
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
            
            // Estimar tamaño en bytes del string Base64
            const stringLength = optimizedDataUrl.length - 'data:image/jpeg;base64,'.length;
            const sizeInBytes = Math.round((stringLength * 3) / 4);
            const porcentajeAhorro = Math.max(0, Math.round((1 - (sizeInBytes / tamanoOriginal)) * 100));

            resolve({
              dataUrl: optimizedDataUrl,
              nombreArchivo: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              tamanoBytes: sizeInBytes,
              tipoMime: 'image/jpeg',
              reducidoPorcentaje: porcentajeAhorro
            });
          } catch (canvasErr) {
            console.warn('Fallo en compresión de canvas, usando archivo original:', canvasErr);
            resolve({
              dataUrl: rawDataUrl,
              nombreArchivo: file.name,
              tamanoBytes: tamanoOriginal,
              tipoMime: file.type
            });
          }
        };

        img.onerror = () => reject(new Error('La imagen seleccionada no es válida o está dañada.'));
        img.src = rawDataUrl;
      };

      reader.onerror = () => reject(new Error('Error al cargar la imagen seleccionada.'));
      reader.readAsDataURL(file);
    });
  }

  // 3. Fallback genérico para otros archivos
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: reader.result as string,
        nombreArchivo: file.name,
        tamanoBytes: tamanoOriginal,
        tipoMime: file.type || 'application/octet-stream'
      });
    };
    reader.onerror = () => reject(new Error('Error al procesar el archivo.'));
    reader.readAsDataURL(file);
  });
}
