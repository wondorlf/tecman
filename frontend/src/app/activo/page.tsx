'use client';

import { useState, useEffect, Suspense } from 'react';
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
} from 'lucide-react';
import { PublicLayout } from '@/components/shared/PublicLayout';

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

  useEffect(() => {
    axios
      .get('/api/tenants/public')
      .then((r) => setBranding(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (qrCode) lookupAsset(qrCode);
  }, [qrCode]);

  const lookupAsset = async (code: string) => {
    setLoading(true);
    setError(null);
    setAsset(null);
    try {
      const res = await axios.get(`/api/assets/qr/${encodeURIComponent(code)}`);
      setAsset(res.data);
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
    TUTORIAL: { label: 'Tutoriales', icon: Monitor, color: 'text-violet-600', bg: 'bg-violet-50' },
    IMAGE: { label: 'Imágenes', icon: QrCode, color: 'text-amber-600', bg: 'bg-amber-50' },
    VIDEO: { label: 'Videos', icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
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
      <div className="pt-12 pb-6">
        {/* Title section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-3xl shadow-lg shadow-violet-200 mb-5">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Consultar Activo</h1>
          <p className="text-slate-500 mt-2">
            Escanea el código QR del equipo o ingresa el código manualmente
          </p>
        </div>

        {/* Manual search */}
        {!asset && (
          <form onSubmit={handleManualSearch} className="mb-8">
            <div className="flex gap-3">
              <input
                id="qr-search-input"
                type="text"
                placeholder="Código, QR o número de serie (ej: TECMAN-xxxx, TEC-001, SN12345)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 px-4 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all text-sm font-mono"
              />
              <button
                id="qr-search-btn"
                type="submit"
                disabled={loading}
                className="h-12 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-colors text-sm shadow-lg shadow-violet-200 disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Buscar'}
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-violet-500" size={36} />
            <p className="text-slate-500 text-sm">Buscando activo...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 mb-6">
            <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-red-700 font-semibold">Activo no encontrado</p>
              <p className="text-red-500 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Asset card */}
        {asset && status && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.07)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Card header */}
            <div className="px-7 pt-7 pb-5 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Package className="text-violet-500" size={24} />
                </div>
                <div className="flex-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${status.bg} ${status.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2 leading-tight">
                    {asset.name}
                  </h2>
                  <p className="text-slate-400 text-sm mt-0.5 font-mono">{asset.code}</p>
                </div>
              </div>
              {asset.description && (
                <p className="text-slate-500 text-sm mt-4 leading-relaxed">{asset.description}</p>
              )}
            </div>

            {/* Details grid */}
            <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="text-slate-400" size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.label}
                        </p>
                        <p className="text-slate-700 text-sm font-medium mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ) : null,
                )}
            </div>

            {/* Custom attributes */}
            {asset.attributeValues && asset.attributeValues.length > 0 && (
              <div className="px-7 pb-7">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Características técnicas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {asset.attributeValues.map((av: any) => (
                    <div
                      key={av.id}
                      className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                    >
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {av.attribute?.name}
                      </p>
                      <p className="text-slate-700 text-sm font-medium mt-0.5">
                        {av.value} {av.attribute?.unit || ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos categorizados */}
            {activeDocCats.length > 0 && (
              <div className="px-7 pb-4 space-y-4">
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
                          <a
                            key={doc.id}
                            href={`/api/storage/public/${doc.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-xl ${cat.bg}/50 border border-slate-100 hover:border-blue-200 transition-all group`}
                          >
                            <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                              <Icon size={14} className={cat.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                                {doc.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {doc.mimeType?.split('/')[1]?.toUpperCase() || doc.type}
                                {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ''}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hardware changes from Discovery */}
            {asset.discoveredDevice?.changes?.length > 0 && (
              <div className="px-7 pb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Activity size={11} />
                  Cambios de Hardware Detectados
                </p>
                <div className="space-y-2">
                  {asset.discoveredDevice.changes.map((ch: any) => (
                    <div
                      key={ch.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Cpu size={12} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-800">
                          {ch.component === 'RAM'
                            ? 'Memoria RAM'
                            : ch.component === 'DISK'
                              ? 'Almacenamiento'
                              : ch.component === 'CPU'
                                ? 'Procesador'
                                : ch.component}
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
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
            <div className="px-7 pb-7 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() =>
                  router.push(
                    `/soporte?assetCode=${encodeURIComponent(asset.code || asset.qrCode || '')}`,
                  )
                }
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                <Ticket size={15} />
                Reportar problema
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/soporte?assetCode=${encodeURIComponent(asset.code || asset.qrCode || '')}`,
                  )
                }
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                <Wrench size={15} />
                Solicitar mantenimiento
              </button>
            </div>

            {/* Discovery info */}
            {asset.discoveredDevice && (
              <div className="px-7 pb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Monitor size={11} />
                  Información del Sistema
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {asset.discoveredDevice.os && (
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400">Sistema Operativo</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {asset.discoveredDevice.os}
                      </p>
                    </div>
                  )}
                  {asset.discoveredDevice.cpuModel && (
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400">Procesador</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {asset.discoveredDevice.cpuModel}
                        {asset.discoveredDevice.cpuCores
                          ? ` (${asset.discoveredDevice.cpuCores} cores)`
                          : ''}
                      </p>
                    </div>
                  )}
                  {asset.discoveredDevice.ramTotalBytes && (
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400">RAM</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {(Number(asset.discoveredDevice.ramTotalBytes) / 1024 ** 3).toFixed(1)} GB
                      </p>
                    </div>
                  )}
                  {asset.discoveredDevice.diskTotalBytes && (
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-slate-400">Disco</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {(Number(asset.discoveredDevice.diskTotalBytes) / 1024 ** 3).toFixed(1)} GB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer action */}
            <div className="px-7 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-400">Powered by EGAN-TECH</p>
              <button
                id="qr-search-again"
                onClick={() => {
                  setAsset(null);
                  setManualCode('');
                }}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Buscar otro activo →
              </button>
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
