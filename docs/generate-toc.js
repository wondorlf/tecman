/**
 * Genera una Tabla de Contenidos (TOC) con números de página reales
 * y la inserta al inicio del manual antes de regenerar el PDF final.
 *
 * Proceso:
 *   1. Genera PDF temporal sin TOC
 *   2. Escanea el PDF con PyMuPDF para ubicar cada heading h2
 *   3. Construye TOC markdown con páginas reales
 *   4. Prepend TOC al markdown fuente y regenera PDF final
 *
 * Uso: node docs/generate-toc.js
 */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const DOCS_DIR = __dirname
const MARKDOWN_PATH = path.join(DOCS_DIR, "MANUAL_USUARIO.md")
const TEMP_PDF_PATH = path.join(DOCS_DIR, "_temp_no_toc.pdf")
const FINAL_PDF_PATH = path.join(DOCS_DIR, "MANUAL_USUARIO.pdf")
const SCAN_SCRIPT = path.join(DOCS_DIR, "scan-headings.py")
const BACKUP_MD = path.join(DOCS_DIR, "MANUAL_USUARIO.md.bak")
const TOC_MARKER_START = "<!-- TOC_AUTO_GENERATED -->"
const TOC_MARKER_END = "<!-- TOC_AUTO_GENERATED_END -->"

/**
 * Genera el PDF temporal (1er pase) modificando generate-pdf.js
 * para que use _temp_no_toc.pdf como salida
 */
function generateTempPDF() {
  console.log("📄 Pase 1: Generando PDF temporal sin TOC...")

  // Modificar temporalmente la ruta de salida
  const genScript = fs.readFileSync(path.join(DOCS_DIR, "generate-pdf.js"), "utf-8")
  const modified = genScript.replace(
    'const OUTPUT_PATH = path.join(DOCS_DIR, "MANUAL_USUARIO.pdf")',
    'const OUTPUT_PATH = path.join(DOCS_DIR, "_temp_no_toc.pdf")'
  )

  const tempGenPath = path.join(DOCS_DIR, "_temp_generate.js")
  fs.writeFileSync(tempGenPath, modified)

  try {
    execSync(`node "${tempGenPath}"`, {
      cwd: DOCS_DIR,
      stdio: "pipe",
      timeout: 180000,
      encoding: "utf-8",
    })
  } catch (e) {
    console.error("❌ Error generando PDF temporal:", e.stderr || e.message)
    // Limpiar archivos temporales
    try { fs.unlinkSync(tempGenPath) } catch {}
    throw e
  }

  // Limpiar
  try { fs.unlinkSync(tempGenPath) } catch {}

  if (!fs.existsSync(TEMP_PDF_PATH)) {
    throw new Error("No se generó el PDF temporal")
  }

  const sizeKB = (fs.statSync(TEMP_PDF_PATH).size / 1024).toFixed(0)
  console.log(`   ✅ PDF temporal generado: ${sizeKB} KB`)
}

/**
 * Escanea el PDF temporal con PyMuPDF para encontrar los headings
 */
function scanHeadings() {
  console.log("🔍 Escaneando PDF con PyMuPDF para localizar headings...")

  try {
    const result = execSync(
      `python "${SCAN_SCRIPT}" "${TEMP_PDF_PATH}"`,
      { cwd: DOCS_DIR, stdio: "pipe", timeout: 30000, encoding: "utf-8" }
    )

    const headings = JSON.parse(result.trim())
    console.log(`   ✅ ${headings.length} headings encontrados`)
    headings.forEach(h => console.log(`   📌 Pág. ${h.page}: ${h.title}`))
    return headings
  } catch (e) {
    console.error("❌ Error escaneando PDF:", e.stderr || e.message)
    return []
  }
}

/**
 * Construye el markdown de la TOC con números de página reales
 */
