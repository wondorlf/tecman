'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Loader2,
  Package,
  MapPin,
  Tag,
  Calendar,
  Hash,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Ticket,
  FileText,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  BookOpen,
  Video,
  Camera,
  Image,
  Search,
  X,
  Download,
} from 'lucide-react';
import { PublicLayout } from '@/components/shared/PublicLayout';
import { useToast } from '@/components/ui/use-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE: {
    label: 'Activo',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  MAINTENANCE: {
    label: 'Mantenimiento',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
  },
  INACTIVE: {
    label: 'Inactivo',
    color: 'text-slate-600',
    bg: 'bg-slate-100 border-slate-200',
    dot: 'bg-slate-400',
  },
  DISPOSED: {
    label: 'Dado de baja',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
  },
  RESERVED: {
    label: 'Reservado',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
  },
};

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function AssetViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrCode = searchParams?.get('qr') || searchParams?.get('code') || null;

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [branding, setBranding] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any>(null);
  const [showAnexosModal, setShowAnexosModal] = useState(false);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    axios
      .get('/api/tenants/public')
      .then((r) => setBranding(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (qrCode) lookupAsset(qrCode);
  }, [qrCode]);

  // Limpiar escáner al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const lookupAsset = async (code: string) => {
    setLoading(true);
    setError(null);
    setScanning(false);
    setAsset(null);
    try {
      const res = await axios.get(`/api/assets/qr/${encodeURIComponent(code)}`);
      setAsset(res.data);
      toast({
        title: '✅ QR detectado',
        description: `Activo encontrado: ${res.data.name}`,
      });
    } catch {
      setError('No se encontró ningún activo con este código QR.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) lookupAsset(manualCode.trim());
  };

  // ── Escáner QR en vivo ──────────────────────────────────────────────────────
  const startLiveScan = async () => {
    setError(null);
    setScannerReady(false);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-live-scanner-inline');
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          playBeep();
          scanner.stop().catch(() => {});
          setScanning(false);
          setScannerReady(false);
          lookupAsset(decodedText);
        },
        () => {},
      );

      setScanning(true);
      setScannerReady(true);
    } catch {
      setError('No se pudo acceder a la cámara. Usa la búsqueda manual.');
      setScanning(false);
    }
  };

  const stopLiveScan = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setScannerReady(false);
  };

  // ── Foto desde cámara nativa ──────────────────────────────────────────────
  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessingPhoto(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-file-scanner-dummy');
      const decodedText = await scanner.scanFile(file, false);
      playBeep();
      e.target.value = '';
      toast({
        title: '📸 QR leído',
        description: `Código: ${decodedText}`,
      });
      lookupAsset(decodedText);
    } catch {
      setError('No se pudo leer un código QR en la foto. Asegúrate de que el QR esté bien visible e iluminado.');
      e.target.value = '';
    } finally {
      setProcessingPhoto(false);
    }
  };

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
    } catch {}
  };

  const status = asset
    ? STATUS_CONFIG[asset.status] || {
        label: asset.status,
        color: 'text-slate-600',
        bg: 'bg-slate-100 border-slate-200',
        dot: 'bg-slate-400',
      }
    : null;

  const DOC_CATEGORIES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    MANUAL: { label: 'Manuales', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    TECHNICAL_SHEET: { label: 'Fichas Técnicas', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    WARRANTY: { label: 'Garantía', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    MAINTENANCE: { label: 'Mantenimiento', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    TUTORIAL: { label: 'Tutoriales', icon: Monitor, color: 'text-violet-600', bg: 'bg-violet-50' },
    IMAGE: { label: 'Imágenes', icon: Image, color: 'text-amber-600', bg: 'bg-amber-50' },
    VIDEO: { label: 'Videos', icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
    CERTIFICATE: { label: 'Certificados', icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    OTHER: { label: 'Otros', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
  };
  const groupedDocs = asset?.documents?.reduce((acc: Record<string, any[]>, doc: any) => {
    const cat = doc.type || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {}) || {};
  const activeDocCats = Object.keys(groupedDocs).filter((k) => DOC_CATEGORIES[k]);

  return (
    <PublicLayout showBack backLabel="Inicio" maxWidth="max-w-2xl">
      <div className="pt-6 sm:pt-12 pb-6 w-full max-w-full">
        {/* Title section */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-violet-600 rounded-2xl sm:rounded-3xl shadow-lg shadow-violet-200 mb-4 sm:mb-5">
            <QrCode className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight px-2">Consultar Activo</h1>
          <p className="text-slate-500 mt-1.5 sm:mt-2 text-sm sm:text-base px-4">
            Escanea el código QR del equipo o ingresa el código manualmente
          </p>
        </div>        {/* Manual search + QR Scanner */}
        {!asset && !scanning && (
          <form onSubmit={handleManualSearch} className="mx-auto max-w-xl mb-6 sm:mb-8 space-y-2.5 sm:space-y-3">
            {/* Row 1: input + search button */}
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input
                  id="qr-search-input"
                  type="text"
                  placeholder="Código, QR o serie"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 pl-9 sm:pl-10 pr-4 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all text-xs sm:text-sm"
                />
              </div>
              <button
                id="qr-search-btn"
                type="submit"
                disabled={loading}
                className="h-11 sm:h-12 w-11 sm:w-auto sm:px-6 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl sm:rounded-2xl transition-colors text-sm shadow-lg shadow-violet-200 disabled:opacity-60"
              >
                <Search size={18} className="sm:hidden" />
                <span className="hidden sm:inline">{loading ? <Loader2 className="animate-spin" size={16} /> : 'Buscar'}</span>
              </button>
            </div>
            {/* Row 2: camera + photo buttons */}
            <div className="flex gap-2 sm:gap-3">
              <button
                id="qr-scan-btn"
                type="button"
                onClick={startLiveScan}
                disabled={loading || processingPhoto}
                className="flex-1 sm:flex-none h-11 sm:h-12 sm:px-4 inline-flex items-center justify-center gap-2 bg-violet-100 border border-violet-300 hover:bg-violet-200 hover:border-violet-400 text-violet-700 font-semibold rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 text-xs sm:text-sm"
                title="Escáner en vivo (cámara)"
              >
                <Camera size={16} />
                <span className="sm:hidden">Cámara</span>
                <span className="hidden sm:inline">Cámara</span>
              </button>
              <button
                id="qr-photo-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || processingPhoto}
                className="flex-1 sm:flex-none h-11 sm:h-12 sm:px-4 inline-flex items-center justify-center gap-2 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400 text-emerald-700 font-semibold rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 text-xs sm:text-sm"
                title="Tomar foto del código QR"
              >
                {processingPhoto ? <Loader2 className="animate-spin" size={16} /> : <Image size={16} />}
                <span className="sm:hidden">Foto</span>
                <span className="hidden sm:inline">Foto</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Cámara en vivo o{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-600 font-semibold hover:text-emerald-700 underline underline-offset-2"
              >
                toma una foto del QR
              </button>
            </p>
          </form>
        )}

        {/* Input file oculto para cámara nativa */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileCapture}
        />
        <div id="qr-file-scanner-dummy" className="hidden" />

        {/* Scanner inline en vivo */}
        {!asset && scanning && (
          <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            <div
              id="qr-live-scanner-inline"
              className="w-full aspect-square max-h-[260px] sm:max-h-[350px] mx-auto rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 border-2 border-violet-300"
            />
            <p className="text-xs text-center text-emerald-600 font-medium animate-pulse px-2">
              {scannerReady ? 'Escaneando... apunta la cámara al código QR del activo' : 'Iniciando cámara...'}
            </p>
            <button
              onClick={stopLiveScan}
              className="mx-auto flex items-center gap-2 h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <X size={14} className="sm:size-4" />
              Detener escáner
            </button>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-red-700 font-semibold text-sm sm:text-base">Error de cámara</p>
                  <p className="text-red-500 text-xs sm:text-sm mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3 sm:gap-4">
            <Loader2 className="animate-spin text-violet-500" size={28} />
            <p className="text-slate-500 text-xs sm:text-sm">Buscando activo...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4 mb-6">
            <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
            <div className="min-w-0">
              <p className="text-red-700 font-semibold text-sm sm:text-base">Activo no encontrado</p>
              <p className="text-red-500 text-xs sm:text-sm mt-0.5 break-words">{error}</p>
            </div>
          </div>
        )}

        {/* Asset card */}
        {asset && status && (
          <div className="mx-auto max-w-xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.07)] animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            {/* Card header */}
            <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-violet-50 border border-violet-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Package className="text-violet-500" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border ${status.bg} ${status.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 mt-1.5 sm:mt-2 leading-tight break-words">
                    {asset.name}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-mono truncate">{asset.code}</p>
                </div>
              </div>
              {asset.description && (
                <p className="text-slate-500 text-xs sm:text-sm mt-3 sm:mt-4 leading-relaxed">{asset.description}</p>
              )}
            </div>

            {/* Details grid */}
            <div className="px-5 sm:px-7 py-5 sm:py-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {[
                { icon: Tag, label: 'Categoría', value: asset.category?.name },
                { icon: Tag, label: 'Subcategoría', value: asset.subcategory?.name },
                {
                  icon: MapPin,
                  label: 'Ubicación',
                  value: [asset.location?.name, asset.location?.floor, asset.location?.room]
                    .filter(Boolean)
                    .join(' · '),
                },
                {
                  icon: Hash,
                  label: 'Marca / Modelo',
                  value: [asset.brand, asset.model].filter(Boolean).join(' · '),
                },
                { icon: Hash, label: 'Número de serie', value: asset.serialNumber },
                {
                  icon: Calendar,
                  label: 'Fecha adquisición',
                  value: fmtDate(asset.acquisitionDate),
                },
                { icon: Calendar, label: 'Garantía hasta', value: fmtDate(asset.warrantyExpiry) },
                asset.supplier && { icon: Hash, label: 'Proveedor', value: asset.supplier?.name },
              ]
                .filter(Boolean)
                .map((item: any, i) =>
                  item.value ? (
                    <div key={i} className="flex gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="text-slate-400" size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.label}
                        </p>
                        <p className="text-slate-700 text-xs sm:text-sm font-medium mt-0.5 break-words">{item.value}</p>
                      </div>
                    </div>
                  ) : null,
                )}
            </div>

            {/* Custom attributes */}
            {asset.attributeValues && asset.attributeValues.length > 0 && (
              <div className="px-5 sm:px-7 pb-5 sm:pb-7">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Características técnicas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {asset.attributeValues.map((av: any) => (
                    <div
                      key={av.id}
                      className="bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"
                    >
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {av.attribute?.name}
                      </p>
                      <p className="text-slate-700 text-xs sm:text-sm font-medium mt-0.5">
                        {av.value} {av.attribute?.unit || ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos categorizados */}
            {activeDocCats.length > 0 && (
              <div className="px-5 sm:px-7 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
                {/* Primary categories: Manual and Ficha Técnica - as independent buttons */}
                {['MANUAL', 'TECHNICAL_SHEET'].filter(k => activeDocCats.includes(k)).map((catKey) => {
                  const cat = DOC_CATEGORIES[catKey];
                  const Icon = cat.icon;
                  return (
                    <div key={catKey}>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Icon size={11} className={cat.color} />
                        {cat.label} ({groupedDocs[catKey].length})
                      </p>
                      <div className="space-y-1.5">
                        {groupedDocs[catKey].map((doc: any) => (
                          <button
                            key={doc.id}
                            onClick={() => setViewerDoc(doc)}
                            className={`w-full text-left flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${cat.bg}/50 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group`}
                          >
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                              <Icon size={12} className={cat.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                {doc.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400">
                                {doc.mimeType?.split('/')[1]?.toUpperCase() || doc.type}
                                {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ''}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Anexos button - opens modal with all categories */}
                {activeDocCats.length > 0 && (
                  <button
                    onClick={() => setShowAnexosModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 transition-all"
                  >
                    <FileText size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-600">Anexos ({asset.documents?.length || 0})</span>
                  </button>
                )}
              </div>
            )}

            {/* Anexos Modal */}
            {showAnexosModal && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAnexosModal(false)}>
                <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <h3 className="text-base font-bold text-slate-900">Anexos del Activo</h3>
                    <button onClick={() => setShowAnexosModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {activeDocCats.map((catKey) => {
                      const cat = DOC_CATEGORIES[catKey];
                      const Icon = cat.icon;
                      return (
                        <div key={catKey}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Icon size={11} className={cat.color} />
                            {cat.label} ({groupedDocs[catKey].length})
                          </p>
                          <div className="space-y-1.5">
                            {groupedDocs[catKey].map((doc: any) => (
                              <button
                                key={doc.id}
                                onClick={() => {
                                  setViewerDoc(doc);
                                  setShowAnexosModal(false);
                                }}
                                className={`w-full text-left flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${cat.bg}/50 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group`}
                              >
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                                  <Icon size={12} className={cat.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-slate-400">
                                    {doc.mimeType?.split('/')[1]?.toUpperCase() || doc.type}
                                    {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ''}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Hardware changes from Discovery */}
            {asset.discoveredDevice?.changes?.length > 0 && (
              <div className="px-5 sm:px-7 pb-3 sm:pb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 sm:mb-3 flex items-center gap-1.5">
                  <Activity size={11} />
                  Cambios de Hardware Detectados
                </p>
                <div className="space-y-1.5 sm:space-y-2">
                  {asset.discoveredDevice.changes.map((ch: any) => (
                    <div
                      key={ch.id}
                      className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-amber-50/50 border border-amber-100"
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Cpu size={11} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs font-semibold text-amber-800">
                          {ch.component === 'RAM'
                            ? 'Memoria RAM'
                            : ch.component === 'DISK'
                              ? 'Almacenamiento'
                              : ch.component === 'CPU'
                                ? 'Procesador'
                                : ch.component}
                        </p>
                        <p className="text-[11px] sm:text-xs text-amber-600 mt-0.5">
                          {ch.oldValue || '?'} → {ch.newValue || '?'}
                        </p>
                        <p className="text-[10px] text-amber-400 mt-0.5">
                          {new Date(ch.detectedAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions: ticket / mantenimiento */}
            <div className="px-5 sm:px-7 pb-5 sm:pb-7 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() =>
                  router.push(
                    `/soporte?assetCode=${encodeURIComponent(asset.code || asset.qrCode || '')}`,
                  )
                }
                className="flex-1 inline-flex items-center justify-center gap-2 h-9 sm:h-10 rounded-lg sm:rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 min-w-0"
              >
                <Ticket size={14} className="shrink-0" />
                <span className="truncate">Reportar problema</span>
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/soporte?assetCode=${encodeURIComponent(asset.code || asset.qrCode || '')}`,
                  )
                }
                className="flex-1 inline-flex items-center justify-center gap-2 h-9 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 min-w-0"
              >
                <Wrench size={14} className="shrink-0" />
                <span className="truncate">Solicitar mantenimiento</span>
              </button>
            </div>

            {/* Discovery info */}
            {asset.discoveredDevice && (
              <div className="px-5 sm:px-7 pb-3 sm:pb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 sm:mb-3 flex items-center gap-1.5">
                  <Monitor size={11} />
                  Información del Sistema
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {asset.discoveredDevice.os && (
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2">
                      <p className="text-[10px] text-slate-400">Sistema Operativo</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                        {asset.discoveredDevice.os}
                      </p>
                    </div>
                  )}
                  {asset.discoveredDevice.cpuModel && (
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2">
                      <p className="text-[10px] text-slate-400">Procesador</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                        {asset.discoveredDevice.cpuModel}
                        {asset.discoveredDevice.cpuCores
                          ? ` (${asset.discoveredDevice.cpuCores} cores)`
                          : ''}
                      </p>
                    </div>
                  )}
                  {asset.discoveredDevice.ramTotalBytes && (
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2">
                      <p className="text-[10px] text-slate-400">RAM</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                        {(Number(asset.discoveredDevice.ramTotalBytes) / 1024 ** 3).toFixed(1)} GB
                      </p>
                    </div>
                  )}
                  {asset.discoveredDevice.diskTotalBytes && (
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2">
                      <p className="text-[10px] text-slate-400">Disco</p>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-700">
                        {(Number(asset.discoveredDevice.diskTotalBytes) / 1024 ** 3).toFixed(1)} GB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer action */}
            <div className="px-5 sm:px-7 py-3 sm:py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-[10px] sm:text-xs text-slate-400">Powered by EGAN-TECH</p>
              <button
                id="qr-search-again"
                onClick={() => {
                  setAsset(null);
                  setManualCode('');
                }}
                className="text-[10px] sm:text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors shrink-0"
              >
                Buscar otro activo →
              </button>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {viewerDoc && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-6"
            onClick={() => setViewerDoc(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Viewer header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{viewerDoc.name}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {(viewerDoc.size / 1024).toFixed(0)} KB · {viewerDoc.mimeType}
                  </p>
                </div>
                <button
                  onClick={() => setViewerDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Viewer body */}
              <div className="flex-1 overflow-auto p-2 sm:p-4 bg-slate-100/50 min-h-[200px] max-h-[70vh]">
                {viewerDoc.mimeType?.startsWith('image/') ? (
                  <img
                    src={`/api/storage/public/${viewerDoc.filename}`}
                    alt={viewerDoc.name}
                    className="max-w-full max-h-full mx-auto object-contain rounded-xl"
                  />
                ) : viewerDoc.mimeType?.startsWith('video/') ? (
                  <video
                    controls
                    className="max-w-full max-h-full mx-auto rounded-xl"
                  >
                    <source
                      src={`/api/storage/public/${viewerDoc.filename}`}
                      type={viewerDoc.mimeType}
                    />
                  </video>
                ) : viewerDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={`/api/storage/public/${viewerDoc.filename}#view=FitH`}
                    className="w-full h-[70vh] rounded-xl bg-white"
                    title={viewerDoc.name}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <FileText size={48} className="mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Vista previa no disponible</p>
                    <p className="text-xs mt-1">Este tipo de archivo no se puede previsualizar en línea</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export default function AssetPublicPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="animate-spin text-violet-500" size={32} />
        </div>
      }
    >
      <AssetViewContent />
    </Suspense>
  );
}
