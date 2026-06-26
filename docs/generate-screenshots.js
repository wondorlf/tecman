/**
 * Script para generar capturas de pantalla del sistema TecMan.
 *
 * Uso:
 *   1. Asegúrese de que el servidor esté corriendo (npm run dev)
 *   2. Ejecute: node docs/generate-screenshots.js
 *
 * Requisitos:
 *   npm install puppeteer
 *
 * Las imágenes se guardarán en docs/screenshots/
 */

const puppeteer = require("puppeteer")
const fs = require("fs")
const path = require("path")

const BASE_URL = "http://localhost:3000"
const API_URL = "http://localhost:3001"
const EMAIL = "admin@tecman.local"
const PASSWORD = "admin123"
const SCREENSHOTS_DIR = path.join(__dirname, "screenshots")

const VIEWPORT = { width: 1440, height: 900 }

// Lista de capturas a generar
const screenshots = [
  // === Sección 2: Instalación y Acceso ===
  { name: "login.png", url: `${BASE_URL}/`, desc: "Pantalla de inicio de sesión" },
  { name: "login-form.png", url: `${BASE_URL}/`, desc: "Formulario de login con campos email y contraseña", auth: true },

  // === Sección 3.1: Dashboard ===
  { name: "dashboard.png", auth: true, url: `${BASE_URL}/dashboard`, desc: "Dashboard principal con KPIs, gráficas y actividad reciente" },
  { name: "dashboard-consolidado.png", auth: true, url: `${BASE_URL}/dashboard/consolidated`, desc: "Vista consolidada del dashboard con métricas globales" },

  // === Sección 3.2: Activos ===
  { name: "activos-lista.png", auth: true, url: `${BASE_URL}/dashboard/assets`, desc: "Lista paginada de activos con búsqueda y filtros" },
  { name: "activos-crear.png", auth: true, url: `${BASE_URL}/dashboard/assets`, desc: "Formulario de creación de activo con campos y atributos dinámicos" },
  { name: "activos-detalle.png", auth: true, url: `${BASE_URL}/dashboard/assets`, desc: "Detalle de activo con ficha técnica, depreciación y hoja de vida" },
  { name: "activos-importar.png", auth: true, url: `${BASE_URL}/dashboard/assets`, desc: "Diálogo de importación masiva desde archivo XLSX" },

  // === Sección 3.3: Kits ===
  { name: "kits.png", auth: true, url: `${BASE_URL}/dashboard/kits`, desc: "Gestión de kits con lista y detalle de activos agrupados" },

  // === Sección 3.4: Etiquetas ===
  { name: "etiquetas.png", auth: true, url: `${BASE_URL}/dashboard/tags`, desc: "Gestión de etiquetas con colores y asignación a activos" },

  // === Sección 3.5: Asignaciones ===
  { name: "asignaciones.png", auth: true, url: `${BASE_URL}/dashboard/custodies`, desc: "Lista de custodias y asignaciones de activos a usuarios" },

  // === Sección 3.6: Reservas ===
  { name: "reservas.png", auth: true, url: `${BASE_URL}/dashboard/bookings`, desc: "Calendario y lista de reservas de activos" },

  // === Sección 3.7: Mantenimiento ===
  { name: "mantenimiento-lista.png", auth: true, url: `${BASE_URL}/dashboard/maintenance`, desc: "Lista de órdenes de mantenimiento con filtros por tipo y estado" },
  { name: "mantenimiento-detalle.png", auth: true, url: `${BASE_URL}/dashboard/maintenance`, desc: "Detalle de orden de mantenimiento con checklist, evidencias y diagnóstico" },

  // === Sección 3.8: Checklists ===
  { name: "checklists.png", auth: true, url: `${BASE_URL}/dashboard/checklists`, desc: "Plantillas de checklist con ítems de 12 tipos de campo" },

  // === Sección 3.9: Alertas ===
  { name: "alertas.png", auth: true, url: `${BASE_URL}/dashboard/alerts`, desc: "Lista de alertas activas con tipos y opciones de resolución" },

  // === Sección 3.10: Tickets ===
  { name: "tickets-lista.png", auth: true, url: `${BASE_URL}/dashboard/tickets`, desc: "Lista de tickets de la mesa de ayuda con filtros" },
  { name: "tickets-detalle.png", auth: true, url: `${BASE_URL}/dashboard/tickets`, desc: "Detalle de ticket con hilo de mensajes y opciones de actualización" },
  { name: "tickets-portal-publico.png", url: `${BASE_URL}/soporte`, desc: "Portal público de soporte para crear y rastrear tickets sin autenticación" },

  // === Sección 3.11: SLAs ===
  { name: "slas.png", auth: true, url: `${BASE_URL}/dashboard/slas`, desc: "Acuerdos de nivel de servicio con tiempos de respuesta y resolución" },

  // === Sección 3.12: Catálogo de Servicios ===
  { name: "catalogo-servicios.png", auth: true, url: `${BASE_URL}/dashboard/service-catalog`, desc: "Catálogo de servicios ITSM ofrecidos a los usuarios" },

  // === Sección 3.13: Knowledge Base ===
  { name: "knowledge-base.png", auth: true, url: `${BASE_URL}/dashboard/knowledge`, desc: "Base de conocimiento con categorías, búsqueda y artículos" },
  { name: "chatbot-flotante.png", auth: true, url: `${BASE_URL}/dashboard`, desc: "Chatbot flotante de ayuda con acceso rápido a KB, tickets y QR" },

  // === Sección 3.14: RFC ===
  { name: "rfc.png", auth: true, url: `${BASE_URL}/dashboard/change-requests`, desc: "Solicitudes de cambio (RFC) con flujo de aprobación ITIL" },

  // === Sección 3.15: Discovery ===
  { name: "discovery.png", auth: true, url: `${BASE_URL}/dashboard/discovery`, desc: "Dispositivos descubiertos en red con información de hardware" },
  { name: "discovery-detalle.png", auth: true, url: `${BASE_URL}/dashboard/discovery`, desc: "Detalle de dispositivo discovery con CPU, RAM, discos y cambios" },

  // === Sección 3.16: Agentes ===
  { name: "agentes.png", auth: true, url: `${BASE_URL}/dashboard/agents`, desc: "Página de descarga e instalación de agentes de discovery" },

  // === Sección 3.17: Usuarios ===
  { name: "usuarios-lista.png", auth: true, url: `${BASE_URL}/dashboard/users`, desc: "Lista de usuarios del sistema con roles y estados" },
  { name: "usuarios-crear.png", auth: true, url: `${BASE_URL}/dashboard/users`, desc: "Formulario de creación de usuario con selección de rol" },

  // === Sección 3.18: Configuración ===
  { name: "categorias.png", auth: true, url: `${BASE_URL}/dashboard/settings`, desc: "Gestión de categorías y subcategorías de activos" },
  { name: "ubicaciones.png", auth: true, url: `${BASE_URL}/dashboard/settings`, desc: "Gestión de ubicaciones físicas de los activos" },
  { name: "proveedores.png", auth: true, url: `${BASE_URL}/dashboard/settings`, desc: "Registro de proveedores con datos de contacto" },

  // === Sección 3.20: Tenant ===
  { name: "configuracion-tenant.png", auth: true, url: `${BASE_URL}/dashboard/tenant`, desc: "Configuración del sistema con datos de empresa y Telegram" },

  // === Sección 3.23: AdminJS ===
  { name: "adminjs.png", auth: true, url: `${API_URL}/admin`, desc: "Panel de administración AdminJS con modelos de base de datos" },

  // === Navegación ===
  { name: "sidebar.png", auth: true, url: `${BASE_URL}/dashboard`, desc: "Barra lateral de navegación con grupos General, Inventario, Operaciones, Soporte ITSM, Infraestructura y Admin" },

  // === Vista Pública QR ===
  { name: "vista-publica-qr.png", url: `${BASE_URL}/activo`, desc: "Vista pública de activo desde código QR (sin autenticación)" },

  // === Profile ===
  { name: "perfil-usuario.png", auth: true, url: `${BASE_URL}/dashboard/profile`, desc: "Perfil de usuario con opciones de edición" },

  // === Hoja de Vida PDF ===
  { name: "hoja-vida-pdf.png", auth: true, url: `${BASE_URL}/dashboard/assets`, desc: "Hoja de vida del activo exportada a PDF con información general y línea de tiempo" },
]

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function login(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0", timeout: 30000 })
  await sleep(1000)

  // Buscar el formulario de login y llenarlo
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="mail"]')
  const passwordInput = await page.$('input[type="password"]')

  if (emailInput && passwordInput) {
    await emailInput.click()
    await emailInput.type(EMAIL, { delay: 30 })
    await passwordInput.click()
    await passwordInput.type(PASSWORD, { delay: 30 })
    await sleep(300)

    // Buscar y hacer clic en el botón de login
    const loginButton = await page.$('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Login")')
    if (loginButton) {
      await loginButton.click()
      await sleep(2000)
    }
  }

  // Esperar a que se complete la navegación post-login
  await page.waitForSelector('nav, header, [class*="dashboard"], [class*="sidebar"]', { timeout: 10000 }).catch(() => {})
  await sleep(1500)
}

