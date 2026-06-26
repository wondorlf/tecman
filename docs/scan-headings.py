"""
Escanea un PDF generado por Puppeteer y encuentra en qué página aparece cada
encabezado h2 (capítulos principales del manual).

Uso: python docs/scan-headings.py <pdf_path>

Salida: JSON con array de {title: string, page: number}
"""

import json
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF no instalado. Ejecute: pip install PyMuPDF")
    sys.exit(1)


def find_headings_in_pdf(pdf_path: str, content_start_page: int = 4):
    """
    Escanea cada página del PDF buscando texto que coincida con encabezados h2.
    
    Los encabezados h2 en el HTML generado por marked se renderizan como:
    <h2>Texto del Capítulo</h2>
    
    En el PDF, aparecen como texto con formato "2. Instalación y Despliegue"
    o "3. Manual de Funciones por Módulo" etc.
    
    content_start_page: primera página de contenido (después de cover + revisiones + TOC)
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    # Patrones de encabezados h2
    # Los headings h2 del markdown se renderizan como texto numérico:
    # "1. Introducción", "2. Instalación y Despliegue", "3. Manual de Funciones..."
    heading_patterns = [
        r"^\d+\.\s+.+",           # "1. Introducción"
        r"^\d+\.\d+\s+.+",        # "2.1 Requisitos"
        r"^4\.\s+Manual por Rol", # "4. Manual por Rol"
        r"^5\.\s+Apéndice",       # "5. Apéndice"
        r"^6\.\s+Apéndice",       # "6. Apéndice"
    ]
    combined = re.compile("|".join(heading_patterns))
    
    # Mapa de títulos de capítulos esperados (desde el markdown)
    expected_headings = [
        "1. Introducción",
        "2. Instalación y Despliegue",
        "3. Manual de Funciones por Módulo",
        "4. Manual por Rol de Usuario",
        "5. Apéndice: API REST",
        "6. Apéndice: Atajos de Teclado y Buenas Prácticas",
    ]
    
    results = []
    
    for page_num in range(content_start_page, total_pages):
        page = doc[page_num]
        text = page.get_text("text")
        lines = text.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Buscar coincidencias con encabezados principales
            for expected in expected_headings:
                # Normalizar: quitar asteriscos dobles (bold en markdown)
                clean_line = line.replace("**", "").strip()
                if clean_line.startswith(expected[:15]):  # matching por prefijo
                    entry = {"title": expected, "page": page_num + 1}
                    if entry not in results:
                        results.append(entry)
                    break
            
            # También detectar encabezados numéricos no listados
            if combined.match(line) and not any(r["title"] == line.replace("**","").strip() for r in results):
                clean = line.replace("**", "").strip()
                if len(clean) > 5 and len(clean) < 80:
                    results.append({"title": clean, "page": page_num + 1})
    
    doc.close()
    
    # Si no se encontraron headings en las páginas de contenido, 
    # buscar desde el inicio del documento
    if len(results) < 3:
        results = []
        for page_num in range(0, total_pages):
            page = doc[page_num]
            text = page.get_text("text")
            lines = text.split("\n")
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                for expected in expected_headings:
                    clean_line = line.replace("**", "").strip()
                    if clean_line.startswith(expected[:15]):
                        entry = {"title": expected, "page": page_num + 1}
                        if entry not in results:
                            results.append(entry)
                        break
    
    return results


def search_pdf_by_marker(pdf_path: str, markers: list):
    """
    Busca marcadores específicos en el PDF para localizar secciones.
    
    markers: lista de strings a buscar
    """
    doc = fitz.open(pdf_path)
    results = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        
        for marker in markers:
            # Buscar en el texto de la página
            if marker in text:
                results.append({"title": marker, "page": page_num + 1})
                break
    
    doc.close()
    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python scan-headings.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        # Búsqueda primaria: buscar en páginas de contenido
        headings = find_headings_in_pdf(pdf_path, content_start_page=4)
        
        # Si no encontramos todos, búsqueda secundaria con marcadores exactos
        if len(headings) < 4:
            markers = [
                "1. Introducción",
                "2. Instalación",
                "3. Manual de Funciones",
                "4. Manual por Rol",
                "5. Apéndice: API",
                "6. Apéndice: Atajos",
            ]
            extra = search_pdf_by_marker(pdf_path, markers)
            # Fusionar resultados sin duplicados
            existing_titles = {h["title"] for h in headings}
            for item in extra:
                if item["title"] not in existing_titles:
                    headings.append(item)
                    existing_titles.add(item["title"])
        
        # Ordenar por página
        headings.sort(key=lambda h: h["page"])
        
        print(json.dumps(headings, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
