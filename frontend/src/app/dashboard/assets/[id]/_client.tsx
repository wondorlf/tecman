'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { assetsApi, categoriesApi, locationsApi, suppliersApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  QrCode,
  TrendingDown,
  History,
  Wrench,
  Ticket,
  Download,
  FileDown,
  Monitor,
  Link2,
  Globe,
  Plus,
  Edit,
  Save,
  X,
  MapPin,
  Building2,
  Truck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getAccessToken } from '@/lib/api';
import { MAINTENANCE_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '@/lib/types';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

const EVENT_COLORS: Record<string, string> = {
  CREATED: 'bg-blue-50 text-blue-600',
  MAINTENANCE: 'bg-amber-50 text-amber-600',
  FAILURE: 'bg-red-50 text-red-600',
  STATUS_CHANGE: 'bg-purple-50 text-purple-600',
  DOCUMENT_ADDED: 'bg-emerald-50 text-emerald-600',
  AUDIT: 'bg-slate-50 text-slate-500',
  LOCATION_CHANGE: 'bg-teal-50 text-teal-600',
  CUSTOM: 'bg-slate-50 text-slate-500',
};

export default function AssetDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>('OTHER');
  const [uploadPublic, setUploadPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: asset, isLoading, refetch } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => (await assetsApi.history(id!)).data,
    enabled: !!id,
  });

  const { data: depr } = useQuery({
    queryKey: ['asset-depr', id],
    queryFn: async () => (await assetsApi.depreciation(id!)).data,
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-edit'],
    queryFn: async () => {
      const r = await categoriesApi.list();
      return r.data as any[];
    },
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-edit'],
    queryFn: async () => {
      const r = await locationsApi.list();
      return r.data as any[];
    },
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-edit'],
    queryFn: async () => {
      const r = await suppliersApi.list();
      return r.data as any[];
    },
  });

  useEffect(() => {
    if (asset?.qrCode) {
      QRCode.toDataURL(asset.qrCode, { width: 200, margin: 2 })
        .then(setQrUrl)
        .catch(() => {});
    }
  }, [asset]);

  if (isLoading) return <LoadingSpinner />;
  if (!asset)
    return (
      <div className="flex items-center gap-3 p-8 text-slate-500 text-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        Activo no encontrado.
      </div>
    );

  const events = asset.hojaVida?.events || [];
  const maintenances = asset.maintenances || [];
  const tickets = asset.tickets || [];
  const documents = asset.documents || [];
  const discoveredDevice = asset.discoveredDevice;

  return (
    <div className="max-w-6xl">
      {/* Discovery Linked Banner */}
      {discoveredDevice && (
        <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={16} className="text-indigo-500" />
            <span className="text-sm font-semibold text-indigo-800">
              Vinculado a Discovery de red
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              key={discoveredDevice.id}
              href={`/dashboard/discovery?search=${encodeURIComponent(discoveredDevice.hostname)}`}
              className="inline-flex items-center gap-2 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              <Monitor size={13} className="text-indigo-400" />
              <span className="font-medium">{discoveredDevice.hostname}</span>
              <span className="text-indigo-400">|</span>
              <span className="text-indigo-500">{discoveredDevice.ipAddress || '—'}</span>
              <Globe size={11} className="text-indigo-300 ml-1" />
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{asset.name}</h1>
            <StatusBadge status={asset.status} />
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
              {asset.code}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {asset.category?.name}
            {asset.subcategory ? ` › ${asset.subcategory.name}` : ''}
          </p>
        </div>
        {qrUrl && (
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = qrUrl;
              a.download = `qr-${asset.code}.png`;
              a.click();
            }}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm text-slate-600 transition-colors"
          >
            <QrCode size={15} /> QR
          </button>
        )}
        <button
          onClick={() => {
            setEditForm({
              name: asset.name || '',
              brand: asset.brand || '',
              model: asset.model || '',
              serialNumber: asset.serialNumber || '',
              description: asset.description || '',
              notes: asset.notes || '',
              status: asset.status || 'ACTIVE',
              categoryId: asset.categoryId || '',
              locationId: asset.locationId || '',
              supplierId: asset.supplier?.id || '',
              subcategoryId: asset.subcategory?.id || '',
              acquisitionDate: asset.acquisitionDate ? asset.acquisitionDate.split('T')[0] : '',
              acquisitionCost: asset.acquisitionCost || '',
              warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
            });
            setEditing(true);
          }}
          className="flex items-center gap-2 px-3 py-2 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 text-sm text-blue-700 font-semibold transition-colors"
        >
          <Edit size={15} /> Editar
        </button>
        <button
          onClick={() => {
            const token = getAccessToken();
            fetch(`/api/assets/${id}/hoja-vida-pdf`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((res) => {
                if (!res.ok) throw new Error('Error al descargar');
                return res.blob();
              })
              .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hoja-vida-${asset.code}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
              })
              .catch(() => {
                // Silently fail - the user can try again
              });
          }}
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-emerald-50 text-sm text-emerald-600 transition-colors"
        >
          <FileDown size={15} /> Hoja de Vida PDF
        </button>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <a
          href={`/dashboard/tickets?assetCode=${encodeURIComponent(asset.code)}`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Ticket size={14} />
          Reportar problema
        </a>
        <a
          href={`/dashboard/maintenance?assetCode=${encodeURIComponent(asset.code)}`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <Wrench size={14} />
          Solicitar mantenimiento
        </a>
        <a
          href={`/dashboard/discovery?search=${encodeURIComponent(asset.serialNumber || asset.code)}`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          <Monitor size={14} />
          Buscar en Discovery
        </a>
      </div>

      {/* Info + QR + Depreciation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="border-slate-100 rounded-2xl lg:col-span-2">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <InfoRow label="Marca" value={asset.brand} />
                <InfoRow label="Modelo" value={asset.model} />
                <InfoRow label="Serial" value={asset.serialNumber} />
                <InfoRow label="Ubicación" value={asset.location?.name} />
                <InfoRow label="Proveedor" value={asset.supplier?.name} />
              </div>
              <div>
                <InfoRow
                  label="Fecha adquisición"
                  value={
                    asset.acquisitionDate
                      ? new Date(asset.acquisitionDate).toLocaleDateString('es-CO')
                      : undefined
                  }
                />
                <InfoRow
                  label="Costo"
                  value={
                    asset.acquisitionCost
                      ? `$${Number(asset.acquisitionCost).toLocaleString('es-CO')}`
                      : undefined
                  }
                />
                <InfoRow
                  label="Garantía hasta"
                  value={
                    asset.warrantyExpiry
                      ? new Date(asset.warrantyExpiry).toLocaleDateString('es-CO')
                      : undefined
                  }
                />
                <InfoRow
                  label="Vida útil"
                  value={asset.expectedLifeCycle ? `${asset.expectedLifeCycle} meses` : undefined}
                />
                <InfoRow label="Horas de uso" value={asset.usageHours} />
              </div>
            </div>
            {asset.description && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">
                  Descripción
                </p>
                <p className="text-sm text-slate-600">{asset.description}</p>
              </div>
            )}
            {asset.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide">
                  Notas
                </p>
                <p className="text-sm text-slate-600">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Características / Atributos de categoría */}
        {asset.attributeValues && asset.attributeValues.length > 0 && (
          <Card className="border-slate-100 rounded-2xl lg:col-span-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Características ({asset.attributeValues.length})
                </p>
                <button
                  onClick={() => {
                    setEditForm({
                      ...editForm,
                      attributeValues: asset.attributeValues.map((av: any) => ({
                        attributeId: av.attributeId,
                        value: av.value,
                      })),
                    });
                    setEditing(true);
                  }}
                  className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit size={12} /> Editar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {asset.attributeValues.map((av: any) => (
                  <div key={av.id} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {av.attribute?.name || 'Atributo'}
                    </p>
                    <p className="text-sm text-slate-800 font-medium mt-0.5">
                      {av.value} {av.attribute?.unit || ''}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          {qrUrl && (
            <Card className="border-slate-100 rounded-2xl">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <img src={qrUrl} alt="QR" className="w-36 h-36 rounded-xl" />
                <p className="text-xs text-slate-400 text-center font-mono break-all">
                  {asset.qrCode}
                </p>
              </CardContent>
            </Card>
          )}
          {depr && typeof depr.currentValue === 'number' && (
            <Card className="border-slate-100 rounded-2xl">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <TrendingDown size={14} className="text-orange-400" /> Depreciación
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1">
                <InfoRow
                  label="Valor original"
                  value={`$${Number(depr.originalCost || 0).toLocaleString('es-CO')}`}
                />
                <InfoRow
                  label="Valor actual"
                  value={`$${Number(depr.currentValue).toLocaleString('es-CO')}`}
                />
                <InfoRow
                  label="Depreciado"
                  value={`$${Number(depr.totalDepreciated || 0).toLocaleString('es-CO')}`}
                />
                <InfoRow label="Meses transcurridos" value={depr.monthsElapsed} />
                {depr.isFullyDepreciated && (
                  <div className="mt-2 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg text-center">
                    Totalmente depreciado
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history">
        <TabsList className="mb-4">
          <TabsTrigger value="history">
            <History size={13} className="mr-1.5" /> Hoja de vida ({events.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench size={13} className="mr-1.5" /> Mantenimientos ({maintenances.length})
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket size={13} className="mr-1.5" /> Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText size={13} className="mr-1.5" /> Documentos ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Hoja de vida */}
        <TabsContent value="history">
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-5">
              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Sin eventos registrados
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-100" />
                  <div className="space-y-4">
                    {events.map((ev: any) => {
                      const color = EVENT_COLORS[ev.type] || 'bg-slate-50 text-slate-500';
                      return (
                        <div key={ev.id} className="flex gap-4 relative">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${color}`}
                          >
                            <History size={16} />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-medium text-slate-800">{ev.description}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(ev.createdAt).toLocaleString('es-CO', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                            {ev.data &&
                              (() => {
                                try {
                                  const d = JSON.parse(ev.data);
                                  if (Object.keys(d).length > 0) {
                                    return (
                                      <div className="mt-2 flex gap-2 flex-wrap">
                                        {Object.entries(d).map(([k, v]) => (
                                          <span
                                            key={k}
                                            className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg"
                                          >
                                            {k}: {String(v)}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  }
                                } catch {}
                                return null;
                              })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mantenimientos */}
        <TabsContent value="maintenance">
          <Card className="border-slate-100 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {maintenances.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Sin mantenimientos registrados
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Programado</th>
                      <th className="px-4 py-3 text-left">Técnico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances.map((m: any) => (
                      <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.code}</td>
                        <td className="px-4 py-3">
                          {MAINTENANCE_TYPE_LABELS[m.type as keyof typeof MAINTENANCE_TYPE_LABELS]}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {m.scheduledDate
                            ? new Date(m.scheduledDate).toLocaleDateString('es-CO')
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{m.technician?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets */}
        <TabsContent value="tickets">
          <Card className="border-slate-100 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {tickets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Sin tickets asociados</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Título</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t: any) => (
                      <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documents">
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Documentos ({documents.length})
                </p>
                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus size={12} />
                  Adjuntar documento
                </button>
              </div>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Sin documentos adjuntos. Haz clic en "Adjuntar documento" para agregar uno.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                        <p className="text-xs text-slate-400">
                          {DOCUMENT_TYPE_LABELS[d.type as keyof typeof DOCUMENT_TYPE_LABELS]} · v{d.version} · {(d.size / 1024).toFixed(0)} KB
                          {d.isPublic && <span className="ml-2 text-emerald-500 font-semibold">Público</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            try {
                              const { documentsApi } = await import('@/lib/api');
                              await documentsApi.update(d.id, { isPublic: !d.isPublic });
                              refetch();
                            } catch (err: any) {
                              alert('Error: ' + (err.response?.data?.message || err.message));
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${d.isPublic ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                          title={d.isPublic ? 'Hacer privado' : 'Hacer público'}
                        >
                          {d.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <select
                          value={d.type}
                          onChange={async (e) => {
                            try {
                              const { documentsApi } = await import('@/lib/api');
                              await documentsApi.update(d.id, { type: e.target.value });
                              refetch();
                            } catch (err: any) {
                              console.error('Error cambiando categoría:', err);
                              alert('No se pudo cambiar la categoría: ' + (err.response?.data?.message || err.message));
                            }
                          }}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 min-w-[130px]"
                        >
                          {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <a
                          href={`/api/storage/public/${d.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowUploadDialog(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Adjuntar Documento</h2>
              <button onClick={() => setShowUploadDialog(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* File selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Archivo</label>
                <label className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                  {uploadFile ? (
                    <div className="text-center">
                      <FileText size={24} className="mx-auto text-blue-400 mb-1" />
                      <p className="text-xs font-medium text-slate-600">{uploadFile.name}</p>
                      <p className="text-[10px] text-slate-400">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Plus size={24} className="mx-auto text-slate-300" />
                      <p className="text-xs font-medium text-slate-500">Seleccionar archivo</p>
                      <p className="text-[10px] text-slate-400">PDF, JPG, PNG, MP4, etc.</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.doc,.docx"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setUploadFile(f);
                      // Auto-detect type from MIME
                      if (f) {
                        if (f.type.startsWith('image/')) setUploadType('IMAGE');
                        else if (f.type.startsWith('video/')) setUploadType('VIDEO');
                        else if (f.type === 'application/pdf') setUploadType('MANUAL');
                        else setUploadType('OTHER');
                      }
                    }}
                  />
                </label>
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 text-sm px-3 bg-white"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="TECHNICAL_SHEET">Ficha técnica</option>
                  <option value="WARRANTY">Garantía</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                  <option value="TUTORIAL">Tutorial</option>
                  <option value="IMAGE">Imagen del activo</option>
                  <option value="VIDEO">Video / Tutorial</option>
                  <option value="CERTIFICATE">Certificado</option>
                  <option value="INVOICE">Factura</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              {/* Public/Private toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Visible en portal público</p>
                  <p className="text-xs text-slate-400">Los usuarios podrán ver este documento sin iniciar sesión</p>
                </div>
                <button
                  onClick={() => setUploadPublic(!uploadPublic)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${uploadPublic ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${uploadPublic ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadFile(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                disabled={!uploadFile || uploading}
                onClick={async () => {
                  if (!uploadFile) return;
                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', uploadFile);
                    formData.append('assetId', id!);
                    formData.append('name', uploadFile.name);
                    formData.append('type', uploadType);
                    formData.append('isPublic', String(uploadPublic));
                    const { documentsApi } = await import('@/lib/api');
                    await documentsApi.upload(formData);
                    setShowUploadDialog(false);
                    setUploadFile(null);
                    refetch();
                  } catch (err: any) {
                    alert('Error al subir: ' + (err.response?.data?.message || err.message));
                  } finally {
                    setUploading(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Subiendo...' : 'Subir documento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Editar Activo</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Nombre', type: 'text' },
                  { key: 'brand', label: 'Marca', type: 'text' },
                  { key: 'model', label: 'Modelo', type: 'text' },
                  { key: 'serialNumber', label: 'Serial', type: 'text' },
                  { key: 'status', label: 'Estado', type: 'select', options: ['ACTIVE','MAINTENANCE','INACTIVE','DISPOSED','RESERVED'] },
                  { key: 'acquisitionDate', label: 'Fecha adquisición', type: 'date' },
                  { key: 'acquisitionCost', label: 'Costo', type: 'number' },
                  { key: 'warrantyExpiry', label: 'Garantía hasta', type: 'date' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={editForm[field.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={editForm[field.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3"
                      />
                    )}
                  </div>
                ))}

                {/* Categoría */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Building2 size={12} /> Categoría
                  </label>
                  <select
                    value={editForm.categoryId || ''}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value, subcategoryId: '' })}
                    className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ubicación */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <MapPin size={12} /> Ubicación
                  </label>
                  <select
                    value={editForm.locationId || ''}
                    onChange={(e) => setEditForm({ ...editForm, locationId: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3"
                  >
                    <option value="">Seleccionar...</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Proveedor */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Truck size={12} /> Proveedor
                  </label>
                  <select
                    value={editForm.supplierId || ''}
                    onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3"
                  >
                    <option value="">Sin proveedor</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full h-20 rounded-lg border border-slate-200 text-sm px-3 py-2 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Notas</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full h-16 rounded-lg border border-slate-200 text-sm px-3 py-2 resize-none"
                />
              </div>

              {/* Atributos de categoría */}
              {asset.attributeValues && asset.attributeValues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Características</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {asset.attributeValues.map((av: any) => {
                      const attrIdx = (editForm.attributeValues || []).findIndex(
                        (e: any) => e.attributeId === av.attributeId
                      );
                      const currentVal = attrIdx >= 0 ? editForm.attributeValues[attrIdx].value : av.value;
                      return (
                        <div key={av.id} className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            {av.attribute?.name || 'Atributo'} {av.attribute?.unit ? `(${av.attribute.unit})` : ''}
                          </label>
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => {
                              const newVals = [...(editForm.attributeValues || [])];
                              if (attrIdx >= 0) {
                                newVals[attrIdx] = { ...newVals[attrIdx], value: e.target.value };
                              } else {
                                newVals.push({ attributeId: av.attributeId, value: e.target.value });
                              }
                              setEditForm({ ...editForm, attributeValues: newVals });
                            }}
                            className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    // Limpiar strings vacíos para evitar errores de validación en el backend
                    const cleanForm: Record<string, any> = Object.fromEntries(
                      Object.entries(editForm).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                    );
                    // Convertir fechas de YYYY-MM-DD a ISO 8601
                    if (cleanForm.acquisitionDate && !cleanForm.acquisitionDate.includes('T')) {
                      cleanForm.acquisitionDate = new Date(cleanForm.acquisitionDate + 'T00:00:00.000Z').toISOString();
                    }
                    if (cleanForm.warrantyExpiry && !cleanForm.warrantyExpiry.includes('T')) {
                      cleanForm.warrantyExpiry = new Date(cleanForm.warrantyExpiry + 'T00:00:00.000Z').toISOString();
                    }
                    const { attributeValues, ...assetData } = cleanForm;
                    await assetsApi.update(id!, assetData);
                    if (attributeValues && attributeValues.length > 0) {
                      await assetsApi.updateAttributeValues(id!, attributeValues);
                    }
                    setEditing(false);
                    refetch();
                  } catch (e: any) {
                    alert('Error al guardar: ' + (e.response?.data?.message || e.message));
                  } finally {
                    setSaving(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
