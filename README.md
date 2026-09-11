# 🌲 Módulo Administrativo Finca Celia Terrenos de Ricardo 📐
### Plataforma de Administración Hipotecaria a 120 Meses, Topografía Pericial, Multi-Agente 3 Niveles & WhatsApp IA (Gemini Flash 2.5 + Google MCP)

Sistema integral en la nube y de escritorio desarrollado para la administración, cotización y gestión de cartera de **Finca Celia - Terrenos de Ricardo** (El Salvador). Incorpora peritaje topográfico certificado, cálculo actuarial a 120 meses, sincronización en tiempo real con **Supabase**, arquitectura multi-agente determinista de 3 niveles con auditoría Fail-Closed y un **Asistente de WhatsApp 24/7 potenciado con Google Gemini Flash 2.5 y vinculación MCP con Google Workspace (Calendar, Meet, Gmail y Maps)**.

---

## 🌐 Enlace Permanente en la Nube (Móvil & Escritorio 24/7)

La plataforma vive en la nube y es accesible desde cualquier celular o computadora sin depender de que una laptop esté encendida:

📱 **Acceso Móvil / Web:**  
👉 **[https://rick2818.github.io/Quinta-Celia-2026/](https://rick2818.github.io/Quinta-Celia-2026/)**

> **Garantía de Continuidad Familiar:**  
> Todos los clientes, pagos, recibos, citas agendadas e inventario se almacenan en la base de datos central en la nube (**Supabase PostgreSQL**). Si Ricardo no está presente, su esposa puede ingresar desde su celular o navegador para consultar estados de cuenta, recibos y saldo pendiente de cualquier comprador.

---

## 🚀 Novedades y Capacidades Principales

### 1. 🤖 Asistente de WhatsApp 24/7 con IA Gemini Flash 2.5
- **Línea Oficial de WhatsApp:** `+503 7574-3444` (`75743444`).
- **Modelo de IA:** Google Gemini Flash 2.5 (`gemini-2.5-flash`) con esquemas JSON estructurados deterministas.
- **Conocimiento Maestro de Finca Celia:**
  - **Ubicación Exacta y Accesos:** Corredor verde entre San Salvador y Santa Ana (zona Valle de Zapotitán / desvío Coatepeque), El Salvador. A solo 35 minutos de San Salvador y 20 minutos de Santa Ana. Clima fresco de montaña (~780 msnm), aire 100% puro, vegetación, árboles frutales y naciente de agua natural propia (*El Manantial*). Acceso pavimentado directo desde la carretera y calle interna balastrada de 8 metros apta para todo tipo de vehículo todo el año.
  - **Catálogo e Inventario de Terrenos:**
    - Lote 01 *"El Manantial"*: 500 m² (715.41 v²), medidas 20x25m, plano, colindante con el ojo de agua natural. $25,000 ($50/m²). Cuota ~$220/mes a 120 meses.
    - Lote 04 *"Vista al Valle"*: 768 m² (1,098.88 v²), medidas 24x32m, terraza natural con vista panorámica. $34,560 ($45/m²). Cuota ~$290/mes a 120 meses.
    - Lote 07 *"El Mirador del Bosque"*: 750 m² (1,073.12 v²), medidas 25x30m, rodeado de pinos y máxima privacidad. $36,000 ($48/m²). Cuota ~$305/mes a 120 meses.
    - Lote 10 *"La Cumbre Verde"*: 600 m² (858.50 v²), medidas 20x30m, semiplano a 100m del portón. $27,000 ($45/m²). Cuota ~$235/mes a 120 meses.
    - Lote 15 *"Prados de Celia"*: 1,000 m² (1,430.83 v²), medidas 25x40m, macrolote campestre ideal para casa de campo con piscina. $45,000 ($45/m²). Cuota ~$380/mes a 120 meses.
  - **Condiciones Financieras:**
    - Precio del metro cuadrado: Rango entre $35 y $60 por m² ($24.46 a $41.93 por vara cuadrada).
    - **Financiamiento Propio Directo con Ricardo:** 100% sin intermediarios bancarios, sin buró de crédito ni fiador.
    - **Plazo Oficial:** 120 meses (10 años) con cuota mensual fija nivelada.
    - **Prima:** Desde el 10% (con facilidades de pago).
    - Cero penalización por abonos extraordinarios a capital o liquidación total anticipada.

---

### 2. 📅 Vinculación MCP Google (Google Workspace)
Integración mediante el protocolo abierto **Model Context Protocol (MCP)** con Google Workspace:
- **Google Calendar (📅):** Agendamiento automático de visitas al terreno con 1 clic (`https://calendar.google.com/calendar/render...`). Incluye fecha, hora, nombre del cliente, teléfono y recordatorios.
- **Google Meet (🎥):** Generación inmediata de sala virtual de Google Meet para clientes en el exterior (diáspora salvadoreña en EE.UU./Canadá) o interesados que desean presentación virtual con Ricardo.
- **Gmail (✉️):** Despacho y confirmación formal de citas con plantillas pre-redactadas (`mailto:` y Google Mail).
- **Google Maps (📍):** Enlace satelital georreferenciado para navegación en Waze y Google Maps.
- **Sincronización a Supabase:** Cada cita o videollamada agendada se almacena en la tabla `visitas_terreno` en la nube.
- **Archivo de Configuración MCP:** Ubicado en [`.agents/mcp_config.json`](file:///c:/Users/Ricardo/Desktop/Quinta%20Celia%20Ano%202026/.agents/mcp_config.json) y en `~/.gemini/config/mcp_config.json`.

---

### 3. 🛡️ Arquitectura Multi-Agente de 3 Niveles (Fail-Closed)
1. **Nivel 1 (Orquestador Director de Operaciones):** Analiza la intención del usuario y delega en paralelo a los especialistas de dominio.
2. **Nivel 2 (Especialistas de Dominio):**
   - **Ing. Celso R. Valdivia (Topógrafo Senior):** Peritaje geométrico, linderos $x_1$, $x_2$, $y_1$, cálculo de áreas en m² y v², análisis de pendientes y amojonamiento.
   - **Actuario Financiero:** Simulación francesa de cuotas niveladas a 120 meses, amortizaciones y proyecciones de intereses.
   - **Agente WhatsApp 24/7 (Gemini Flash 2.5):** Atención cálida y comercial a prospectos y compradores.
3. **Nivel 3 (Auditor Crítico / Gatekeeper Fail-Closed):** Verifica que la tolerancia pericial sea menor a $0.05\text{ m}^2$ y valida la viabilidad financiera antes de emitir cualquier certificación legal. Si existe discrepancia, bloquea la salida y emite alertas de subsanación inmediata.

---

### 4. 📁 Bóveda de Documentos Legales del Cliente
Módulo de expediente documental integrado en el registro de clientes y en su ficha individual:
- **🪪 Copia de DUI:** Carga digital optimizada del Documento Único de Identidad salvadoreño.
- **📝 Copia de Promesa de Venta:** Respaldo del contrato firmado para el plan de 120 meses.
- **🏛️ Copia de la Escritura de Compra Venta:** Espacio para la escritura matriz protocolizada al liquidar o finalizar el período.
- **Compresión Inteligente Automática:** El sistema optimiza imágenes pesadas y fotos de celular en el cliente mediante Canvas off-screen, reduciendo el peso de 8MB a ~250KB para evitar cuellos de botella y saturación de memoria.

---

### 5. 🛡️ Auditoría Full Stack, Seguridad SSL/HTTPS & Prevención de Crashes
Arquitectura blindada contra caídas y vulnerabilidades:
- **Cifrado SSL / HTTPS Obligatorio:**
  - `Strict-Transport-Security` (HSTS): Fuerza el uso exclusivo de HTTPS por 365 días en navegadores.
  - `Content-Security-Policy` (`upgrade-insecure-requests`): Actualiza automáticamente cualquier solicitud HTTP a HTTPS seguro en navegadores móviles.
  - Detección de Proxy (`trust proxy`, `x-forwarded-proto`) con redirección 301 a HTTPS.
  - Protección activa contra clickjacking (`X-Frame-Options: SAMEORIGIN`), MIME-sniffing (`X-Content-Type-Options: nosniff`) y mitigación XSS.
- **Prevención de Crashes (Zero-Crash Policy):**
  - **Serializador Resiliente:** Manejo seguro de `QuotaExceededError` en `localStorage`. Si el almacenamiento local del dispositivo se satura, el sistema conserva los metadatos y la sesión sin arrojar excepciones ni congelar la aplicación.
  - **React 19 Error Boundary:** Contenedor de seguridad que intercepta excepciones en componentes hijos y ofrece recuperación en 1 clic ("Reintentar Vista") en lugar de mostrar pantalla en blanco.
  - **Despliegue Estable en GitHub Pages:** Incorporación de archivo `.nojekyll` y fallback `404.html` para garantizar navegación SPA sin errores 404 al recargar o compartir enlaces directos.

---

### 6. 💵 Módulo Administrativo: Precio Final Fijado por Ricardo y $/m²
- **Precio Final Maestro:** Ricardo puede fijar directamente el precio total del terreno ($15,000, $25,000, etc.), siendo el conductor primario de todos los cálculos.
- **Panel Dinámico:** Muestra el precio por metro cuadrado ($/m²) y vara cuadrada ($/v²).
- **Fórmula en Tiempo Real:**  
  $$\text{Precio Total} = \text{Área } (\text{m}^2) \times \text{Precio por } \text{m}^2$$
- **Tabla de Amortización Dinámica a 120 Meses:**
  - 120 cuotas consecutivas con desglose de Pago Mensual, Abono a Capital, Intereses y Saldo Insoluto.
  - Buscador rápido por mes (ej. ver mes 12, 60 o 120).
  - Botón de descarga directa en formato CSV/Excel.

---

### 7. ☁️ Arquitectura de Base de Datos en Supabase (Nube 24/7)
Base de datos PostgreSQL en la nube con Row Level Security (RLS) verificado:
1. `clientes_quinta_celia`: Expedientes de compradores, documentos legales (DUI, Promesa, Escritura), lote asignado, financiamiento y topografía pericial.
2. `pagos_quinta_celia`: Recibos oficiales numerados, abonos a capital, intereses y saldos actualizados.
3. `inventario_lotes`: Lotes disponibles, apartados y vendidos con cotas y características.
4. `prospectos_leads`: Registro de prospectos captados por WhatsApp, Facebook o visitas de campo.
5. `mensajes_whatsapp`: Historial de conversaciones e intenciones procesadas por Gemini Flash 2.5.
6. `visitas_terreno`: Agenda de visitas presenciales y reuniones por Google Meet.

---

## 💻 Formas de Uso y Despliegue

### Opción 1: En Línea / Celular (Recomendado)
Entra directamente desde cualquier navegador móvil o de escritorio:  
👉 **[https://rick2818.github.io/Quinta-Celia-2026/](https://rick2818.github.io/Quinta-Celia-2026/)**

### Opción 2: Despliegue Automático al Celular en 1 Clic (Windows)
Haz doble clic en el archivo:
```text
Actualizar-Celular.bat
```
Este script compila el código, genera los paquetes y publica automáticamente en GitHub Pages.

### Opción 3: Archivo Autónomo Offline para Windows
Haz doble clic en:
```text
Terrenos Ricardo.html
```
Se abrirá al instante en Chrome o Edge y funciona 100% sin internet.

### Opción 4: Servidor Local de Desarrollo
```powershell
# 1. Instalar dependencias
npm install

# 2. Ejecutar servidor en desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

---

## 🛠️ Scripts Disponibles

| Comando / Archivo | Función |
| :--- | :--- |
| `Actualizar-Celular.bat` | Compila y despliega en 1 solo clic a GitHub Pages para reflejar cambios en celulares. |
| `Abrir-Terrenos-Ricardo.bat` | Lanza la aplicación localmente en el navegador predeterminado de Windows. |
| `npm run dev` | Inicia Vite y el servidor Express con recarga en caliente (`tsx server.ts`). |
| `npm run build` | Compila frontend, backend y genera el archivo único autónomo `Terrenos Ricardo.html`. |
| `npm run deploy:celular` | Comando de npm para compilar y sincronizar con la nube. |

---

## 🏗️ Stack Tecnológico

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti.
- **Inteligencia Artificial:** Google Gemini Flash 2.5 (`@google/genai`), esquemas estructurados Zod/JSON.
- **Integraciones:** Model Context Protocol (MCP Google Workspace: Google Calendar, Google Meet, Gmail, Google Maps).
- **Backend:** Node.js, Express, esbuild, TypeScript Execution (`tsx`).
- **Base de Datos Nube:** Supabase Cloud (PostgreSQL 15, REST API, Row Level Security).
- **Despliegue Continuo:** GitHub Actions & GitHub Pages (PWA con soporte offline).

---

## 📄 Créditos y Titularidad

- **Proyecto:** Finca Celia - Terrenos de Ricardo (120 Meses).
- **Administración General & Propietario:** Ricardo.
- **Peritaje Topográfico Oficial:** Ing. Celso R. Valdivia (Topógrafo Senior y Geodesta Legal).
- **Atención al Cliente WhatsApp Oficial:** +503 7574-3444 (75743444).