'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api';
import type { Asset, PaginatedResponse } from '@/lib/types';
import { SearchBar } from '@/components/shared/search-bar';
import { SectionWrapper } from '@/components/shared/section-wrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Printer,
  Package,
  ChevronLeft,
  ChevronRight,
  QrCode,
  CheckSquare,
  Square,
  Loader2,
  Grid3X3,
  Eye,
  X,
} from 'lucide-react';
import QRCodeLib from 'qrcode';

// ── Label format presets ──────────────────────────────────────────────────────
const LABEL_FORMATS = [
  { id: '2x3', cols: 2, rows: 3, perPage: 6, label: '6 etiquetas (2×3)', desc: 'Grandes — 99×70mm' },
  { id: '2x4', cols: 2, rows: 4, perPage: 8, label: '8 etiquetas (2×4)', desc: 'Estándar — 99×52mm' },
  { id: '3x4', cols: 3, rows: 4, perPage: 12, label: '12 etiquetas (3×4)', desc: 'Medianas — 66×52mm' },
  { id: '3x6', cols: 3, rows: 6, perPage: 18, label: '18 etiquetas (3×6)', desc: 'Pequeñas — 66×35mm' },
  { id: '4x6', cols: 4, rows: 6, perPage: 24, label: '24 etiquetas (4×6)', desc: 'Mini — 49×35mm' },
] as const;

type LabelFormatId = (typeof LABEL_FORMATS)[number]['id'];

