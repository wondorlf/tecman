'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, subcategoriesApi, locationsApi, suppliersApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { SearchBar } from '@/components/shared/search-bar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Tag,
  MapPin,
  Truck,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  List,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ── Category row with inline subcategory management ─────────────────────────
function CategoryRow({
  item,
  onEdit,
  onDelete,
  onAddSub,
  onEditSub,
  onDeleteSub,
}: {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onAddSub: (cat: any) => void;
  onEditSub: (cat: any, sub: any) => void;
  onDeleteSub: (cat: any, sub: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const subs: any[] = item.subcategories || [];

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {expanded ? (
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
          )}
          <span className="text-sm font-semibold text-slate-800">{item.name}</span>
          {item.icon && <span className="text-base">{item.icon}</span>}
          <span className="text-xs text-slate-400 ml-1">
            {subs.length} sub · {item._count?.assets ?? 0} activos
          </span>
        </button>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onAddSub(item)}
            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-emerald-600 transition-colors"
            title="Agregar subcategoría"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Subcategories */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {subs.length === 0 ? (
            <p className="text-xs text-slate-400 px-8 py-2.5 italic">
              Sin subcategorías. Usa el botón + para agregar.
            </p>
          ) : (
            subs.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-2 px-8 py-2 hover:bg-slate-50/80 transition-colors"
              >
                <List size={11} className="text-slate-300 shrink-0" />
                <span className="text-sm text-slate-600 flex-1">{sub.name}</span>
                {sub.description && (
                  <span className="text-xs text-slate-400 truncate max-w-[120px]">
                    {sub.description}
                  </span>
                )}
                <button
                  onClick={() => onEditSub(item, sub)}
                  className="p-1 rounded hover:bg-white text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDeleteSub(item, sub)}
                  className="p-1 rounded hover:bg-white text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Generic list for locations and suppliers ─────────────────────────────────
function EntityList({
  items,
  onEdit,
  onDelete,
  subKey,
}: {
  items: any[];
  onEdit: (i: any) => void;
  onDelete: (id: string) => void;
  subKey?: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(
    (i) => !search || i.name?.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-3">
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar..." className="w-64" />
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">Sin registros.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                {subKey && item[subKey] && (
                  <p className="text-xs text-slate-400 truncate">{item[subKey]}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await categoriesApi.list()).data as any[],
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await locationsApi.list()).data as any[],
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await suppliersApi.list()).data as any[],
  });

  // ── Timer cleanup ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (catNameTimerRef.current) clearTimeout(catNameTimerRef.current);
    };
  }, []);

  const [catSearch, setCatSearch] = useState('');

  // ── Category name availability check ───────────────────────────────────────
  const [catNameStatus, setCatNameStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    message?: string;
  }>({ state: 'idle' });
  const catNameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkCategoryName = useCallback((name: string, editingName?: string) => {
    if (catNameTimerRef.current) clearTimeout(catNameTimerRef.current);
    if (!name.trim() || name === editingName) {
      setCatNameStatus({ state: 'idle' });
      return;
    }
    catNameTimerRef.current = setTimeout(async () => {
      setCatNameStatus({ state: 'checking' });
      try {
        const res = await categoriesApi.checkName(name.trim());
        if (res.data.available) {
          setCatNameStatus({ state: 'available' });
        } else {
          setCatNameStatus({ state: 'taken', message: res.data.usedBy ? `Ya usado por "${res.data.usedBy}"` : 'Nombre no disponible' });
        }
      } catch {
        setCatNameStatus({ state: 'idle' });
      }
    }, 500);
  }, []);

  // ── Category / location / supplier dialog ──────────────────────────────────
  type DialogType = 'category' | 'location' | 'supplier' | null;
  const [dialog, setDialog] = useState<{ type: DialogType; editing: any; form: any }>({
    type: null,
    editing: null,
    form: {},
  });
  const DEFAULTS: Record<string, any> = {
    category: { name: '', description: '', icon: '', color: '#3b82f6' },
    location: { name: '', code: '', address: '', floor: '', room: '' },
    supplier: { name: '', taxId: '', contact: '', email: '', phone: '', address: '', website: '' },
  };
  const openDialog = (type: Exclude<DialogType, null>, editing: any = null) => {
    setCatNameStatus({ state: 'idle' });
    setDialog({ type, editing, form: editing ? { ...editing } : { ...DEFAULTS[type] } });
  };
  const closeDialog = () => setDialog({ type: null, editing: null, form: {} });
  const f = (k: string, v: string) => setDialog((p) => ({ ...p, form: { ...p.form, [k]: v } }));

  const handleSave = async () => {
    if (!dialog.type) return;
    try {
      const apis: Record<string, any> = {
        category: categoriesApi,
        location: locationsApi,
        supplier: suppliersApi,
      };
      if (dialog.editing) {
        await apis[dialog.type].update(dialog.editing.id, dialog.form);
        toast({ title: 'Actualizado correctamente' });
      } else {
        await apis[dialog.type].create(dialog.form);
        toast({ title: 'Creado correctamente' });
      }
      qc.invalidateQueries({
        queryKey: [
          dialog.type === 'category'
            ? 'categories'
            : dialog.type === 'location'
              ? 'locations'
              : 'suppliers',
        ],
      });
      closeDialog();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleDelete = (type: Exclude<DialogType, null>) => async (id: string) => {
    try {
      const apis: Record<string, any> = {
        category: categoriesApi,
        location: locationsApi,
        supplier: suppliersApi,
      };
      await apis[type].remove(id);
      toast({ title: 'Eliminado' });
      qc.invalidateQueries({
        queryKey: [
          type === 'category' ? 'categories' : type === 'location' ? 'locations' : 'suppliers',
        ],
      });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  // ── Subcategory dialog ─────────────────────────────────────────────────────
  const [subDialog, setSubDialog] = useState<{
    open: boolean;
    parentCat: any;
    editing: any;
    name: string;
    description: string;
  }>({ open: false, parentCat: null, editing: null, name: '', description: '' });

  const openAddSub = (cat: any) =>
    setSubDialog({ open: true, parentCat: cat, editing: null, name: '', description: '' });
  const openEditSub = (cat: any, sub: any) =>
    setSubDialog({
      open: true,
      parentCat: cat,
      editing: sub,
      name: sub.name,
      description: sub.description || '',
    });
  const closeSubDialog = () => setSubDialog((p) => ({ ...p, open: false }));

  const handleSaveSub = async () => {
    const { parentCat, editing, name, description } = subDialog;
    if (!parentCat || !name.trim()) return;
    try {
      if (editing) {
        await subcategoriesApi.update(parentCat.id, editing.id, {
          name: name.trim(),
          description: description || undefined,
        });
        toast({ title: 'Subcategoría actualizada' });
      } else {
        await subcategoriesApi.create(parentCat.id, {
          name: name.trim(),
          description: description || undefined,
        });
        toast({ title: 'Subcategoría creada' });
      }
      qc.invalidateQueries({ queryKey: ['categories'] });
      closeSubDialog();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleDeleteSub = async (cat: any, sub: any) => {
    try {
      await subcategoriesApi.remove(cat.id, sub.id);
      toast({ title: 'Subcategoría eliminada' });
      qc.invalidateQueries({ queryKey: ['categories'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const TYPE_LABELS: Record<string, string> = {
    category: 'categoría',
    location: 'ubicación',
    supplier: 'proveedor',
  };
  const filteredCats = categories.filter(
    (c: any) => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()),
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Configuración"
        subtitle="Categorías, ubicaciones y proveedores del sistema"
      />

      <Tabs defaultValue="categories">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">
            <Tag size={13} className="mr-1.5" />
            Categorías ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin size={13} className="mr-1.5" />
            Ubicaciones ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Truck size={13} className="mr-1.5" />
            Proveedores ({suppliers.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Categories tab ── */}
        <TabsContent value="categories">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Tag size={14} /> Categorías de activos
              </CardTitle>
              <Button
                onClick={() => openDialog('category')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-8 px-3 text-xs gap-1"
              >
                <Plus size={13} /> Nueva categoría
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <SearchBar
                  value={catSearch}
                  onChange={setCatSearch}
                  placeholder="Buscar categoría..."
                  className="w-64"
                />
              </div>
              {filteredCats.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">Sin categorías.</div>
              ) : (
                <div className="space-y-2">
                  {filteredCats.map((cat: any) => (
                    <CategoryRow
                      key={cat.id}
                      item={cat}
                      onEdit={(i) => openDialog('category', i)}
                      onDelete={handleDelete('category')}
                      onAddSub={openAddSub}
                      onEditSub={openEditSub}
                      onDeleteSub={handleDeleteSub}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Locations tab ── */}
        <TabsContent value="locations">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MapPin size={14} /> Ubicaciones físicas
              </CardTitle>
              <Button
                onClick={() => openDialog('location')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-8 px-3 text-xs gap-1"
              >
                <Plus size={13} /> Nueva
              </Button>
            </CardHeader>
            <CardContent>
              <EntityList
                items={locations}
                onEdit={(i) => openDialog('location', i)}
                onDelete={handleDelete('location')}
                subKey="address"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Suppliers tab ── */}
        <TabsContent value="suppliers">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Truck size={14} /> Proveedores
              </CardTitle>
              <Button
                onClick={() => openDialog('supplier')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-8 px-3 text-xs gap-1"
              >
                <Plus size={13} /> Nuevo
              </Button>
            </CardHeader>
            <CardContent>
              <EntityList
                items={suppliers}
                onEdit={(i) => openDialog('supplier', i)}
                onDelete={handleDelete('supplier')}
                subKey="email"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Category/Location/Supplier Dialog ── */}
      <Dialog open={!!dialog.type} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.editing ? 'Editar' : 'Nueva'} {dialog.type ? TYPE_LABELS[dialog.type] : ''}
            </DialogTitle>
          </DialogHeader>

          {dialog.type === 'category' && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
                <div className="relative">
                  <Input
                    value={dialog.form.name || ''}
                    onChange={(e) => {
                      f('name', e.target.value);
                      checkCategoryName(e.target.value, dialog.editing?.name);
                    }}
                    placeholder="Ej. Equipos de cómputo"
                    className={`h-9 rounded-xl text-sm pr-9 ${
                      catNameStatus.state === 'available'
                        ? 'border-emerald-400 focus:ring-emerald-400/20 focus:border-emerald-400'
                        : catNameStatus.state === 'taken'
                          ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                          : ''
                    }`}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {catNameStatus.state === 'checking' && (
                      <Loader2 size={15} className="animate-spin text-slate-400" />
                    )}
                    {catNameStatus.state === 'available' && (
                      <CheckCircle size={15} className="text-emerald-500" />
                    )}
                    {catNameStatus.state === 'taken' && (
                      <XCircle size={15} className="text-red-500" />
                    )}
                  </div>
                </div>
                {catNameStatus.state === 'taken' && catNameStatus.message && (
                  <p className="text-[10px] text-red-500 mt-0.5">{catNameStatus.message}</p>
                )}
                {catNameStatus.state === 'available' && (
                  <p className="text-[10px] text-emerald-600 mt-0.5">Nombre disponible</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
                <Textarea
                  value={dialog.form.description || ''}
                  onChange={(e) => f('description', e.target.value)}
                  rows={2}
                  className="text-sm rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Ícono (emoji)</Label>
                  <Input
                    value={dialog.form.icon || ''}
                    onChange={(e) => f('icon', e.target.value)}
                    placeholder="💻"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={dialog.form.color || '#3b82f6'}
                      onChange={(e) => f('color', e.target.value)}
                      className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-1"
                    />
                    <Input
                      value={dialog.form.color || '#3b82f6'}
                      onChange={(e) => f('color', e.target.value)}
                      className="h-9 rounded-xl text-sm flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {dialog.type === 'location' && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
                  <Input
                    value={dialog.form.name || ''}
                    onChange={(e) => f('name', e.target.value)}
                    placeholder="Ej. Piso 3 - Sala TI"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Código</Label>
                  <Input
                    value={dialog.form.code || ''}
                    onChange={(e) => f('code', e.target.value)}
                    placeholder="P3-TI"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Dirección</Label>
                <Input
                  value={dialog.form.address || ''}
                  onChange={(e) => f('address', e.target.value)}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Piso</Label>
                  <Input
                    value={dialog.form.floor || ''}
                    onChange={(e) => f('floor', e.target.value)}
                    placeholder="3"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Sala / Oficina</Label>
                  <Input
                    value={dialog.form.room || ''}
                    onChange={(e) => f('room', e.target.value)}
                    placeholder="A-301"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {dialog.type === 'supplier' && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Razón social *</Label>
                  <Input
                    value={dialog.form.name || ''}
                    onChange={(e) => f('name', e.target.value)}
                    placeholder="Nombre empresa"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">NIT</Label>
                  <Input
                    value={dialog.form.taxId || ''}
                    onChange={(e) => f('taxId', e.target.value)}
                    placeholder="900.000.000-0"
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Contacto</Label>
                  <Input
                    value={dialog.form.contact || ''}
                    onChange={(e) => f('contact', e.target.value)}
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Teléfono</Label>
                  <Input
                    value={dialog.form.phone || ''}
                    onChange={(e) => f('phone', e.target.value)}
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Email</Label>
                  <Input
                    type="email"
                    value={dialog.form.email || ''}
                    onChange={(e) => f('email', e.target.value)}
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Sitio web</Label>
                  <Input
                    value={dialog.form.website || ''}
                    onChange={(e) => f('website', e.target.value)}
                    placeholder="https://..."
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Dirección</Label>
                <Input
                  value={dialog.form.address || ''}
                  onChange={(e) => f('address', e.target.value)}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl h-9 text-sm">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {dialog.editing ? 'Guardar cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Subcategory Dialog ── */}
      <Dialog open={subDialog.open} onOpenChange={(o) => !o && closeSubDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {subDialog.editing ? 'Editar' : 'Nueva'} subcategoría
              {subDialog.parentCat && (
                <span className="text-slate-400 font-normal ml-1">
                  en {subDialog.parentCat.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre *</Label>
              <Input
                value={subDialog.name}
                onChange={(e) => setSubDialog((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej. Laptops, Impresoras..."
                className="h-9 rounded-xl text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción (opcional)</Label>
              <Input
                value={subDialog.description}
                onChange={(e) => setSubDialog((p) => ({ ...p, description: e.target.value }))}
                className="h-9 rounded-xl text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeSubDialog} className="rounded-xl h-9 text-sm">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSub}
              disabled={!subDialog.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {subDialog.editing ? 'Guardar' : 'Crear subcategoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
