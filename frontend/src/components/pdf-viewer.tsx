"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set worker URL to load the PDF.js library correctly in Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
    url: string;
    fileName?: string;
    onClose?: () => void;
}

export function PdfViewer({ url, fileName = "Documento", onClose }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
        setPageNumber(1);
    }

    const unzoom = () => setScale(s => Math.max(0.5, s - 0.2));
    const zoom = () => setScale(s => Math.min(2.5, s + 0.2));

    const handleDownload = () => {
        window.open(url, "_blank");
    };

    return (
        <Card className="flex flex-col items-center p-4 bg-muted/20 w-full max-w-4xl mx-auto overflow-hidden">
            <div className="flex items-center justify-between w-full mb-4 bg-background p-2 rounded-md shadow-sm border">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={unzoom} disabled={scale <= 0.5}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-mono w-12 text-center">{(scale * 100).toFixed(0)}%</span>
                    <Button variant="outline" size="icon" onClick={zoom} disabled={scale >= 2.5}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 font-medium">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm">
                        Página {pageNumber} de {numPages || '--'}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
                        disabled={pageNumber >= (numPages || 1)}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="default" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Original
                    </Button>
                    {onClose && (
                        <Button variant="destructive" size="sm" onClick={onClose}>
                            Cerrar
                        </Button>
                    )}
                </div>
            </div>

            <div className="overflow-auto border rounded-md shadow bg-white max-h-[70vh] flex justify-center w-full min-h-[400px]">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center justify-center h-full w-full min-h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">Cargando documento...</span>
                        </div>
                    }
                    error={
                        <div className="text-destructive p-4 text-center">
                            Error al cargar el archivo PDF. Verifique que el enlace sea válido.
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-md"
                    />
                </Document>
            </div>
        </Card>
    );
}