export default function StickersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [labelFormat, setLabelFormat] = useState<LabelFormatId>('3x4');
  const [printing, setPrinting] = useState(false);
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEntries, setPreviewEntries] = useState<QrEntry[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const queryParams: Record<string, string | number> = { page, limit: 50 };
  if (search) queryParams.search = search;

  const { data: assetsResponse, isLoading } = useQuery({
    queryKey: ['assets-stickers', page, search],
    queryFn: async () => {
      const r = await assetsApi.list(queryParams);
      return r.data as PaginatedResponse<Asset>;
    },
  });

  const assets = assetsResponse?.data ?? [];
  const meta = assetsResponse?.meta ?? { total: 0, page: 1, limit: 50, totalPages: 1 };

  const format = LABEL_FORMATS.find((f) => f.id === labelFormat)!;
  const selectedCount = selectedIds.size;

  // ── Selection handlers ───────────────────────────────────────────────────
  const toggleAsset = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectAllOnPage((prev) => {
      const newVal = !prev;
      setSelectedIds((ids) => {
        const next = new Set(ids);
        for (const a of assets) {
          if (newVal) next.add(a.id);
          else next.delete(a.id);
        }
        return next;
      });
      return newVal;
    });
  }, [assets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAllOnPage(false);
  }, []);

  // ── Fetch selected assets and generate QR codes ───────────────────────────
  const prepareStickers = useCallback(async () => {
    if (selectedCount === 0) return null;

    // Fetch full details for selected assets in parallel
    const selectedAssets = await Promise.all(
      Array.from(selectedIds).map(async (id) => {
        try {
          const res = await assetsApi.get(id);
          return res.data as Asset;
        } catch {
          return null;
        }
      }),
    );
    const validAssets = selectedAssets.filter(Boolean) as Asset[];
    if (validAssets.length === 0) return null;

    // Generate QR codes for all assets
    const qrEntries = await Promise.all(
      validAssets.map(async (asset) => {
        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCodeLib.toDataURL(asset.qrCode || asset.id, {
            width: 400,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
        } catch {
          qrDataUrl = '';
        }
        return { asset, qrDataUrl };
      }),
    );

    return qrEntries.filter((e) => e.qrDataUrl);
  }, [selectedIds, selectedCount]);

  // ── Preview ───────────────────────────────────────────────────────────────
  const openPreview = async () => {
    setPreviewLoading(true);
    try {
      const entries = await prepareStickers();
      if (entries && entries.length > 0) {
        setPreviewEntries(entries);
        setPreviewOpen(true);
      }
    } catch (err) {
      console.error('Error al generar preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewEntries(null);
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = async (cachedEntries?: QrEntry[]) => {
    if (selectedCount === 0 && !cachedEntries) return;
    setPrinting(true);

    try {
      const entries = cachedEntries ?? await prepareStickers();
      if (!entries || entries.length === 0) {
        setPrinting(false);
        return;
      }

      const printHtml = buildPrintHtml(entries, format);
      const w = window.open('', '_blank');
      if (!w) {
        const w2 = window.open('', '_blank', 'width=800,height=600');
        if (!w2) {
          alert('Por favor permite las ventanas emergentes para imprimir los stickers.');
          setPrinting(false);
          return;
        }
        w2.document.write(printHtml);
        w2.document.close();
      } else {
        w.document.write(printHtml);
        w.document.close();
      }
    } catch (err) {
      console.error('Error al generar stickers:', err);
    } finally {
      setPrinting(false);
    }
  };

  // ── Search handler ────────────────────────────────────────────────────────
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Imprimir Stickers QR</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selecciona los activos para imprimir sus códigos QR en papel adhesivo
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <span className="text-sm text-slate-500">
              <strong className="text-slate-800">{selectedCount}</strong> seleccionados
            </span>
          )}
          <Button
            onClick={openPreview}
            disabled={selectedCount === 0 || previewLoading}
            className="rounded-xl h-10 px-5 text-sm font-medium gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
            variant="outline"
          >
            {previewLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Eye size={16} />
            )}
            {previewLoading ? 'Generando...' : 'Vista previa'}
          </Button>
          <Button
            onClick={() => handlePrint()}
            disabled={selectedCount === 0 || printing}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 text-sm font-medium gap-2"
          >
            {printing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            {printing ? 'Generando...' : `Imprimir (${selectedCount})`}
          </Button>
        </div>
      </div>

      {/* Filters + Format selector */}
      <Card className="border-slate-100 rounded-2xl mb-4">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <SearchBar
            id="search-stickers"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar activos por nombre, código, marca..."
            className="w-72"
          />

          <div className="flex items-center gap-2">
            <Grid3X3 size={15} className="text-slate-400 shrink-0" />
            <select
              value={labelFormat}
              onChange={(e) => setLabelFormat(e.target.value as LabelFormatId)}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {LABEL_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 ml-auto">{format.desc}</span>
        </CardContent>
      </Card>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            {selectAllOnPage ? <CheckSquare size={14} /> : <Square size={14} />}
            {selectAllOnPage ? 'Deseleccionar página' : 'Seleccionar página'}
          </button>
          {selectedCount > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Limpiar selección
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {meta.total} activo{meta.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Asset grid */}
      <SectionWrapper>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : assets.length === 0 ? (
          <Card className="border-slate-100 rounded-2xl p-12 text-center">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-600">No hay activos</h3>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Intenta con otro término de búsqueda' : 'Crea activos primero para imprimir stickers'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {assets.map((asset) => {
              const selected = selectedIds.has(asset.id);
              return (
                <button
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                  className={`
                    relative p-3 rounded-2xl border-2 text-left transition-all text-sm
                    ${
                      selected
                        ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }
                  `}
                >
                  <div
                    className={`
                      absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-colors
                      ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-transparent'}
                    `}
                  >
                    {selected ? (
                      <CheckSquare size={12} />
                    ) : (
                      <Square size={12} className="text-slate-300" />
                    )}
                  </div>

                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-2 mx-auto">
                    <QrCode
                      size={24}
                      className={selected ? 'text-blue-600' : 'text-slate-400'}
                    />
                  </div>

                  <p className="font-semibold text-slate-800 text-xs leading-snug line-clamp-2 text-center">
                    {asset.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 text-center truncate">
                    {asset.code}
                  </p>
                  <p className="text-[10px] text-slate-400 text-center truncate mt-0.5">
                    {[asset.brand, asset.model].filter(Boolean).join(' · ') || '—'}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </SectionWrapper>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl h-8 px-3 text-xs gap-1"
          >
            <ChevronLeft size={14} /> Anterior
          </Button>
          <span className="text-sm text-slate-500">
            Página {meta.page} de {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl h-8 px-3 text-xs gap-1"
          >
            Siguiente <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* ── Preview Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={(o) => !o && closePreview()}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye size={18} className="text-blue-600" />
              Vista previa — {format.label}
            </DialogTitle>
          </DialogHeader>

          {previewEntries && (
            <>
              {/* Preview scroll area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                {buildPreviewPages(previewEntries, format).map(
                  (pageContent, pi) => (
                    <div key={pi}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">
                        Página {pi + 1}
                      </p>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mx-auto"
                        style={{
                          maxWidth: 620,
                          aspectRatio: '210 / 297',
                        }}
                      >
                        <div
                          className="w-full h-full grid"
                          style={{
                            gridTemplateColumns: `repeat(${format.cols}, 1fr)`,
                            gridTemplateRows: `repeat(${format.rows}, 1fr)`,
                          }}
                        >
                          {pageContent.map((entry, si) =>
                            entry ? (
                              <div
                                key={entry.asset.id}
                                className="flex flex-col items-center justify-center p-1.5 border-[0.5px] border-dashed border-slate-200 overflow-hidden"
                              >
                                <img
                                  src={entry.qrDataUrl}
                                  alt="QR"
                                  className="w-3/5 max-w-[90%] h-auto aspect-square"
                                  style={{ imageRendering: 'pixelated' }}
                                />
                                <div className="text-center w-full mt-0.5 px-0.5">
                                  <p
                                    className="font-bold text-slate-800 leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
                                    style={{ fontSize: format.cols <= 2 ? '7pt' : format.cols <= 3 ? '6.5pt' : '5.5pt' }}
                                  >
                                    {entry.asset.name.length > 30
                                      ? entry.asset.name.slice(0, 28) + '…'
                                      : entry.asset.name}
                                  </p>
                                  <p
                                    className="font-mono text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap"
                                    style={{ fontSize: format.cols <= 2 ? '6pt' : format.cols <= 3 ? '5.5pt' : '5pt' }}
                                  >
                                    {entry.asset.code}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div key={`empty-${si}`} className="border-[0.5px] border-dashed border-transparent" />
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Summary bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700">{previewEntries.length}</strong> stickers en{' '}
                  <strong className="text-slate-700">
                    {Math.ceil(previewEntries.length / format.perPage)}
                  </strong>{' '}
                  hoja{Math.ceil(previewEntries.length / format.perPage) !== 1 ? 's' : ''} A4
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={closePreview}
                    className="rounded-xl h-9 text-sm gap-1.5"
                  >
                    <X size={14} /> Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      const cached = previewEntries;
                      closePreview();
                      // Use cached entries to avoid re-fetching
                      setTimeout(() => handlePrint(cached ?? undefined), 300);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm gap-1.5"
                  >
                    <Printer size={14} /> Imprimir
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Preview Helpers
// ═══════════════════════════════════════════════════════════════════════════════

interface QrEntry {
  asset: Asset;
  qrDataUrl: string;
}

function buildPreviewPages(
  entries: QrEntry[],
  format: (typeof LABEL_FORMATS)[number],
): (QrEntry | null)[][] {
  const { perPage } = format;
  const pages: (QrEntry | null)[][] = [];
  for (let i = 0; i < entries.length; i += perPage) {
    const pageEntries = entries.slice(i, i + perPage);
    const filled: (QrEntry | null)[] = [...pageEntries];
    while (filled.length < perPage) {
      filled.push(null);
    }
    pages.push(filled);
  }
  return pages;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Print HTML Builder — generates an optimized layout for adhesive label paper
// ═══════════════════════════════════════════════════════════════════════════════

function buildPrintHtml(entries: QrEntry[], format: (typeof LABEL_FORMATS)[number]): string {
  const { cols, rows, perPage } = format;

  const pages: QrEntry[][] = [];
  for (let i = 0; i < entries.length; i += perPage) {
    pages.push(entries.slice(i, i + perPage));
  }

  const pagesHtml = pages
    .map((pageEntries) => {
      const stickers = pageEntries
        .map(({ asset, qrDataUrl }) => {
          const shortName = asset.name.length > 40 ? asset.name.slice(0, 38) + '…' : asset.name;

          return `
            <div class="sticker">
              <div class="sticker-inner">
                <img src="${qrDataUrl}" alt="QR" class="qr" />
                <div class="label">
                  <p class="name">${escapeHtml(shortName)}</p>
                  <p class="code">${escapeHtml(asset.code)}</p>
                </div>
              </div>
            </div>`;
        })
        .join('');

      const emptyCount = perPage - pageEntries.length;
      const empties =
        emptyCount > 0
          ? Array.from({ length: emptyCount })
              .map(() => `<div class="sticker empty"></div>`)
              .join('')
          : '';

      return `<div class="page">${stickers}${empties}</div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Stickers QR - TecMan</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 5mm;
    }

    body {
      font-family: 'Segoe UI', -apple-system, sans-serif;
      background: white;
      color: #1a1a2e;
    }

    .page {
      width: 200mm;
      height: 287mm;
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      grid-template-rows: repeat(${rows}, 1fr);
      page-break-after: always;
      break-after: page;
    }

    .sticker {
      border: 0.5px dashed #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3mm;
      overflow: hidden;
    }

    .sticker.empty {
      border-color: transparent;
    }

    .sticker-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      width: 100%;
      height: 100%;
    }

    .qr {
      width: 60%;
      max-width: ${cols <= 2 ? '35mm' : cols <= 3 ? '28mm' : '22mm'};
      height: auto;
      aspect-ratio: 1;
      image-rendering: pixelated;
    }

    .label {
      text-align: center;
      width: 100%;
      padding: 0 1mm;
    }

    .name {
      font-size: ${cols <= 2 ? '8pt' : cols <= 3 ? '7pt' : '6.5pt'};
      font-weight: 700;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .code {
      font-size: ${cols <= 2 ? '6.5pt' : cols <= 3 ? '6pt' : '5.5pt'};
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      color: #666;
      margin-top: 0.5mm;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sticker:not(.empty) {
      position: relative;
    }

    .sticker:not(.empty)::before,
    .sticker:not(.empty)::after {
      content: '';
      position: absolute;
      background: #999;
    }

    .sticker:not(.empty)::before {
      top: -0.5px;
      left: -0.5px;
      width: 4mm;
      height: 0.5px;
    }

    .sticker:not(.empty)::after {
      top: -0.5px;
      left: -0.5px;
      width: 0.5px;
      height: 4mm;
    }

    @media print {
      body { background: white; }
      .page { page-break-after: always; }
    }
  </style>
</head>
<body>
  ${pagesHtml}
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
