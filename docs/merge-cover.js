/**
 * Script para fusionar la portada con el manual TecMan en un solo PDF.
 * 
 * Uso: node docs/merge-cover.js
 */

const { PDFDocument } = require("pdf-lib")
const fs = require("fs")
const path = require("path")

async function mergePDFs() {
  const docsDir = __dirname

  const coverPath = path.join(docsDir, "cover.pdf")
  const manualPath = path.join(docsDir, "MANUAL_USUARIO.pdf")
  const outputPath = path.join(docsDir, "MANUAL_USUARIO.pdf")

  // Verificar que los archivos existen
  if (!fs.existsSync(coverPath)) {
    console.error("❌ No se encontró cover.pdf — ejecute primero la conversión de la portada")
    process.exit(1)
  }
  if (!fs.existsSync(manualPath)) {
    console.error("❌ No se encontró MANUAL_USUARIO.pdf")
    process.exit(1)
  }

  console.log("📄 Leyendo portada...")
  const coverBytes = fs.readFileSync(coverPath)
  const coverDoc = await PDFDocument.load(coverBytes)

  console.log("📄 Leyendo manual...")
  const manualBytes = fs.readFileSync(manualPath)
  const manualDoc = await PDFDocument.load(manualBytes)

  // Crear un nuevo documento PDF
  console.log("🔗 Fusionando documentos...")
  const mergedDoc = await PDFDocument.create()

  // Copiar páginas de la portada
  const coverPages = await mergedDoc.copyPages(coverDoc, coverDoc.getPageIndices())
  for (const page of coverPages) {
    mergedDoc.addPage(page)
  }

  // Copiar páginas del manual
  const manualPages = await mergedDoc.copyPages(manualDoc, manualDoc.getPageIndices())
  for (const page of manualPages) {
    mergedDoc.addPage(page)
  }

  // Guardar el PDF fusionado
  console.log("💾 Guardando PDF fusionado...")
  const mergedBytes = await mergedDoc.save()
  fs.writeFileSync(outputPath, mergedBytes)

  const totalPages = mergedDoc.getPageCount()
  const sizeKB = (mergedBytes.length / 1024).toFixed(1)
  console.log(`✅ PDF final generado: ${outputPath}`)
  console.log(`   Páginas: ${totalPages} (1 portada + ${manualDoc.getPageCount()} manual)`)
  console.log(`   Tamaño: ${sizeKB} KB`)
}

mergePDFs().catch((err) => {
  console.error("❌ Error:", err.message)
  process.exit(1)
})