async function captureScreenshots() {
  console.log("🚀 Iniciando captura de pantallas de TecMan...\n")

  // Crear directorio de screenshots si no existe
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: VIEWPORT,
  })

  const page = await browser.newPage()

  // Autenticarse primero si hay capturas que requieren login
  const hasAuth = screenshots.some((s) => s.auth)
  if (hasAuth) {
    console.log("🔑 Iniciando sesión...")
    await login(page)
    // Guardar la cookie de autenticación para usarla en todas las capturas
    const cookies = await page.cookies()
    console.log(`✅ Sesión iniciada. Cookies: ${cookies.length}\n`)
  }

  let successCount = 0
  let failCount = 0

  for (const shot of screenshots) {
    try {
      console.log(`📸 ${shot.name} — ${shot.desc}`)

      if (!shot.auth) {
        // No requiere auth - navegar directamente
        await page.goto(shot.url, { waitUntil: "networkidle0", timeout: 30000 })
        await sleep(2000)
      }

      // Esperar a que la página cargue
      await sleep(1500)

      // Tomar captura de pantalla
      const filePath = path.join(SCREENSHOTS_DIR, shot.name)
      await page.screenshot({
        path: filePath,
        fullPage: true,
      })

      // Verificar que el archivo se haya creado
      const stats = fs.statSync(filePath)
      const sizeKB = (stats.size / 1024).toFixed(1)
      console.log(`   ✅ Guardado: ${shot.name} (${sizeKB} KB)`)
      successCount++
    } catch (error) {
      console.error(`   ❌ Error: ${shot.name} — ${error.message}`)
      failCount++
    }
  }

  await browser.close()

  console.log(`\n📊 Resumen:`)
  console.log(`   ✅ ${successCount} capturas generadas correctamente`)
  if (failCount > 0) console.log(`   ❌ ${failCount} capturas con errores`)
  console.log(`   📁 Directorio: ${SCREENSHOTS_DIR}`)
  console.log(`\n✨ Proceso completado.`)
}

captureScreenshots().catch(console.error)
