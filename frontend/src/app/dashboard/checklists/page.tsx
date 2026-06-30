'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from '@/lib/api';
import { Checklist, MAINTENANCE_TYPE_LABELS } from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { SearchBar } from '@/components/shared/search-bar';
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
import { downloadBlob } from '@/lib/api';
import {
  Plus,
  ClipboardList,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  FileDown,
} from 'lucide-react';

const FIELD_TYPES = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'CHECKBOX',
  'SELECT',
  'RADIO',
  'DATE',
  'PHOTO',
  'SIGNATURE',
  'FILE',
  'YES_NO_NA',
];
const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Texto',
  TEXTAREA: 'Área de texto',
  NUMBER: 'Número',
  CHECKBOX: 'Casilla',
  SELECT: 'Lista desplegable',
  RADIO: 'Opción única',
  DATE: 'Fecha',
  PHOTO: 'Fotografía',
  SIGNATURE: 'Firma',
  FILE: 'Archivo',
  YES_NO_NA: 'Sí / No / No aplica',
};

const EMPTY_ITEM = { label: '', type: 'TEXT', required: false, description: '' };

export default function ChecklistsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Checklist | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    maintenanceType: '',
    items: [] as any[],
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Checklist | null>(null);

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const r = await checklistsApi.list();
      return (r.data as any).data as Checklist[];
    },
  });

  const filtered = checklists.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      maintenanceType: '',
      items: [{ ...EMPTY_ITEM }],
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Checklist) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description || '',
      maintenanceType: c.maintenanceType || '',
      items:
        c.items?.map((i) => ({
          label: i.label,
          type: i.type,
          required: i.required,
          description: i.description || '',
        })) || [],
    });
    setDialogOpen(true);
  };

  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));

  const removeItem = (idx: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const updateItem = (idx: number, k: string, v: any) =>
    setForm((p) => ({
      ...p,
      items: p.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)),
    }));

  const handleSave = async () => {
    if (!form.name || form.items.length === 0) {
      toast({ title: 'Nombre y al menos un ítem son requeridos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        maintenanceType: form.maintenanceType || undefined,
        items: form.items.map((it, i) => ({ ...it, order: i + 1 })),
      };
      if (editing) {
        await checklistsApi.update(editing.id, payload);
        toast({ title: 'Checklist actualizado' });
      } else {
        await checklistsApi.create(payload);
        toast({ title: 'Checklist creado' });
      }
      qc.invalidateQueries({ queryKey: ['checklists'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Checklist) => {
    try {
      await checklistsApi.remove(c.id);
      toast({ title: 'Checklist eliminado' });
      qc.invalidateQueries({ queryKey: ['checklists'] });
      setDeleteConfirm(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Checklists"
        subtitle="Plantillas de verificación para mantenimientos"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await checklistsApi.exportXlsx();
                  downloadBlob(res.data, `checklists_${Date.now()}.xlsx`);
                  toast({ title: 'Checklists exportados' });
                } catch {
                  toast({ title: 'Error al exportar', variant: 'destructive' });
                }
              }}
              className="rounded-xl h-9 px-3 text-sm gap-1.5"
            >
              <FileDown size={14} /> Exportar
            </Button>
            <Button
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
            >
              <Plus size={15} /> Nuevo checklist
            </Button>
          </div>
        }
      />

      <Card className="border-slate-100 rounded-2xl mb-4">
        <CardContent className="p-3 flex gap-3 items-center">
          <SearchBar
            id="search-checklists"
            value={search}
            onChange={setSearch}
            placeholder="Buscar checklists..."
            className="w-64"
          />
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} checklist{filtered.length !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin checklists"
          subtitle="Crea plantillas para estandarizar los mantenimientos"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className="border-slate-100 rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm">{c.name}</h3>
                    {!c.active && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                    {c.maintenanceType && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {
                          MAINTENANCE_TYPE_LABELS[
                            c.maintenanceType as keyof typeof MAINTENANCE_TYPE_LABELS
                          ]
                        }
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.items?.length || 0} ítem{(c.items?.length || 0) !== 1 ? 's' : ''}
                    {c.description ? ` · ${c.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    {expanded === c.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(c)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {expanded === c.id && c.items && c.items.length > 0 && (
                <div className="border-t border-slate-100 p-4 space-y-1.5">
                  {c.items
                    .sort((a, b) => a.order - b.order)
                    .map((item, i) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-1.5 px-3 bg-slate-50 rounded-xl"
                      >
                        <span className="text-xs text-slate-400 w-5 text-right shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm text-slate-800">{item.label}</span>
                          {item.required && <span className="text-red-500 ml-1 text-xs">*</span>}
                        </div>
                        <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                          {FIELD_TYPE_LABELS[item.type] || item.type}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar checklist' : 'Nuevo checklist'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej. Mantenimiento preventivo PC"
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Tipo de mantenimiento
                </Label>
                <select
                  value={form.maintenanceType}
                  onChange={(e) => setForm((p) => ({ ...p, maintenanceType: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Cualquiera</option>
                  <option value="PREVENTIVE">Preventivo</option>
                  <option value="CORRECTIVE">Correctivo</option>
                  <option value="PREDICTIVE">Predictivo</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripción opcional..."
                rows={2}
                className="text-sm rounded-xl"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-slate-600">
                  Ítems del checklist *
                </Label>
                <Button
                  onClick={addItem}
                  variant="outline"
                  className="h-7 px-3 text-xs rounded-lg gap-1"
                >
                  <Plus size={12} /> Agregar ítem
                </Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 rounded-xl">
                    <GripVertical size={14} className="text-slate-300 mt-2.5 shrink-0" />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => updateItem(i, 'label', e.target.value)}
                        placeholder={`Ítem ${i + 1}...`}
                        className="h-8 rounded-lg text-sm col-span-2"
                      />
                      <select
                        value={item.type}
                        onChange={(e) => updateItem(i, 'type', e.target.value)}
                        className="h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {FIELD_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) => updateItem(i, 'required', e.target.checked)}
                          className="rounded"
                        />
                        Obligatorio
                      </label>
                    </div>
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1 text-slate-300 hover:text-red-400 transition-colors mt-1 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
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
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear checklist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar checklist?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Estás a punto de eliminar <strong>{deleteConfirm?.name}</strong>. Esta acción no se
            puede deshacer.
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
    </div>
  );
}
