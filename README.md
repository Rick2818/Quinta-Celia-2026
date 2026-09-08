# 🌲 Quinta Celia - Terrenos Ricardo 📐
### Simulador de Hipotecas Campestres, Topografía Legal & Control de Cobranzas

Sistema integral desarrollado para la lotificación y administración hipotecaria de **Quinta Celia**, integrando peritaje topográfico profesional, cálculo financiero de cuotas niveladas, gestión de compradores, emisión de recibos y centro de respaldos de seguridad.

---

## 🚀 Características Principales

### 1. 📊 Cotizador y Simulador de Terrenos
- **Cálculo de Geometría y Superficie**: Entrada de linderos $x_1$ (frente), $x_2$ (fondo) y $y_1$ (profundidad) con cálculo automático de área en metros cuadrados ($\text{m}^2$) y varas cuadradas ($\text{v}^2$).
- **Visor 2D Interactivo**: Representación gráfica vectorial SVG del polígono del terreno a escala.
- **Planes de Financiamiento Nivelados**: Sistema de amortización francés con cálculo exacto de cuotas, desglose de capital, intereses y saldos hasta 120+ meses.
- **Lotes Preconfigurados**: Presets de lotes estándar de Quinta Celia (*El Manantial*, *Vista al Valle*, *Macrolote Campestre*, *Mirador Premium*).

### 2. 👥 Control de Cartera y Registro de Pagos
- **Expedientes de Compradores**: Registro completo de datos personales, identificación (DUI/Cédula), contacto y teléfono con enlace directo a WhatsApp.
- **Tabla de Amortización Mensual Dinámica**: Monitoreo de cuotas pendientes, pagadas y saldo insoluto restante.
- **Abonos Extraordinarios a Capital**:
  - **Modalidad A (Reducir Plazo)**: Mantiene la cuota mensual intacta y acorta los meses de pago con un ahorro sustancial en intereses.
  - **Modalidad B (Reducir Cuota)**: Mantiene los meses restantes y recalcula una cuota mensual nivelada menor.
- **Control de Mora (Regla 3% al 5%)**: Detección automática de cuotas vencidas y cálculo del recargo por mora reglamentario (configurable entre 3% y 5% sobre la cuota).

### 3. 🛡️ Centro de Respaldos y Seguridad de Datos
- **Copia de Seguridad (.JSON)**: Exportación e importación del 100% de la base de datos (clientes, amortizaciones, pagos y recibos) para respaldar en memoria USB o transferir entre equipos.
- **Exportación a Microsoft Excel (.CSV)**: Descarga directa de la cartera general o del estado de cuenta individual codificado en UTF-8 con BOM.
- **Soporte de Divisas**: Configuración de moneda (`USD $`, `MXN $`, `C$`, `Q`, `€`, etc.).

### 4. 🧾 Emisión de Recibos Oficiales
- **Recibos Digitales Consecutivos**: Formato membretado de recibo oficial de Quinta Celia con número de correlativo anual.
- **Despacho por Correo**: Opción de envío automatizado y comprobante de entrega al email del cliente.
- **Estilo de Impresión**: Formato adaptado para imprimir o guardar como PDF.

### 5. 📐 Agente Topógrafo Senior AI (Ing. Celso R. Valdivia)
- Peritaje asistido por **Google Gemini AI** simulando más de 24 años de experiencia en catastro rural y geodesia legal.
- Emisión de dictamen pericial oficial con medidas definitivas de cierre para contratos y escrituración.
- Respaldo técnico offline con dictámenes normativos integrados.

### 6. ☁️ Sincronización en la Nube con Supabase (Opcional)
- Conexión REST directa con base de datos **PostgreSQL** en Supabase.
- Incluye el script SQL completo para generación de tablas con políticas de seguridad RLS.

---

## 💻 Formas de Uso

### Opción 1: Uso Inmediato Offline (Recomendado)
No requiere instalar nada ni tener internet:
1. Abre la carpeta del proyecto.
2. Haz doble clic en:
   ```text
   Terrenos Ricardo.html
   ```
3. La aplicación se abrirá en tu navegador (Google Chrome o Edge) funcionando al 100% de forma local.

---

### Opción 2: Modo Servidor / Desarrollo
Para desarrolladores o para ejecutar el servidor con la API de Gemini activa:

1. Clona o abre este repositorio:
   ```bash
   git clone https://github.com/Rick2818/Quinta-Celia-2026.git
   cd Quinta-Celia-2026
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` basado en `.env.example`:
   ```env
   GEMINI_API_KEY=tu_clave_de_gemini_aqui
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre en tu navegador: `http://localhost:3000`

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor local con Vite y Express en caliente (`tsx server.ts`). |
| `npm run build` | Compila TypeScript, empaqueta el servidor y genera el archivo autónomo `Terrenos Ricardo.html`. |
| `npm run lint` | Valida los tipos estáticos con TypeScript (`tsc --noEmit`). |
| `npm start` | Ejecuta la versión empaquetada de producción (`dist/server.cjs`). |

---

## 🏗️ Stack Tecnológico

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti.
- **Herramienta de Construcción**: Vite 6, esbuild.
- **Backend**: Node.js, Express.
- **Inteligencia Artificial**: `@google/genai` (Gemini 3.8 Flash).
- **Persistencia**: LocalStorage (modo autónomo) y Supabase REST API (PostgreSQL).

---

## 📄 Licencia y Créditos

Desarrollado para la administración y lotificación de **Quinta Celia**.  
Peritaje topográfico referencial a cargo del **Ing. Celso R. Valdivia**.  
Administración general por **Ricardo**.