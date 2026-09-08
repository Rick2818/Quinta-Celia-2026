# 🌲 Quinta Celia - Terrenos Ricardo 📐
### Simulador de Hipotecas Campestres, Topografía Legal & Control de Cobranzas en el Terreno

Sistema integral desarrollado para la lotificación y administración hipotecaria de **Quinta Celia**, integrando peritaje topográfico profesional, cálculo financiero de cuotas niveladas, gestión de compradores, emisión de recibos oficiales, búsqueda instantánea por Nombre/DUI, acceso móvil 24/7 con código QR y sincronización en la nube con Supabase.

---

## 🌐 Enlace de la Aplicación en Vivo (Nube 24/7)

La aplicación está desplegada y accesible permanentemente desde cualquier computadora o celular sin necesidad de tener la laptop encendida:

👉 **[https://rick2818.github.io/Quinta-Celia-2026/](https://rick2818.github.io/Quinta-Celia-2026/)**

---

## 🚀 Características Principales

### 1. 📱 Acceso Móvil en el Terreno & Código QR (PWA)
- **Independiente de la Laptop**: La plataforma funciona en la nube 24/7. Las gestiones de cobranza o registro de clientes hechas en el campo se guardan en la nube y se reflejan en la laptop al encenderla.
- **Generador de Código QR Integrado**: Botón `📱 Acceso Celular [QR]` en la barra superior que genera el código QR en pantalla para escanearlo con la cámara del celular.
- **Compartir por WhatsApp**: Botón de un solo toque para enviar el enlace de acceso directo al celular de los cobradores o clientes.
- **Instalación como App Nativa (PWA)**:
  - **Android (Chrome)**: Menú (⋮) > *"Añadir a la pantalla de inicio"*.
  - **iPhone (Safari)**: Botón Compartir > *"Agregar a pantalla de inicio"*.
  - Abre en pantalla completa sin barras del navegador.

### 2. 🔍 Búsqueda Avanzada de Clientes por Nombre o DUI
- **Buscador Universal en Navbar & Cartera**: Botón destacado `🔍 Buscar Cliente [DUI]` accesible con el atajo rápido de teclado **`Ctrl + K`** (o `Ctrl + B`).
- **Filtro Inteligente Tolerante**:
  - Búsqueda por **DUI / Cédula** con o sin guiones (ej. `04892114-8` o `048921148`).
  - Búsqueda por **Nombre completo**, número de **Lote** o número de **Teléfono**.
- **Consulta en la Nube Supabase**: Botón `☁️ Nube` para buscar clientes directamente en la base de datos PostgreSQL remota.
- **Acciones Rápidas**: Accesos directos para *"Ver Expediente Completo"* o *"Pagar Cuota"* con un solo clic.

### 3. 📊 Cotizador y Simulador de Terrenos
- **Cálculo de Geometría y Superficie**: Entrada de linderos $x_1$ (frente), $x_2$ (fondo) y $y_1$ (profundidad) con cálculo automático de área en metros cuadrados ($\text{m}^2$) y varas cuadradas ($\text{v}^2$).
- **Visor 2D Interactivo**: Representación gráfica vectorial SVG del polígono del terreno a escala.
- **Planes de Financiamiento Nivelados**: Sistema de amortización francés con cálculo exacto de cuotas, desglose de capital, intereses y saldos hasta 120+ meses.
- **Lotes Preconfigurados**: Presets de lotes estándar de Quinta Celia (*El Manantial*, *Vista al Valle*, *Macrolote Campestre*, *Mirador Premium*).

### 4. 👥 Control de Cartera y Registro de Pagos
- **Expedientes de Compradores**: Registro de datos personales, identificación (DUI/Cédula), contacto y teléfono con enlace directo a WhatsApp.
- **Tabla de Amortización Mensual Dinámica**: Monitoreo de cuotas pendientes, pagadas y saldo insoluto restante.
- **Abonos Extraordinarios a Capital**:
  - **Modalidad A (Reducir Plazo)**: Mantiene la cuota mensual intacta y acorta los meses de pago con un ahorro sustancial en intereses.
  - **Modalidad B (Reducir Cuota)**: Mantiene los meses restantes y recalcula una cuota mensual nivelada menor.
- **Control de Mora (Regla 3% al 5%)**: Detección automática de cuotas vencidas y cálculo del recargo por mora reglamentario (configurable entre 3% y 5% sobre la cuota vencida).

### 5. 🛡️ Centro de Respaldos y Seguridad de Datos
- **Copia de Seguridad (.JSON)**: Exportación e importación del 100% de la base de datos (clientes, amortizaciones, pagos y recibos) para respaldar en memoria USB o transferir entre equipos.
- **Exportación a Microsoft Excel (.CSV)**: Descarga directa de la cartera general o del estado de cuenta individual codificado en UTF-8 con BOM.
- **Soporte de Divisas**: Configuración de moneda (`USD $`, `MXN $`, `C$`, `Q`, `€`, etc.).

### 6. 🧾 Emisión de Recibos Oficiales
- **Recibos Digitales Consecutivos**: Formato membretado de recibo oficial de Quinta Celia con número de correlativo anual.
- **Despacho por Correo**: Opción de envío automatizado y comprobante de entrega al email del cliente.
- **Estilo de Impresión**: Formato adaptado para imprimir o guardar como PDF.

### 7. 📐 Agente Topógrafo Senior AI (Ing. Celso R. Valdivia)
- Peritaje asistido por **Google Gemini AI** simulando más de 24 años de experiencia en catastro rural y geodesia legal.
- Emisión de dictamen pericial oficial con medidas definitivas de cierre para contratos y escrituración.
- Respaldo técnico offline con dictámenes normativos integrados.

### 8. ☁️ Integración con Base de Datos Supabase (PostgreSQL)
- Conexión REST directa con la nube de **Supabase**.
- Almacenamiento con columna `datos_json JSONB` para preservar la estructura completa de expedientes, amortizaciones y recibos con total fidelidad.

---

## 🗄️ Esquema de Base de Datos Supabase SQL

Para inicializar las tablas en Supabase, copia y ejecuta este script en el **SQL Editor** de tu proyecto:

```sql
-- 1. Tabla de Clientes y Terrenos Quinta Celia
CREATE TABLE IF NOT EXISTS public.clientes_quinta_celia (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  cedula TEXT,
  lote_nombre TEXT,
  lote_numero TEXT,
  medida_x1 NUMERIC(10,2) DEFAULT 0,
  medida_x2 NUMERIC(10,2) DEFAULT 0,
  medida_y1 NUMERIC(10,2) DEFAULT 0,
  area_m2 NUMERIC(10,2) DEFAULT 0,
  precio_total NUMERIC(14,2) NOT NULL,
  enganche NUMERIC(14,2) NOT NULL,
  monto_financiado NUMERIC(14,2) NOT NULL,
  plazo_meses INT NOT NULL,
  tasa_interes_anual NUMERIC(5,2) NOT NULL,
  cuota_mensual NUMERIC(12,2) NOT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  estado TEXT DEFAULT 'activo',
  topografo_dictamen TEXT,
  topografo_validado BOOLEAN DEFAULT true,
  datos_json JSONB,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clientes_quinta_celia ADD COLUMN IF NOT EXISTS datos_json JSONB;

-- 2. Tabla de Pagos de Cuotas y Recibos
CREATE TABLE IF NOT EXISTS public.pagos_quinta_celia (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recibo_numero TEXT UNIQUE NOT NULL,
  cliente_id TEXT,
  mes_numero INT NOT NULL,
  monto_total NUMERIC(12,2) NOT NULL,
  abono_capital NUMERIC(12,2) NOT NULL,
  abono_interes NUMERIC(12,2) NOT NULL,
  saldo_restante NUMERIC(14,2) NOT NULL,
  fecha_pago TIMESTAMPTZ DEFAULT NOW(),
  metodo TEXT DEFAULT 'transferencia',
  referencia TEXT,
  enviado_por_email BOOLEAN DEFAULT false,
  email_destino TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad RLS
ALTER TABLE public.clientes_quinta_celia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_quinta_celia ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para acceso de lectura y escritura
DROP POLICY IF EXISTS "Permitir todo a anon en clientes" ON public.clientes_quinta_celia;
CREATE POLICY "Permitir todo a anon en clientes" ON public.clientes_quinta_celia
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a anon en pagos" ON public.pagos_quinta_celia;
CREATE POLICY "Permitir todo a anon en pagos" ON public.pagos_quinta_celia
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

---

## 💻 Modalidades de Ejecución

### Opción 1: En Línea / Celular (Recomendado)
Entra directamente desde tu computadora o teléfono:
👉 **[https://rick2818.github.io/Quinta-Celia-2026/](https://rick2818.github.io/Quinta-Celia-2026/)**

### Opción 2: Archivo Autónomo Offline para Windows
No requiere internet ni instalación:
1. Abre la carpeta del proyecto en tu computadora.
2. Haz doble clic en el archivo:
   ```text
   Terrenos Ricardo.html
   ```
3. Se abrirá de inmediato en tu navegador (Google Chrome o Edge).

### Opción 3: Entorno de Desarrollo (Node.js)
```bash
# 1. Clonar repositorio
git clone https://github.com/Rick2818/Quinta-Celia-2026.git
cd Quinta-Celia-2026

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor local
npm run dev
```

---

## 🛠️ Scripts del Proyecto

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor local de desarrollo con Vite y Express en caliente (`tsx server.ts`). |
| `npm run build` | Compila TypeScript, empaqueta el frontend y backend, y regenera los archivos HTML autónomos. |
| `npm run lint` | Comprobación estática de tipos con TypeScript (`tsc --noEmit`). |
| `npm start` | Ejecuta la versión empaquetada de producción (`dist/server.cjs`). |

---

## 🏗️ Stack Tecnológico

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti.
- **PWA & Móvil**: Service Manifest PWA, soporte Standalone para iOS y Android, QR Code generator.
- **Herramienta de Construcción**: Vite 6, esbuild.
- **Backend**: Node.js, Express.
- **Inteligencia Artificial**: `@google/genai` (Gemini 3.8 Flash).
- **Persistencia**: LocalStorage híbrido y Supabase REST API (PostgreSQL en la nube).

---

## 📄 Créditos

- **Proyecto**: Lotificación y Créditos Hipotecarios Quinta Celia 2026.
- **Peritaje Topográfico**: Ing. Celso R. Valdivia (Topógrafo Senior).
- **Administración y Operaciones**: Ricardo.