'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tagsApi, assetsApi } from '@/lib/api';
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
import { useToast } from '@/components/ui/use-toast';
import { Plus, Tag as TagIcon, Trash2, Package, Search, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function TagsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#3b82f6' });
  const [saving, setSaving] = useState(false);

  // ── Timer cleanup ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (tagNameTimerRef.current) clearTimeout(tagNameTimerRef.current);
    };
  }, []);

  // ── Tag name availability check ────────────────────────────────────────────
  const [tagNameStatus, setTagNameStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    message?: string;
  }>({ state: 'idle' });
  const tagNameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkTagName = useCallback((name: string) => {
    if (tagNameTimerRef.current) clearTimeout(tagNameTimerRef.current);
    if (!name.trim()) {
      setTagNameStatus({ state: 'idle' });
      return;
    }
    tagNameTimerRef.current = setTimeout(async () => {
      setTagNameStatus({ state: 'checking' });
      try {
        const res = await tagsApi.checkName(name.trim());
        if (res.data.available) {
          setTagNameStatus({ state: 'available' });
        } else {
          setTagNameStatus({ state: 'taken', message: res.data.usedBy ? `Ya usado por "${res.data.usedBy}"` : 'Nombre no disponible' });
        }
      } catch {
        setTagNameStatus({ state: 'idle' });
      }
    }, 500);
  }, []);

  const [assetSearch, setAssetSearch] = useState('');
  const [assignDialog, setAssignDialog] = useState<{ tagId: string; tagName: string } | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const r = await tagsApi.list();
      return r.data as any[];
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets-all'],
    queryFn: async () => {
      const r = await assetsApi.list({ limit: 500 });
      return (r.data as any)?.data ?? (r.data as any[]);
    },
  });

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await tagsApi.create(form);
      toast({ title: 'Etiqueta creada' });
      setDialogOpen(false);
      setForm({ name: '', color: '#3b82f6' });
      qc.invalidateQueries({ queryKey: ['tags'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tagsApi.remove(id);
      toast({ title: 'Etiqueta eliminada' });
      qc.invalidateQueries({ queryKey: ['tags'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleAssign = async () => {
    if (!assignDialog || !selectedAssetId) return;
    try {
      await tagsApi.assignToAsset(selectedAssetId, assignDialog.tagId);
      toast({ title: 'Etiqueta asignada al activo' });
      qc.invalidateQueries({ queryKey: ['assets-all'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const [selectedAssetId, setSelectedAssetId] = useState('');

  const filteredAssets = Array.isArray(assets)
    ? assets.filter(
        (a: any) =>
          !assetSearch ||
          a.name?.toLowerCase().includes(assetSearch.toLowerCase()) ||
          a.code?.toLowerCase().includes(assetSearch.toLowerCase()),
      )
    : [];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Etiquetas (Tags)"
        subtitle="Categorización flexible de activos"
        action={
          <Button
            onClick={() => {
              setForm({ name: '', color: '#3b82f6' });
              setTagNameStatus({ state: 'idle' });
              setDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nueva etiqueta
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !Array.isArray(tags) || tags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="Sin etiquetas"
          subtitle="Crea etiquetas para categorizar tus activos"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag: any) => (
            <Card
              key={tag.id}
              className="border-slate-100 rounded-2xl hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: tag.color || '#e2e8f0' }}
                  >
                    <TagIcon size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{tag.name}</p>
                    <p className="text-xs text-slate-400">{tag._count?.assets ?? 0} activos</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setAssignDialog({ tagId: tag.id, tagName: tag.name });
                        setSelectedAssetId('');
                        setAssetSearch('');
                      }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Asignar a activo"
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Tag Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva etiqueta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
              <div className="relative">
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    checkTagName(e.target.value);
                  }}
                  placeholder="Ej. Crítico, Red, Oficina"
                  className={`h-9 rounded-xl text-sm pr-9 ${
                    tagNameStatus.state === 'available'
                      ? 'border-emerald-400 focus:ring-emerald-400/20 focus:border-emerald-400'
                      : tagNameStatus.state === 'taken'
                        ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                        : ''
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {tagNameStatus.state === 'checking' && (
                    <Loader2 size={15} className="animate-spin text-slate-400" />
                  )}
                  {tagNameStatus.state === 'available' && (
                    <CheckCircle size={15} className="text-emerald-500" />
                  )}
                  {tagNameStatus.state === 'taken' && (
                    <XCircle size={15} className="text-red-500" />
                  )}
                </div>
              </div>
              {tagNameStatus.state === 'taken' && tagNameStatus.message && (
                <p className="text-[10px] text-red-500 mt-0.5">{tagNameStatus.message}</p>
              )}
              {tagNameStatus.state === 'available' && (
                <p className="text-[10px] text-emerald-600 mt-0.5">Nombre disponible</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-1"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="h-9 rounded-xl text-sm flex-1"
                />
              </div>
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
              {saving ? 'Creando...' : 'Crear etiqueta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Tag Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar etiqueta "{assignDialog?.tagName}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Buscar activo</Label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Seleccionar activo</Label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccione...</option>
                {filteredAssets.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAssignDialog(null)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedAssetId}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              Asignar etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