function buildTOCMarkdown(headings) {
  // Extraer subsecciones del markdown original
  const markdown = fs.readFileSync(MARKDOWN_PATH, "utf-8")
  
  // Mapa de heading h2 -> subsecciones h3 que le siguen hasta el próximo h2
  const sections = {}
  let currentH2 = null
  
  const lines = markdown.split("\n")
  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/)
    const h3Match = line.match(/^###\s+(.+)$/)
    
    if (h2Match) {
      currentH2 = h2Match[1].trim().replace(/\*\*/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim()
      if (!sections[currentH2]) {
        sections[currentH2] = []
      }
    } else if (h3Match && currentH2) {
      const title = h3Match[1].trim().replace(/\*\*/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim()
      // Solo incluir subsecciones relevantes (evitar "Ruta:" items)
      if (title && !title.startsWith("Ruta:")) {
        sections[currentH2].push(title)
      }
    }
  }

  // Construir TOC en markdown
  let toc = `${TOC_MARKER_START}\n`
  toc += `## 📑 Tabla de Contenido\n\n`
  toc += `| Sección | Página |\n`
  toc += `|---------|--------|\n`

  for (const heading of headings) {
    const title = heading.title
    const page = heading.page
    
    // Encontrar subsecciones para este heading
    const subs = sections[title] || []
    
    toc += `| **${title}** | **${page}** |\n`
    
    // Agregar subsecciones indentadas (solo si tenemos suficientes páginas)
    // Estimamos distribución uniforme para subsecciones
    if (subs.length > 0 && subs.length < 15) {
      const pagesPerSub = Math.max(1, Math.floor(3 / Math.max(1, subs.length)))
      let subPage = page
      for (let i = 0; i < Math.min(subs.length, 10); i++) {
        const subTitle = subs[i]
        if (subTitle.length > 50) continue
        toc += `| &nbsp;&nbsp;&nbsp;${subTitle} | ${subPage} |\n`
        subPage += pagesPerSub
      }
    }
  }

  toc += `\n<div style="page-break-after: always;"></div>\n`
  toc += `${TOC_MARKER_END}\n\n`

  return toc
}

/**
 * Inserta la TOC en el markdown (reemplaza el bloque de índice existente)
 * y elimina la nota de capturas
 */
function insertTOCInMarkdown(tocMarkdown) {
  console.log("📝 Insertando TOC en el markdown...")
  
  let markdown = fs.readFileSync(MARKDOWN_PATH, "utf-8")

  // Hacer backup
  fs.writeFileSync(BACKUP_MD, markdown)

  // Eliminar TOC anterior si existe
  const oldTocRegex = new RegExp(`${TOC_MARKER_START}[\\\\s\\\\S]*?${TOC_MARKER_END}\\\\n*`, "g")
  markdown = markdown.replace(oldTocRegex, "")

  // Eliminar la nota de capturas
  markdown = markdown.replace(/> \\*\\*📸 Capturas de pantalla:[\\s\\S]*?\\n\\n---\\n\\n/m, "---\\n\\n")

  // Eliminar el índice markdown existente (entre "## Índice" y "---\\n\\n## 1.")
  markdown = markdown.replace(/## Índice\\n[\\s\\S]*?\\n---\\n\\n(?=## 1\\.)/, "")

  // Insertar TOC después del blockquote inicial y antes de "---\\n\\n## 1."
  // Buscar el primer "---\\n\\n## 1." y poner la TOC antes
  markdown = markdown.replace(
    /(---\\n\\n## 1\\. Introducción)/,
    `${tocMarkdown}$1`
  )

  fs.writeFileSync(MARKDOWN_PATH, markdown, "utf-8")
  console.log("   ✅ TOC insertada en el markdown")
}

/**
 * Regenera el PDF final (2do pase)
 */
function regenerateFinalPDF() {
  console.log("📄 Pase 2: Regenerando PDF final con TOC...")

  // Eliminar PDF temporal
  try { fs.unlinkSync(TEMP_PDF_PATH) } catch {}

  // Ejecutar generate-pdf.js (que ahora usará MANUAL_USUARIO.pdf como salida)
  try {
    execSync(`node "${path.join(DOCS_DIR, "generate-pdf.js")}"`, {
      cwd: DOCS_DIR,
      stdio: "pipe",
      timeout: 180000,
      encoding: "utf-8",
    })
  } catch (e) {
    console.error("❌ Error regenerando PDF:", e.stderr || e.message)
    throw e
  }

  if (!fs.existsSync(FINAL_PDF_PATH)) {
    throw new Error("No se generó el PDF final")
  }

  const stats = fs.statSync(FINAL_PDF_PATH)
  console.log(`   ✅ PDF final generado: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
}

/**
 * Ejecuta enrich-pdf.js para agregar metadatos
 */
function enrichPDF() {
  console.log("🏷️ Agregando metadatos al PDF final...")
  try {
    execSync(`node "${path.join(DOCS_DIR, "enrich-pdf.js")}"`, {
      cwd: DOCS_DIR,
      stdio: "pipe",
      timeout: 30000,
      encoding: "utf-8",
    })
  } catch (e) {
    console.error("⚠️ Error en enrich:", e.stderr || e.message)
  }
}

/**
 * Limpieza: restaura el markdown original
 */
function cleanup() {
  console.log("🧹 Limpiando archivos temporales...")
  
  // Restaurar markdown original desde backup
  if (fs.existsSync(BACKUP_MD)) {
    fs.copyFileSync(BACKUP_MD, MARKDOWN_PATH)
    fs.unlinkSync(BACKUP_MD)
    console.log("   ✅ Markdown original restaurado")
  }

  // Eliminar archivos temporales
  try { fs.unlinkSync(TEMP_PDF_PATH) } catch {}
  try { fs.unlinkSync(path.join(DOCS_DIR, "_temp_generate.js")) } catch {}
  
  console.log("   ✅ Archivos temporales eliminados")
}

async function main() {
  console.log("=".repeat(60))
  console.log("📑 GENERACIÓN DE TABLA DE CONTENIDOS AUTOMÁTICA")
  console.log("=".repeat(60))

  try {
    // 1. Generar PDF temporal
    generateTempPDF()

    // 2. Escanear headings
    const headings = scanHeadings()
    if (headings.length === 0) {
      console.log("⚠️ No se encontraron headings, usando TOC estimada")
    }

    // 3. Construir TOC
    const toc = buildTOCMarkdown(headings)
    console.log(`\n📑 TOC generada con ${headings.length} entradas:`)
    headings.forEach(h => console.log(`   Pág. ${h.page}: ${h.title}`))

    // 4. Insertar TOC en markdown y regenerar PDF
    insertTOCInMarkdown(toc)
    regenerateFinalPDF()

    // 5. Enriquecer con metadatos
    enrichPDF()

    console.log("\n" + "=".repeat(60))
    console.log("✅ PROCESO COMPLETADO EXITOSAMENTE")
    console.log("=".repeat(60))
    console.log(`📁 PDF final: ${FINAL_PDF_PATH}`)

  } catch (e) {
    console.error("\n❌ Error:", e.message)
    console.log("Restaurando archivos originales...")
  } finally {
    cleanup()
  }
}

main()
