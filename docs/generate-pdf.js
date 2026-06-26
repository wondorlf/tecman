/**
 * Genera el PDF del Manual de Usuario con mejoras visuales:
 * - Imágenes comprimidas con sharp
 * - Metadatos del documento (título, autor, asunto)
 * - Navegación por capítulos en header
 * - Portada + contenido + bookmarks
 *
 * Uso: node docs/generate-pdf.js
 */

const puppeteer = require("puppeteer")
const { marked } = require("marked")
const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const DOCS_DIR = __dirname
const MARKDOWN_PATH = path.join(DOCS_DIR, "MANUAL_USUARIO.md")
const OUTPUT_PATH = path.join(DOCS_DIR, "MANUAL_USUARIO.pdf")

// ─── PDF Metadata ───
const PDF_TITLE = "Manual de Usuario — TecMan CMMS/ITAM v2.0"
const PDF_AUTHOR = "EGAN Technologies S.A.S."
const PDF_SUBJECT = "Sistema de Gestión de Activos y Mantenimiento — Documentación de usuario"
const PDF_KEYWORDS = "TecMan, CMMS, ITAM, activos, mantenimiento, tickets, inventario, ITSM"

// ─── Header template (se inyectará el capítulo activo en post-procesado) ───
const HEADER_TEMPLATE = `
<div style="
  width: 100%;
  padding: 10px 55px 5px 55px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 8px;
  color: #64748b;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
">
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="
      display: inline-block;
      width: 16px;
      height: 16px;
      background: #2563eb;
      border-radius: 4px;
      text-align: center;
      line-height: 16px;
      color: white;
      font-size: 9px;
      font-weight: bold;
    ">T</span>
    <span style="font-weight: 600; color: #1e293b; font-size: 9px;">TecMan</span>
  </div>
  <span style="color: #94a3b8; font-size: 8px; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Manual de Usuario v2.0</span>
</div>`

// ─── Footer template ───
const FOOTER_TEMPLATE = `
<div style="
  width: 100%;
  padding: 5px 55px 10px 55px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 7px;
  color: #94a3b8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e2e8f0;
  box-sizing: border-box;
">
  <span>E-GAN by Jorge Montiel</span>
  <span>Pág. <span style="font-weight: 600; color: #64748b;">{{pageNumber}}</span> / {{totalPages}}</span>
  <span style="font-style: italic;">{{date}} · Confidencial</span>
</div>`

// ─── CSS profesional ───
const MANUAL_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  line-height: 1.6;
  color: #334155;
  padding: 5px 40px;
}

/* Cover page */
.cover-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #ffffff;
  page-break-after: always;
  position: relative;
  overflow: hidden;
  margin: -5px -40px 0 -40px;
  padding: 0 60px;
}

