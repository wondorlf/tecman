'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { slasApi } from '@/lib/api';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Clock, Pencil, Trash2, Gauge, Timer } from 'lucide-react';

export default function SlasPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    resolutionHours: 4,
    responseHours: 1,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const { data: slas = [], isLoading } = useQuery({
    queryKey: ['slas'],
    queryFn: async () => {
      const r = await slasApi.list();
      return r.data as any[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', resolutionHours: 4, responseHours: 1, active: true });
    setDialogOpen(true);
  };

  const openEdit = (sla: any) => {
    setEditing(sla);
    setForm({
      name: sla.name,
      description: sla.description || '',
      resolutionHours: sla.resolutionHours,
      responseHours: sla.responseHours,
      active: sla.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await slasApi.update(editing.id, form);
        toast({ title: 'SLA actualizado' });
      } else {
        await slasApi.create(form);
        toast({ title: 'SLA creado' });
      }
      qc.invalidateQueries({ queryKey: ['slas'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await slasApi.remove(id);
      toast({ title: 'SLA eliminado' });
      qc.invalidateQueries({ queryKey: ['slas'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Acuerdos de Nivel de Servicio (SLA)"
        subtitle="Gestión de tiempos de respuesta y resolución para tickets"
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nuevo SLA
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !Array.isArray(slas) || slas.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sin SLAs"
          subtitle="Define acuerdos de servicio para los tickets"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slas.map((sla: any) => (
            <Card
              key={sla.id}
              className={`border-slate-100 rounded-2xl ${!sla.active ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Gauge size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{sla.name}</h3>
                      {sla.description && (
                        <p className="text-xs text-slate-400">{sla.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(sla)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(sla.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <Timer size={14} className="text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-400">Respuesta</p>
                      <p className="text-sm font-bold text-slate-800">{sla.responseHours}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <Clock size={14} className="text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-400">Resolución</p>
                      <p className="text-sm font-bold text-slate-800">{sla.resolutionHours}h</p>
                    </div>
                  </div>
                </div>
                {!sla.active && (
                  <span className="mt-2 inline-flex text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Inactivo
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar SLA' : 'Nuevo SLA'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej. Soporte Crítico"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="text-sm rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Tiempo de respuesta (horas)
                </Label>
                <Input
                  type="number"
                  value={form.responseHours}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, responseHours: parseInt(e.target.value) || 0 }))
                  }
                  className="h-9 rounded-xl text-sm"
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Tiempo de resolución (horas)
                </Label>
                <Input
                  type="number"
                  value={form.resolutionHours}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, resolutionHours: parseInt(e.target.value) || 0 }))
                  }
                  className="h-9 rounded-xl text-sm"
                  min={1}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))}
              />
              <Label className="text-xs font-semibold text-slate-600 cursor-pointer">
                SLA activo
              </Label>
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
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear SLA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
