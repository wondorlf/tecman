'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { assetsApi, categoriesApi, locationsApi, suppliersApi, downloadBlob } from '@/lib/api';
import { Asset, AssetStatus, ASSET_STATUS_LABELS, PaginatedResponse } from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { SearchBar } from '@/components/shared/search-bar';
import { SectionWrapper, StaggeredItem } from '@/components/shared/section-wrapper';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Package,
  QrCode,
  Eye,
  Pencil,
  Trash2,
  Filter,
  LayoutGrid,
  List,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ScanBarcode,
  Camera,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Printer,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

const STATUS_OPTIONS: AssetStatus[] = ['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'DISPOSED', 'RESERVED'];

const EMPTY_FORM = {
  name: '',
  code: '',
  brand: '',
  model: '',
  serialNumber: '',
  description: '',
  notes: '',
  categoryId: '',
  subcategoryId: '',
  locationId: '',
  supplierId: '',
  status: 'ACTIVE' as AssetStatus,
  acquisitionDate: '',
  acquisitionCost: '',
  warrantyExpiry: '',
  expectedLifeCycle: '',
};

export default function AssetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Asset | null>(null);
  const [qrDialog, setQrDialog] = useState<{ open: boolean; url: string; name: string }>({
    open: false,
    url: '',
    name: '',
  });
  const [qrSearchDialog, setQrSearchDialog] = useState(false);
  const [qrSearchCode, setQrSearchCode] = useState('');
  const [qrSearchError, setQrSearchError] = useState<string | null>(null);
  const [qrSearchLoading, setQrSearchLoading] = useState(false);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [qrScannerError, setQrScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Code availability check ────────────────────────────────────────────────
  const [codeStatus, setCodeStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    message?: string;
  }>({ state: 'idle' });
  const codeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Leer parámetros de URL al cargar la página
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qr = params.get('qr');
      const searchParam = params.get('search');

      if (qr) {
        // Buscar activo por QR y redirigir a su detalle
        handleQrSearch(qr);
      } else if (searchParam) {
        setSearch(searchParam);
      }
    }
    // Limpiar la URL sin recargar
    if (
      typeof window !== 'undefined' &&
      (window.location.search.includes('qr=') || window.location.search.includes('search='))
    ) {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
    // Forzar refetch de activos al montar la página
    refetch();
  }, []);

  const handleQrSearch = async (code: string) => {
    setQrSearchLoading(true);
    setQrSearchError(null);
    try {
      const res = await assetsApi.findByQr(code);
      const asset = res.data;
      router.push(`/dashboard/assets/${asset.id}`);
    } catch (e: any) {
      setQrSearchError(
        e.response?.data?.message || `No se encontró ningún activo con el código "${code}"`,
      );
    } finally {
      setQrSearchLoading(false);
    }
  };

  const handleQrSearchDialog = async () => {
    if (!qrSearchCode.trim()) return;
    await handleQrSearch(qrSearchCode.trim());
  };

  // ── QR Scanner en vivo ─────────────────────────────────────────────────────
  const startQrScanner = async () => {
    setQrScannerError(null);
    setQrScannerActive(true);
    try {
      const scanner = new Html5Qrcode('qr-live-scanner');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          // QR detectado automáticamente
          playBeep();
          stopQrScanner();
          setQrSearchDialog(false);
          handleQrSearch(decodedText);
        },
        () => {
          /* ignore scan errors */
        },
      );
    } catch (e: any) {
      setQrScannerError('No se pudo acceder a la cámara. Usa la búsqueda manual.');
      setQrScannerActive(false);
    }
  };

  const stopQrScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setQrScannerActive(false);
  };

  // Limpiar scanner al cerrar diálogo
  useEffect(() => {
    if (!qrSearchDialog) {
      stopQrScanner();
    }
  }, [qrSearchDialog]);

  // Limpiar scanner al desmontar
  useEffect(() => {
    return () => {
      stopQrScanner();
    };
  }, []);

  // Debounce de búsqueda: resetear página al buscar
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const queryParams: Record<string, string | number> = { page, limit: 20 };
  if (search) queryParams.search = search;
  if (statusFilter !== 'ALL') queryParams.status = statusFilter;
  if (catFilter !== 'ALL') queryParams.categoryId = catFilter;

  const { data: assetsResponse, isLoading, refetch } = useQuery({
    queryKey: ['assets', page, search, statusFilter, catFilter],
    queryFn: async () => {
      const r = await assetsApi.list(queryParams);
      return r.data as PaginatedResponse<Asset>;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const assets = assetsResponse?.data ?? [];
  const meta = assetsResponse?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await categoriesApi.list();
      return r.data as any[];
    },
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const r = await locationsApi.list();
      return r.data as any[];
    },
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const r = await suppliersApi.list();
      return r.data as any[];
    },
  });

  const selectedCat = categories.find((c: any) => c.id === form.categoryId);
  const subcategories: any[] = selectedCat?.subcategories || [];
  const catAttributes: any[] = selectedCat?.attributes || [];

  // Los datos ya vienen filtrados del server
  const filtered = assets;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setAttrValues({});
    setCodeStatus({ state: 'idle' });
    setDialogOpen(true);
  };

  const openEdit = (a: Asset) => {
    setEditing(a);
    setCodeStatus({ state: 'idle' });
    setForm({
      name: a.name,
      code: a.code,
      brand: a.brand || '',
      model: a.model || '',
      serialNumber: a.serialNumber || '',
      description: a.description || '',
      notes: a.notes || '',
      categoryId: a.categoryId,
      subcategoryId: a.subcategory?.id || '',
      locationId: a.locationId,
      supplierId: a.supplier?.id || '',
      status: a.status,
      acquisitionDate: a.acquisitionDate ? a.acquisitionDate.split('T')[0] : '',
      acquisitionCost: a.acquisitionCost?.toString() || '',
      warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.split('T')[0] : '',
      expectedLifeCycle: a.expectedLifeCycle?.toString() || '',
    });
    // Pre-fill attribute values from existing data
    const existingAttrs: Record<string, string> = {};
    if ((a as any).attributeValues) {
      for (const av of (a as any).attributeValues) {
        existingAttrs[av.attributeId] = av.value;
      }
    }
    setAttrValues(existingAttrs);
    setDialogOpen(true);
  };

  // ── Verificar disponibilidad del código con debounce ──────────────────────
  const checkCodeDebounced = useCallback((code: string, editingCode?: string) => {
    // Limpiar timer anterior
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);

    // Si está vacío o es el mismo código que ya tiene (editando), resetear
    if (!code.trim() || code === editingCode) {
      setCodeStatus({ state: 'idle' });
      return;
    }

    // Mostrar spinner después de 300ms de escritura
    codeTimerRef.current = setTimeout(async () => {
      setCodeStatus({ state: 'checking' });
      try {
        const res = await assetsApi.checkCode(code.trim());
        if (res.data.available) {
          setCodeStatus({ state: 'available' });
        } else {
          setCodeStatus({
            state: 'taken',
            message: res.data.assetName
              ? `Ya usado por "${res.data.assetName}"`
              : 'Código no disponible',
          });
        }
      } catch {
        setCodeStatus({ state: 'idle' });
      }
    }, 500);
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.code || !form.categoryId || !form.locationId) {
      toast({
        title: 'Campos requeridos',
        description: 'Nombre, código, categoría y ubicación son obligatorios.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        acquisitionCost: form.acquisitionCost ? parseFloat(form.acquisitionCost) : undefined,
        expectedLifeCycle: form.expectedLifeCycle ? parseInt(form.expectedLifeCycle) : undefined,
        acquisitionDate: form.acquisitionDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        supplierId: form.supplierId || undefined,
        subcategoryId: form.subcategoryId || undefined,
        // Pass attribute values for saving
        attributeValues: Object.entries(attrValues)
          .filter(([, v]) => v !== '')
          .map(([attributeId, value]) => ({ attributeId, value })),
      };
      if (editing) {
        await assetsApi.update(editing.id, payload);
        toast({ title: 'Activo actualizado' });
      } else {
        await assetsApi.create(payload);
        toast({ title: 'Activo creado' });
      }
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.response?.data?.message || 'No se pudo guardar.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Asset) => {
    try {
      await assetsApi.remove(a.id);
      toast({ title: 'Activo eliminado' });
      qc.invalidateQueries({ queryKey: ['assets'] });
      setDeleteConfirm(null);
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.response?.data?.message || 'No se pudo eliminar.',
        variant: 'destructive',
      });
    }
  };

  const showQR = async (a: Asset) => {
    try {
      const url = await QRCode.toDataURL(a.qrCode || a.id, { width: 256, margin: 2 });
      setQrDialog({ open: true, url, name: a.name });
    } catch {
      toast({ title: 'No se pudo generar el QR', variant: 'destructive' });
    }
  };

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Limpiar timer de verificación de código al desmontar
  useEffect(() => {
    return () => {
      if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    };
  }, []);

  // ── Beep sound ──────────────────────────────────────────────────────────────
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => ctx.close(), 500);
    } catch {}
  };

  // ── Importar XLSX ──────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await assetsApi.importXlsx(file);
      const result = res.data;
      toast({
        title: `Importación completada`,
        description: `${result.created} activos creados${result.errors.length ? `, ${result.errors.length} errores` : ''}`,
      });
      if (result.errors.length) console.warn('Errores de importación:', result.errors);
      qc.invalidateQueries({ queryKey: ['assets'] });
    } catch (err: any) {
      toast({
        title: 'Error al importar',
        description: err.response?.data?.message || 'Archivo inválido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const res = await assetsApi.exportXlsx();
      downloadBlob(res.data, `activos_${Date.now()}.xlsx`);
      toast({ title: 'Archivo exportado' });
    } catch {
      toast({ title: 'Error al exportar', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Activos"
        subtitle={`${meta.total} activos registrados`}
        action={
          <div className="flex gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded-xl h-9 px-3 text-sm gap-1.5"
            >
              <Upload size={14} /> {importing ? 'Importando...' : 'Importar'}
            </Button>
            <Link
              href="/dashboard/assets/stickers"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium"
            >
              <Printer size={14} /> Stickers QR
            </Link>
            <Button
              variant="outline"
              onClick={handleExport}
              className="rounded-xl h-9 px-3 text-sm gap-1.5"
            >
              <Download size={14} /> Exportar
            </Button>
            <Button
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm font-medium gap-1.5"
            >
              <Plus size={15} /> Nuevo activo
            </Button>
          </div>
        }
      />

      {/* Filters bar */}
      <SectionWrapper>
        <Card className="border-slate-100 rounded-2xl mb-4">
          <CardContent className="p-3 flex flex-wrap gap-3 items-center">
            <SearchBar
              id="search-assets"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar por nombre, código, marca, QR..."
              className="w-72"
            />

            <button
              onClick={() => {
                setQrSearchDialog(true);
                setQrSearchCode('');
                setQrSearchError(null);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium"
              title="Buscar por código QR"
            >
              <ScanBarcode size={15} />
              <span className="hidden sm:inline">QR</span>
            </button>

            <select
              id="filter-status"
              name="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">Todos los estados</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {ASSET_STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            <select
              id="filter-category"
              name="category"
              value={catFilter}
              onChange={(e) => {
                setCatFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">Todas las categorías</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded-lg transition-colors ${view === 'table' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              {meta.total} resultado{meta.total !== 1 ? 's' : ''}
            </span>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Content */}
      <SectionWrapper delay={100}>
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay activos"
            subtitle="Crea el primer activo con el botón de arriba"
          />
        ) : view === 'table' ? (
          <Card className="border-slate-100 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
                  <TableHead className="hidden md:table-cell">Marca / Modelo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>{' '}
              <TableBody>
                {filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    onClick={() => router.push(`/dashboard/assets/${a.id}`)}
                    className="cursor-pointer hover:bg-blue-50/20 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-slate-500">{a.code}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/assets/${a.id}`}
                        className="font-medium text-slate-800 hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                      {a.category?.name}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                      {a.location?.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                      {[a.brand, a.model].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showQR(a);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Ver QR"
                        >
                          <QrCode size={15} />
                        </button>
                        <Link
                          href={`/dashboard/assets/${a.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(a);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(a);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((a) => (
              <Card
                key={a.id}
                className="border-slate-100 rounded-2xl hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Package size={18} className="text-blue-500" />
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <Link href={`/dashboard/assets/${a.id}`}>
                    <h3 className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-sm leading-snug">
                      {a.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{a.code}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{a.category?.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => showQR(a)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                      >
                        <QrCode size={13} />
                      </button>
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SectionWrapper>

      {/* Paginación */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar activo' : 'Nuevo activo'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Row 1 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => f('name', e.target.value)}
                placeholder="Ej. Laptop Dell XPS 15"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Código *</Label>
              <div className="relative">
                <Input
                  value={form.code}
                  onChange={(e) => {
                    f('code', e.target.value);
                    checkCodeDebounced(e.target.value, editing?.code);
                  }}
                  placeholder="Ej. TEC-001"
                  className={`h-9 rounded-xl text-sm pr-9 ${
                    codeStatus.state === 'available'
                      ? 'border-emerald-400 focus:ring-emerald-400/20 focus:border-emerald-400'
                      : codeStatus.state === 'taken'
                        ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                        : ''
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {codeStatus.state === 'checking' && (
                    <Loader2 size={15} className="animate-spin text-slate-400" />
                  )}
                  {codeStatus.state === 'available' && (
                    <CheckCircle size={15} className="text-emerald-500" />
                  )}
                  {codeStatus.state === 'taken' && (
                    <XCircle size={15} className="text-red-500" />
                  )}
                </div>
              </div>
              {codeStatus.state === 'taken' && codeStatus.message && (
                <p className="text-[10px] text-red-500 mt-0.5">{codeStatus.message}</p>
              )}
              {codeStatus.state === 'available' && (
                <p className="text-[10px] text-emerald-600 mt-0.5">Código disponible</p>
              )}
            </div>

            {/* Row 2: Category + Subcategory */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Categoría *</Label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  f('categoryId', e.target.value);
                  f('subcategoryId', '');
                  setAttrValues({});
                }}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccionar...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Subcategoría</Label>
              <select
                value={form.subcategoryId}
                onChange={(e) => f('subcategoryId', e.target.value)}
                disabled={!form.categoryId || subcategories.length === 0}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              >
                <option value="">Sin subcategoría</option>
                {subcategories.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Location + Supplier */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Ubicación *</Label>
              <select
                value={form.locationId}
                onChange={(e) => f('locationId', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccionar...</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Proveedor</Label>
              <select
                value={form.supplierId}
                onChange={(e) => f('supplierId', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 4: Brand + Model */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Marca</Label>
              <Input
                value={form.brand}
                onChange={(e) => f('brand', e.target.value)}
                placeholder="Ej. Dell"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Modelo</Label>
              <Input
                value={form.model}
                onChange={(e) => f('model', e.target.value)}
                placeholder="Ej. XPS 15 9500"
                className="h-9 rounded-xl text-sm"
              />
            </div>

            {/* Row 5: Serial + Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Número de serie</Label>
              <Input
                value={form.serialNumber}
                onChange={(e) => f('serialNumber', e.target.value)}
                placeholder="Ej. SN123456"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Estado</Label>
              <select
                value={form.status}
                onChange={(e) => f('status', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {ASSET_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 6: Dates */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Fecha de adquisición</Label>
              <Input
                type="date"
                value={form.acquisitionDate}
                onChange={(e) => f('acquisitionDate', e.target.value)}
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                Costo de adquisición (COP)
              </Label>
              <Input
                type="number"
                value={form.acquisitionCost}
                onChange={(e) => f('acquisitionCost', e.target.value)}
                placeholder="0.00"
                className="h-9 rounded-xl text-sm"
              />
            </div>

            {/* Row 7: Warranty + lifecycle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                Vencimiento de garantía
              </Label>
              <Input
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) => f('warrantyExpiry', e.target.value)}
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                Vida útil esperada (meses)
              </Label>
              <Input
                type="number"
                value={form.expectedLifeCycle}
                onChange={(e) => f('expectedLifeCycle', e.target.value)}
                placeholder="60"
                className="h-9 rounded-xl text-sm"
              />
            </div>

            {/* Description + Notes */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => f('description', e.target.value)}
                placeholder="Descripción general del activo..."
                className="text-sm rounded-xl"
                rows={2}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Notas internas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => f('notes', e.target.value)}
                placeholder="Observaciones, instrucciones especiales..."
                className="text-sm rounded-xl"
                rows={2}
              />
            </div>

            {/* ── Dynamic category attributes ── */}
            {catAttributes.length > 0 && (
              <div className="col-span-2">
                <div className="border-t border-slate-100 pt-4 mb-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Atributos de {selectedCat?.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {catAttributes.map((attr: any) => (
                    <div key={attr.id} className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">
                        {attr.name}
                        {attr.required && ' *'}
                        {attr.unit && ` (${attr.unit})`}
                      </Label>
                      {attr.type === 'SELECT' && attr.options ? (
                        <select
                          value={attrValues[attr.id] || ''}
                          onChange={(e) =>
                            setAttrValues((p) => ({ ...p, [attr.id]: e.target.value }))
                          }
                          className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">Seleccionar...</option>
                          {JSON.parse(attr.options).map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : attr.type === 'CHECKBOX' ? (
                        <div className="flex items-center gap-2 h-9">
                          <input
                            type="checkbox"
                            checked={attrValues[attr.id] === 'true'}
                            onChange={(e) =>
                              setAttrValues((p) => ({
                                ...p,
                                [attr.id]: e.target.checked ? 'true' : 'false',
                              }))
                            }
                            className="rounded w-4 h-4 accent-blue-600"
                          />
                          <span className="text-sm text-slate-600">Sí</span>
                        </div>
                      ) : attr.type === 'TEXTAREA' ? (
                        <Textarea
                          value={attrValues[attr.id] || ''}
                          onChange={(e) =>
                            setAttrValues((p) => ({ ...p, [attr.id]: e.target.value }))
                          }
                          className="text-sm rounded-xl"
                          rows={2}
                        />
                      ) : (
                        <Input
                          type={
                            attr.type === 'NUMBER'
                              ? 'number'
                              : attr.type === 'DATE'
                                ? 'date'
                                : 'text'
                          }
                          value={attrValues[attr.id] || ''}
                          onChange={(e) =>
                            setAttrValues((p) => ({ ...p, [attr.id]: e.target.value }))
                          }
                          placeholder={attr.placeholder || ''}
                          className="h-9 rounded-xl text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear activo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar activo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Estás a punto de eliminar <strong>{deleteConfirm?.name}</strong>. Esta acción no se
            puede deshacer y eliminará todo el historial asociado.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 text-sm"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={qrDialog.open} onOpenChange={(o) => setQrDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-base">Código QR</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 -mt-1">{qrDialog.name}</p>
          {qrDialog.url && <img src={qrDialog.url} alt="QR" className="mx-auto rounded-xl mt-1" />}
          <Button
            onClick={() => {
              const a = document.createElement('a');
              a.href = qrDialog.url;
              a.download = `qr-${qrDialog.name}.png`;
              a.click();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm mt-1"
          >
            <Download size={14} className="mr-2" /> Descargar PNG
          </Button>
        </DialogContent>
      </Dialog>

      {/* QR Search Dialog */}
      <Dialog
        open={qrSearchDialog}
        onOpenChange={(o) => {
          setQrSearchDialog(o);
          if (!o) {
            setQrSearchError(null);
            stopQrScanner();
          }
        }}
      >
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-base">Buscar por código QR</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 -mt-1 mb-4">
            Ingresa el código QR del activo (ej: TECMAN-xxxx) o escanea con tu cámara
          </p>

          {/* Manual input */}
          <div className="flex gap-2 mb-3">
            <Input
              value={qrSearchCode}
              onChange={(e) => setQrSearchCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQrSearchDialog();
              }}
              placeholder="Código QR o TECMAN-..."
              className="flex-1 h-10 rounded-xl text-sm font-mono"
              autoFocus
            />
            <Button
              onClick={handleQrSearchDialog}
              disabled={!qrSearchCode.trim() || qrSearchLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-sm shrink-0"
            >
              {qrSearchLoading ? <Loader2 className="animate-spin" size={15} /> : 'Buscar'}
            </Button>
          </div>

          {qrSearchError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-left">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">{qrSearchError}</p>
            </div>
          )}

          {/* Scanner en vivo */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            {!qrScannerActive ? (
              <>
                <p className="text-xs text-slate-400 mb-3">
                  Usa la cámara para escanear el código QR automáticamente
                </p>
                <Button
                  onClick={startQrScanner}
                  className="w-full rounded-xl h-10 text-sm gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Camera size={15} />
                  Activar escáner en vivo
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <div
                  id="qr-live-scanner"
                  ref={scannerContainerRef}
                  className="w-full aspect-square max-h-[240px] mx-auto rounded-xl overflow-hidden bg-slate-900"
                />
                <p className="text-xs text-emerald-600 font-medium animate-pulse">
                  Escaneando... apunta la cámara al código QR
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopQrScanner}
                  className="rounded-xl h-8 text-xs"
                >
                  Detener escáner
                </Button>
              </div>
            )}

            {qrScannerError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-left mt-2">
                <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">{qrScannerError}</p>
              </div>
            )}

            {!qrScannerActive && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQrSearchDialog(false);
                    router.push('/activo');
                  }}
                  className="w-full rounded-xl h-8 text-xs gap-1.5 text-slate-500"
                >
                  <ScanBarcode size={13} />
                  Ir al escáner completo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