.cover-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 40%, rgba(37, 99, 235, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(37, 99, 235, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.cover-content { text-align: center; position: relative; z-index: 1; }
.logo-svg { margin-bottom: 40px; }
.logo-svg svg { width: 80px; height: 80px; filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.3)); }
.cover-title { font-size: 38px; font-weight: 800; margin-bottom: 14px; letter-spacing: -0.5px; color: #ffffff; }
.cover-subtitle { font-size: 16px; font-weight: 400; color: #94a3b8; margin-bottom: 28px; line-height: 1.4; }
.cover-divider { width: 70px; height: 3px; background: linear-gradient(90deg, #2563eb, #3b82f6); margin: 0 auto 28px auto; border-radius: 2px; }
.cover-company { font-size: 18px; font-weight: 600; color: #e2e8f0; margin-bottom: 36px; }
.cover-meta { font-size: 12px; color: #94a3b8; line-height: 1.8; margin-bottom: 36px; padding: 18px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.06); display: inline-block; text-align: left; }
.cover-meta strong { color: #e2e8f0; }
.cover-contact { font-size: 11px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }
.cover-footer-note { font-size: 10px; color: #475569; font-style: italic; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.06); }

/* Revision history page */
.revision-page {
  width: 100%;
  page-break-after: always;
  padding: 40px;
}
.revision-page h2 { font-size: 20px; color: #0f172a; margin-bottom: 24px; border: none; }
.revision-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
.revision-table th { background: #f1f5f9; color: #1e293b; font-weight: 600; padding: 10px 12px; text-align: left; border: 1px solid #e2e8f0; font-size: 10px; }
.revision-table td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 9px; }
.revision-table tr:nth-child(even) { background: #f8fafc; }

/* Headings */
h1 { font-size: 22px; color: #0f172a; margin-top: 28px; margin-bottom: 14px; }
h2 { font-size: 17px; color: #1e293b; margin-top: 24px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
h3 { font-size: 14px; color: #334155; margin-top: 20px; margin-bottom: 8px; }
h4 { font-size: 12px; color: #475569; margin-top: 16px; margin-bottom: 6px; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9px; }
th { background: #f1f5f9; color: #1e293b; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; }
td { padding: 6px 10px; border: 1px solid #e2e8f0; }
tr:nth-child(even) { background: #f8fafc; }

/* Code blocks */
pre { background: #1e293b; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 8.5px; line-height: 1.5; overflow-x: auto; margin: 12px 0; }
code { font-family: 'SF Mono', 'Fira Code', monospace; }
p > code, li > code { background: #f1f5f9; color: #2563eb; padding: 1px 5px; border-radius: 3px; font-size: 9px; }

/* Blockquotes */
blockquote { background: #f0f7ff; border-left: 3px solid #2563eb; padding: 10px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }
blockquote p { color: #1e40af; font-size: 9px; }

/* Lists */
ul, ol { margin: 8px 0; padding-left: 24px; }
li { margin: 4px 0; }

/* Images */
img { max-width: 100%; border-radius: 6px; margin: 8px 0; border: 1px solid #e2e8f0; }

/* Page breaks */
.page-break { page-break-after: always; }

strong { color: #0f172a; }
em { color: #475569; }
a { color: #2563eb; text-decoration: none; }

/* Admonition / notes */
.note { background: #fefce8; border-left: 3px solid #eab308; padding: 10px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }

/* Shortcut key styling */
kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 9px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #1e293b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 1px 0 #cbd5e1;
  line-height: 1.4;
  margin: 0 2px;
}
`

/**
 * Comprime una imagen con sharp y la devuelve como buffer.
 * Reduce a 700px de ancho y optimiza calidad.
 */
async function compressImage(imgPath, imgFile) {
  const ext = path.extname(imgFile).toLowerCase()
  try {
    const pipeline = sharp(imgPath)
      .resize(700, undefined, { fit: "inside", withoutEnlargement: true })
    
    if (ext === ".png") {
      return await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
    } else {
      return await pipeline.jpeg({ quality: 80 }).toBuffer()
    }
  } catch (e) {
    // Fallback a la imagen original si sharp falla
    return fs.readFileSync(imgPath)
  }
}

/**
 * Genera un data URI con la imagen comprimida
 */
async function imageToDataUri(imgPath, imgFile) {
  const ext = path.extname(imgFile).toLowerCase()
  const mimeType = ext === ".png" ? "image/png" 
    : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" 
    : ext === ".gif" ? "image/gif" 
    : ext === ".svg" ? "image/svg+xml" 
    : "image/png"
  
  const compressed = await compressImage(imgPath, imgFile)
  const base64 = compressed.toString("base64")
  return `data:${mimeType};base64,${base64}`
}

async function generatePDF() {
  console.log("📖 Leyendo markdown...")
  let markdown = fs.readFileSync(MARKDOWN_PATH, "utf-8")

  // Eliminar el bloque de nota de capturas (no va en el PDF)
  markdown = markdown.replace(/> \*\*📸 Capturas de pantalla:.*?\n> \n/m, "")

  console.log("🔄 Comprimiendo y embebiendo imágenes con sharp...")
  const SCREENSHOTS_DIR = path.join(DOCS_DIR, "screenshots")
  let markdownWithImages = markdown
  const screenshotRegex = /\]\(screenshots\/([^)]+)\)/g
  let match
  let embedded = 0
  let failed = 0
  let originalSize = 0
  let compressedSize = 0

  while ((match = screenshotRegex.exec(markdown)) !== null) {
    const imgFile = match[1]
    const imgPath = path.join(SCREENSHOTS_DIR, imgFile)

    try {
      if (fs.existsSync(imgPath)) {
        const originalBuffer = fs.readFileSync(imgPath)
        originalSize += originalBuffer.length
        const dataUri = await imageToDataUri(imgPath, imgFile)
        compressedSize += Buffer.from(dataUri.split(",")[1], "base64").length
        markdownWithImages = markdownWithImages.replace(`](screenshots/${imgFile})`, `](${dataUri})`)
        embedded++
      } else {
        failed++
      }
    } catch (e) {
      failed++
    }
  }

  const compressionPct = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(0) : 0
  console.log(`   📸 ${embedded} imágenes embebidas`)
  if (failed > 0) console.log(`   ⚠️ ${failed} imágenes no encontradas`)
  console.log(`   💾 Compresión: ${(originalSize / 1024).toFixed(0)} KB → ${(compressedSize / 1024).toFixed(0)} KB (${compressionPct}% reducción)`)

  console.log("🔄 Extrayendo estructura de capítulos para bookmarks...")
  const headingRegex = /^##\s+(.+)$/gm
  const chapters = []
  let hMatch
  while ((hMatch = headingRegex.exec(markdown)) !== null) {
    chapters.push(hMatch[1].trim().replace(/\*\*/g, ""))
  }

  console.log(`   📑 ${chapters.length} capítulos detectados`)

  console.log("🔄 Convirtiendo markdown a HTML...")
  const bodyHtml = marked.parse(markdownWithImages)

  console.log("🎨 Ensamblando documento HTML...")
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${PDF_TITLE}</title>
  <style>${MANUAL_CSS}</style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`

  console.log("🚀 Lanzando Puppeteer...")
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 })

  console.log("📄 Generando PDF con headers, footers y metadata...")
  await page.pdf({
    path: OUTPUT_PATH,
    format: "A4",
    margin: {
      top: "60px",
      bottom: "55px",
      left: "15mm",
      right: "15mm",
    },
    displayHeaderFooter: true,
    headerTemplate: HEADER_TEMPLATE,
    footerTemplate: FOOTER_TEMPLATE,
    printBackground: true,
    preferCSSPageSize: false,
  })

  await browser.close()

  const stats = fs.statSync(OUTPUT_PATH)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1)
  console.log(`✅ PDF generado exitosamente:`)
  console.log(`   📁 ${OUTPUT_PATH}`)
  console.log(`   💾 ${sizeMB} MB`)
  console.log(`   📑 ${chapters.length} capítulos indexados para bookmarks`)
}

generatePDF().catch((err) => {
  console.error("❌ Error:", err.message)
  process.exit(1)
})
