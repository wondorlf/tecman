'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kitsApi, assetsApi } from '@/lib/api';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Package, Trash2, Layers, ChevronDown, ChevronRight, ChevronUp, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function KitsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [addItemDialog, setAddItemDialog] = useState<{ kitId: string; kitName: string } | null>(null);
  const [selectedAsset, setSelectedAsset] = useState('');

  // ── Timer cleanup ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (kitNameTimerRef.current) clearTimeout(kitNameTimerRef.current);
    };
  }, []);

  // ── Kit name availability check ───────────────────────────────────────────
  const [kitNameStatus, setKitNameStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    message?: string;
  }>({ state: 'idle' });
  const kitNameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkKitName = useCallback((name: string) => {
    if (kitNameTimerRef.current) clearTimeout(kitNameTimerRef.current);
    if (!name.trim()) {
      setKitNameStatus({ state: 'idle' });
      return;
    }
    kitNameTimerRef.current = setTimeout(async () => {
      setKitNameStatus({ state: 'checking' });
      try {
        const res = await kitsApi.checkName(name.trim());
        if (res.data.available) {
          setKitNameStatus({ state: 'available' });
        } else {
          setKitNameStatus({ state: 'taken', message: res.data.usedBy ? `Ya usado por "${res.data.usedBy}"` : 'Nombre no disponible' });
        }
      } catch {
        setKitNameStatus({ state: 'idle' });
      }
    }, 500);
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ['kits'],
    queryFn: async () => {
      const r = await kitsApi.list();
      return r.data as any;
    },
  });
  const kits: any[] = response?.data ?? response ?? [];

  const { data: assets = [] } = useQuery({
    queryKey: ['assets-simple'],
    queryFn: async () => {
      const r = await assetsApi.list({ limit: 500 });
      return (r.data as any)?.data ?? (r.data as any[]);
    },
  });

  const { data: kitDetail } = useQuery({
    queryKey: ['kit-detail', addItemDialog?.kitId],
    queryFn: async () => {
      if (!addItemDialog?.kitId) return null;
      const r = await kitsApi.get(addItemDialog.kitId);
      return r.data as any;
    },
    enabled: !!addItemDialog?.kitId,
  });

  // Fetch kit detail when expanding to show items
  const { data: expandedKit } = useQuery({
    queryKey: ['kit-detail-expanded', expanded],
    queryFn: async () => {
      if (!expanded) return null;
      const r = await kitsApi.get(expanded);
      return r.data as any;
    },
    enabled: !!expanded,
  });

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await kitsApi.create(form);
      toast({ title: 'Kit creado exitosamente' });
      setDialogOpen(false);
      setForm({ name: '', description: '' });
      qc.invalidateQueries({ queryKey: ['kits'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!addItemDialog || !selectedAsset) return;
    setSaving(true);
    try {
      await kitsApi.addItem(addItemDialog.kitId, selectedAsset);
      toast({ title: 'Activo agregado al kit' });
      setSelectedAsset('');
      qc.invalidateQueries({ queryKey: ['kits'] });
      qc.invalidateQueries({ queryKey: ['kit-detail', addItemDialog.kitId] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = async (kitId: string, assetId: string) => {
    try {
      await kitsApi.removeItem(kitId, assetId);
      toast({ title: 'Activo removido del kit' });
      qc.invalidateQueries({ queryKey: ['kits'] });
      if (addItemDialog?.kitId === kitId) {
        qc.invalidateQueries({ queryKey: ['kit-detail', kitId] });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Kits"
        subtitle="Agrupaciones lógicas de activos (bundles)"
        action={
          <Button
            onClick={() => {
              setForm({ name: '', description: '' });
              setKitNameStatus({ state: 'idle' });
              setDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nuevo kit
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !Array.isArray(kits) || kits.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Sin kits"
          subtitle="Agrupa activos relacionados creando un kit"
        />
      ) : (
        <div className="space-y-3">
          {kits.map((kit: any) => (
            <Card key={kit.id} className="border-slate-100 rounded-2xl overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Layers size={16} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm">{kit.name}</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {kit._count?.items ?? 0} items
                    </span>
                  </div>
                  {kit.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{kit.description}</p>
                  )}
                  {kit.parentAsset && (
                    <p className="text-xs text-blue-500 mt-0.5">
                      Asset principal: {kit.parentAsset.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setAddItemDialog({ kitId: kit.id, kitName: kit.name });
                      setSelectedAsset('');
                    }}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Agregar activo"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === kit.id ? null : kit.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    {expanded === kit.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </CardContent>

              {expanded === kit.id && (
                <div className="border-t border-slate-100 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Activos del kit
                  </p>
                  {expandedKit?.items?.length > 0 ? (
                    expandedKit.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl"
                      >
                        <Package size={13} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 flex-1">
                          {item.asset?.name || 'Activo'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{item.asset?.code}</span>
                        <button
                          onClick={() => handleRemoveItem(kit.id, item.assetId)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Sin activos. Usa + para agregar.
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Kit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Kit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre del kit *</Label>
              <div className="relative">
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    checkKitName(e.target.value);
                  }}
                  placeholder="Ej. Kit de diagnóstico"
                  className={`h-9 rounded-xl text-sm pr-9 ${
                    kitNameStatus.state === 'available'
                      ? 'border-emerald-400 focus:ring-emerald-400/20 focus:border-emerald-400'
                      : kitNameStatus.state === 'taken'
                        ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                        : ''
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {kitNameStatus.state === 'checking' && (
                    <Loader2 size={15} className="animate-spin text-slate-400" />
                  )}
                  {kitNameStatus.state === 'available' && (
                    <CheckCircle size={15} className="text-emerald-500" />
                  )}
                  {kitNameStatus.state === 'taken' && (
                    <XCircle size={15} className="text-red-500" />
                  )}
                </div>
              </div>
              {kitNameStatus.state === 'taken' && kitNameStatus.message && (
                <p className="text-[10px] text-red-500 mt-0.5">{kitNameStatus.message}</p>
              )}
              {kitNameStatus.state === 'available' && (
                <p className="text-[10px] text-emerald-600 mt-0.5">Nombre disponible</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripción del kit..."
                rows={2}
                className="text-sm rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {saving ? 'Creando...' : 'Crear kit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!addItemDialog} onOpenChange={() => setAddItemDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar activo a {addItemDialog?.kitName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Seleccionar activo *</Label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccione un activo...</option>
                {Array.isArray(assets) &&
                  assets.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
              </select>
            </div>
            {kitDetail?.items && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">
                  Activos actuales ({kitDetail.items.length})
                </p>
                {kitDetail.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg"
                  >
                    <Package size={11} className="text-slate-400" />
                    {item.asset?.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddItemDialog(null)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!selectedAsset || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {saving ? 'Agregando...' : 'Agregar al kit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
