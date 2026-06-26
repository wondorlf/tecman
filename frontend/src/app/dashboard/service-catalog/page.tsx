'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceCatalogApi } from '@/lib/api';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, BookOpen, Pencil, Trash2, Wrench, HelpCircle } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = { REQUEST: 'Solicitud', INCIDENT: 'Incidente' };

export default function ServiceCatalogPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: '', type: 'REQUEST' });
  const [saving, setSaving] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['service-catalog'],
    queryFn: async () => {
      const r = await serviceCatalogApi.list();
      return r.data as any[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: '', type: 'REQUEST' });
    setDialogOpen(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description, category: s.category || '', type: s.type });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'Nombre es requerido', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await serviceCatalogApi.update(editing.id, form);
        toast({ title: 'Servicio actualizado' });
      } else {
        await serviceCatalogApi.create(form);
        toast({ title: 'Servicio creado' });
      }
      qc.invalidateQueries({ queryKey: ['service-catalog'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await serviceCatalogApi.remove(id);
      toast({ title: 'Servicio eliminado' });
      qc.invalidateQueries({ queryKey: ['service-catalog'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const grouped: Record<string, any[]> = (Array.isArray(services) ? services : []).reduce(
    (acc: Record<string, any[]>, s: any) => {
      const cat = s.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {},
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Catálogo de Servicios"
        subtitle="Servicios TI disponibles para solicitudes e incidentes"
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nuevo servicio
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin servicios"
          subtitle="Define los servicios que ofrece tu área de TI"
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((svc: any) => (
                  <Card key={svc.id} className="border-slate-100 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                          {svc.type === 'INCIDENT' ? (
                            <HelpCircle size={16} className="text-purple-500" />
                          ) : (
                            <Wrench size={16} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 text-sm">{svc.name}</h3>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                svc.type === 'INCIDENT'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {TYPE_LABELS[svc.type] || svc.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{svc.description}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(svc)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(svc.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej. Solicitud de acceso a red"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Categoría</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="Ej. Accesos, Hardware"
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Tipo</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="REQUEST">Solicitud</option>
                  <option value="INCIDENT">Incidente</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="text-sm rounded-xl"
                placeholder="Describe el servicio..."
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
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
