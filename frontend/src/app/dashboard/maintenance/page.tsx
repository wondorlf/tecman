'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { maintenanceApi, assetsApi, usersApi, checklistsApi } from '@/lib/api';
import {
  Maintenance,
  MaintenanceType,
  MaintenanceStatus,
  Priority,
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { SearchBar } from '@/components/shared/search-bar';
import { useFilterPresets } from '@/lib/use-filter-presets';
import { StatusBadge } from '@/components/shared/status-badge';
import { SectionWrapper, StaggeredItem } from '@/components/shared/section-wrapper';
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
  Wrench,
  Pencil,
  CheckCircle,
  CalendarDays,
  List,
  Save,
  Bookmark,
} from 'lucide-react';
import { Calendar, momentLocalizer, type Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

const TYPES: MaintenanceType[] = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE'];
const STATUSES: MaintenanceStatus[] = [
  'PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const TYPE_COLORS: Record<MaintenanceType, string> = {
  PREVENTIVE: 'bg-blue-50 text-blue-600',
  CORRECTIVE: 'bg-red-50 text-red-600',
  PREDICTIVE: 'bg-purple-50 text-purple-600',
};

const STATUS_STYLES: Record<string, { bg: string; border: string }> = {
  PENDING: { bg: '#fef3c7', border: '#f59e0b' },
  SCHEDULED: { bg: '#dbeafe', border: '#3b82f6' },
  IN_PROGRESS: { bg: '#f3f4f6', border: '#6b7280' },
  COMPLETED: { bg: '#d1fae5', border: '#10b981' },
  CANCELLED: { bg: '#fee2e2', border: '#ef4444' },
};

const EMPTY = {
  assetId: '',
  type: 'PREVENTIVE' as MaintenanceType,
  priority: 'MEDIUM' as Priority,
  status: 'PENDING' as MaintenanceStatus,
  scheduledDate: '',
  description: '',
  technicianId: '',
  checklistId: '',
};

export default function MaintenancePage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const {
    presets: filterPresets,
    presetName,
    setPresetName,
    showSaveDialog: showFilterSave,
    setShowSaveDialog: setShowFilterSave,
    savePreset,
    loadPreset,
    deletePreset,
  } = useFilterPresets('maintenance');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [completeDialog, setCompleteDialog] = useState<Maintenance | null>(null);
  const [completeForm, setCompleteForm] = useState({ diagnosis: '', solution: '', cost: '' });
  const [checklistResponses, setChecklistResponses] = useState<Record<string, any>>({});

  const searchParams = useSearchParams();
  const assetCodeParam = searchParams.get('assetCode');

  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['maintenances'],
    queryFn: async () => {
      const r = await maintenanceApi.list();
      return (r.data as any).data as Maintenance[];
    },
    refetchInterval: 30000,
  });
  const { data: assets = [] } = useQuery({
    queryKey: ['assets-simple'],
    queryFn: async () => {
      const r = await assetsApi.list();
      return (r.data as any).data as any[];
    },
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await usersApi.list();
      return (r.data as any).data as any[];
    },
  });
  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const r = await checklistsApi.list();
      return (r.data as any).data as any[];
    },
  });

  // Get the selected asset's category to filter checklists
  const selectedAsset = assets.find((a: any) => a.id === form.assetId);
  const assetCategoryId = selectedAsset?.categoryId;

  // Filter checklists by asset category
  const filteredChecklists = useMemo(() => {
    if (!assetCategoryId) return checklists;
    return checklists.filter((c: any) => {
      const categories = c.categories || [];
      return categories.some((cat: any) => cat.id === assetCategoryId);
    });
  }, [checklists, assetCategoryId]);

  // Auto-select first checklist when asset changes
  useEffect(() => {
    if (assetCategoryId && filteredChecklists.length > 0 && !form.checklistId) {
      f('checklistId', filteredChecklists[0].id);
    }
  }, [assetCategoryId, filteredChecklists]);

  const renderChecklistItem = (item: any) => {
    const value = checklistResponses[item.id] ?? '';
    const onChange = (val: any) => setChecklistResponses((prev) => ({ ...prev, [item.id]: val }));
    const parsedOptions = item.options ? (typeof item.options === 'string' ? JSON.parse(item.options) : item.options) : [];

    switch (item.type) {
      case 'TEXT':
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={item.description || 'Ingrese texto...'}
            className="h-8 rounded-lg text-sm"
          />
        );
      case 'TEXTAREA':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={item.description || 'Ingrese detalle...'}
            rows={2}
            className="text-sm rounded-lg"
          />
        );
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="h-8 rounded-lg text-sm"
          />
        );
      case 'CHECKBOX':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-xs text-slate-600">Sí / Completado</span>
          </label>
        );
      case 'SELECT':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white"
          >
            <option value="">Seleccionar...</option>
            {parsedOptions.map((opt: string, i: number) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'RADIO':
        return (
          <div className="flex flex-wrap gap-3">
            {parsedOptions.map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`checklist-${item.id}`}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="border-slate-300"
                />
                <span className="text-xs text-slate-600">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'DATE':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 rounded-lg text-sm"
          />
        );
      case 'PHOTO':
        return (
          <div className="space-y-1">
            {value && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-emerald-600 font-medium">{String(value)}</span>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-[10px] text-red-400 hover:text-red-600"
                >
                  Quitar
                </button>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 h-10 rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 cursor-pointer transition-all text-xs text-slate-500 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              {value ? 'Tomar otra foto' : 'Abrir cámara'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const timestamp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                    onChange(`${file.name} (${timestamp})`);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        );
      case 'YES_NO_NA':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white"
          >
            <option value="">Seleccionar...</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
            <option value="NO APLICA">No aplica</option>
          </select>
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ingrese valor..."
            className="h-8 rounded-lg text-sm"
          />
        );
    }
  };

  const filtered = useMemo(() => {
    return maintenances.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q || m.asset?.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || m.type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [maintenances, search, typeFilter, statusFilter]);

  const calendarEvents = useMemo((): Event[] => {
    return filtered
      .filter((m) => m.scheduledDate)
      .map((m) => {
        const start = new Date(m.scheduledDate!);
        const end = new Date(start);
        end.setHours(start.getHours() + 2);
        const style = STATUS_STYLES[m.status] || STATUS_STYLES.PENDING;
        return {
          id: m.id,
          title: `${m.asset?.name || '—'} [${MAINTENANCE_TYPE_LABELS[m.type]}]`,
          start,
          end,
          resource: m,
          ...style,
        };
      });
  }, [filtered]);

  const eventPropGetter = useCallback(
    (event: any) => ({
      style: {
        backgroundColor: event.bg,
        borderLeft: `4px solid ${event.border}`,
        borderRadius: '6px',
        color: '#1e293b',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 6px',
      },
    }),
    [],
  );

  const handleSelectEvent = useCallback((event: any) => {
    if (event.resource) openEdit(event.resource);
  }, []);

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  };

  useEffect(() => {
    if (assetCodeParam && assets.length > 0) {
      const match = assets.find((a: any) => a.code === assetCodeParam);
      if (match) {
        setEditing(null);
        setForm({ ...EMPTY, assetId: match.id });
        setDialogOpen(true);
      }
    }
  }, [assetCodeParam, assets]);
  const openEdit = (m: Maintenance) => {
    setEditing(m);
    setForm({
      assetId: m.assetId,
      type: m.type,
      priority: m.priority,
      status: m.status,
      scheduledDate: m.scheduledDate ? m.scheduledDate.split('T')[0] : '',
      description: m.description || '',
      technicianId: m.technician?.id || '',
      checklistId: m.checklist?.id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.assetId) {
      toast({ title: 'Selecciona un activo', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        scheduledDate: form.scheduledDate || undefined,
        technicianId: form.technicianId || undefined,
        checklistId: form.checklistId || undefined,
      };
      if (editing) {
        await maintenanceApi.update(editing.id, payload);
        toast({ title: 'Mantenimiento actualizado' });
      } else {
        await maintenanceApi.create(payload);
        toast({ title: 'Mantenimiento creado' });
      }
      qc.invalidateQueries({ queryKey: ['maintenances'] });
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

  const handleComplete = async () => {
    if (!completeDialog) return;
    try {
      const payload: any = {
        diagnosis: completeForm.diagnosis,
        solution: completeForm.solution,
        cost: completeForm.cost ? parseFloat(completeForm.cost) : undefined,
      };
      // Incluir respuestas del checklist si existen
      if (Object.keys(checklistResponses).length > 0) {
        payload.checklistData = checklistResponses;
      }
      await maintenanceApi.complete(completeDialog.id, payload);
      toast({ title: 'Mantenimiento completado' });
      qc.invalidateQueries({ queryKey: ['maintenances'] });
      setCompleteDialog(null);
      setCompleteForm({ diagnosis: '', solution: '', cost: '' });
      setChecklistResponses({});
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  // Stats
  const pending = maintenances.filter((m) => m.status === 'PENDING').length;
  const inProgress = maintenances.filter((m) => m.status === 'IN_PROGRESS').length;
  const completed = maintenances.filter((m) => m.status === 'COMPLETED').length;
  const overdue = maintenances.filter(
    (m) =>
      m.scheduledDate &&
      new Date(m.scheduledDate) < new Date() &&
      !['COMPLETED', 'CANCELLED'].includes(m.status),
  ).length;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Mantenimiento"
        subtitle="Gestión de órdenes de mantenimiento"
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nueva orden
          </Button>
        }
      />

      {/* KPI mini-cards */}
      <SectionWrapper className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            label: 'Pendientes',
            value: pending,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            filter: 'PENDING',
          },
          {
            label: 'En proceso',
            value: inProgress,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            filter: 'IN_PROGRESS',
          },
          {
            label: 'Completados',
            value: completed,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            filter: 'COMPLETED',
          },
          {
            label: 'Vencidos',
            value: overdue,
            color: 'text-red-600',
            bg: 'bg-red-50',
            filter: null,
          },
        ].map((kpi, i) =>
          kpi.filter ? (
            <StaggeredItem key={kpi.label} index={i} baseDelay={0}>
              <button onClick={() => setStatusFilter(kpi.filter)} className="text-left w-full">
                <Card className="border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={`${kpi.bg} ${kpi.color} w-9 h-9 rounded-xl flex items-center justify-center`}
                    >
                      <Wrench size={16} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                      <p className="text-xs text-slate-400">{kpi.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </StaggeredItem>
          ) : (
            <StaggeredItem key={kpi.label} index={i} baseDelay={0}>
              <Card className="border-slate-100 rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`${kpi.bg} ${kpi.color} w-9 h-9 rounded-xl flex items-center justify-center`}
                  >
                    <Wrench size={16} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                    <p className="text-xs text-slate-400">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggeredItem>
          ),
        )}
      </SectionWrapper>

      {/* View Tabs + Filters */}
      <SectionWrapper delay={100}>
        <Card className="border-slate-100 rounded-2xl mb-4">
          <CardContent className="p-3 flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl">
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === 'table'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List size={14} className="inline mr-1" /> Tabla
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === 'calendar'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <CalendarDays size={14} className="inline mr-1" /> Calendario
              </button>
            </div>
            <SearchBar
              id="search-maintenance"
              value={search}
              onChange={setSearch}
              placeholder="Buscar por activo o código..."
              className="w-64"
            />
            <select
              id="filter-type"
              name="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">Todos los tipos</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {MAINTENANCE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              id="filter-maint-status"
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">Todos los estados</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {MAINTENANCE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {/* Save/Load filter presets */}
            <div className="relative ml-auto flex items-center gap-1">
              {filterPresets.length > 0 && (
                <div className="flex items-center gap-1">
                  {filterPresets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        loadPreset(p, (f) => {
                          setSearch(f.search || '');
                          setTypeFilter(f.type || 'ALL');
                          setStatusFilter(f.status || 'ALL');
                        })
                      }
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                      title={`Cargar: ${p.name}`}
                    >
                      <Bookmark size={10} />
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowFilterSave(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                title="Guardar filtros actuales"
              >
                <Save size={14} />
              </button>
            </div>
            <span className="text-xs text-slate-400">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          </CardContent>
        </Card>
      </SectionWrapper>

      {/* Save filter preset dialog */}
      <Dialog open={showFilterSave} onOpenChange={setShowFilterSave}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Guardar filtros</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nombre del preset..."
              className="h-9 rounded-xl text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && presetName.trim()) {
                  savePreset(presetName.trim(), { search, type: typeFilter, status: statusFilter });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFilterSave(false)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={() =>
                savePreset(presetName.trim(), { search, type: typeFilter, status: statusFilter })
              }
              disabled={!presetName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table View */}
      <SectionWrapper delay={200}>
        {view === 'table' && (
          <>
            {isLoading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Sin órdenes de mantenimiento"
                subtitle="Crea la primera orden con el botón de arriba"
              />
            ) : (
              <Card className="border-slate-100 rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead>Código</TableHead>
                      <TableHead>Activo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden lg:table-cell">Programado</TableHead>
                      <TableHead className="hidden lg:table-cell">Técnico</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((m) => {
                      const isOverdue =
                        m.scheduledDate &&
                        new Date(m.scheduledDate) < new Date() &&
                        !['COMPLETED', 'CANCELLED'].includes(m.status);
                      return (
                        <TableRow
                          key={m.id}
                          onClick={() => openEdit(m)}
                          className={`cursor-pointer hover:bg-blue-50/20 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}
                        >
                          <TableCell className="font-mono text-xs text-slate-500">
                            {m.code}
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">
                            {m.asset ? (
                              <a
                                href={`/dashboard/assets/${m.asset.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-blue-600 transition-colors"
                              >
                                {m.asset.name}
                              </a>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[m.type]}`}
                            >
                              {MAINTENANCE_TYPE_LABELS[m.type]}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <StatusBadge status={m.priority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={m.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                            {m.scheduledDate ? (
                              <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
                                {new Date(m.scheduledDate).toLocaleDateString('es-CO')}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                            {m.technician?.name || 'Sin asignar'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!['COMPLETED', 'CANCELLED'].includes(m.status) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCompleteDialog(m);
                                    setCompleteForm({ diagnosis: '', solution: '', cost: '' });
                                    setChecklistResponses({});
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                                  title="Completar"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              {!['COMPLETED', 'CANCELLED'].includes(m.status) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(m);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </>
        )}
      </SectionWrapper>

      {/* Calendar View */}
      <SectionWrapper delay={200}>
        {view === 'calendar' && (
          <Card className="border-slate-100 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              {calendarEvents.length === 0 ? (
                <div className="h-[500px] flex items-center justify-center text-slate-400 text-sm">
                  Sin mantenimientos programados con fecha
                </div>
              ) : (
                <div className="h-[600px]">
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventPropGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView="month"
                    popup
                    messages={{
                      next: 'Siguiente',
                      previous: 'Anterior',
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día',
                      agenda: 'Agenda',
                      date: 'Fecha',
                      time: 'Hora',
                      event: 'Evento',
                      noEventsInRange: 'Sin mantenimientos en este período',
                      showMore: (count) => `+${count} más`,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </SectionWrapper>

      {/* Legend for calendar */}
      {view === 'calendar' && calendarEvents.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
          {Object.entries(STATUS_STYLES).map(([status, style]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: style.bg, borderLeft: `3px solid ${style.border}` }}
              />
              {MAINTENANCE_STATUS_LABELS[status as MaintenanceStatus]}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar mantenimiento' : 'Nueva orden de mantenimiento'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Activo *</Label>
              <select
                value={form.assetId}
                onChange={(e) => f('assetId', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccionar activo...</option>
                {assets.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Tipo</Label>
              <select
                value={form.type}
                onChange={(e) => f('type', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MAINTENANCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Prioridad</Label>
              <select
                value={form.priority}
                onChange={(e) => f('priority', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Estado</Label>
              <select
                value={form.status}
                onChange={(e) => f('status', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {MAINTENANCE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Fecha programada</Label>
              <Input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => f('scheduledDate', e.target.value)}
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Técnico asignado</Label>
              <select
                value={form.technicianId}
                onChange={(e) => f('technicianId', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Sin asignar</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                Checklist {assetCategoryId ? `(${filteredChecklists.length} disponibles)` : ''}
              </Label>
              <select
                value={form.checklistId}
                onChange={(e) => f('checklistId', e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Sin checklist</option>
                {filteredChecklists.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {assetCategoryId && filteredChecklists.length === 0 && (
                <p className="text-[10px] text-slate-400">No hay checklists configurados para esta categoría</p>
              )}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => f('description', e.target.value)}
                placeholder="Descripción del trabajo a realizar..."
                rows={3}
                className="text-sm rounded-xl"
              />
            </div>

            {/* Datos del checklist completado */}
            {editing?.status === 'COMPLETED' && editing?.checklist && (() => {
              let responses: Record<string, any> = {};
              try {
                responses = editing.checklistData
                  ? (typeof editing.checklistData === 'string' ? JSON.parse(editing.checklistData) : editing.checklistData)
                  : {};
              } catch { return null; }
              const items = editing.checklist.items || [];
              if (Object.keys(responses).length === 0) return null;
              return (
                <div className="col-span-2 border-t border-slate-200 pt-4 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark size={14} className="text-emerald-500" />
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Checklist completado: {editing.checklist.name}
                    </Label>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    {items.map((item: any) => {
                      const value = responses[item.id];
                      if (value === undefined || value === '') return null;
                      return (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">{item.label}</span>
                          <span className="text-slate-800 font-semibold">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {editing.diagnosis && (
                    <div className="mt-3 bg-amber-50 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-600 font-medium">Diagnóstico</span>
                        <span className="text-slate-800">{editing.diagnosis}</span>
                      </div>
                      {editing.solution && (
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-600 font-medium">Solución</span>
                          <span className="text-slate-800">{editing.solution}</span>
                        </div>
                      )}
                      {editing.cost != null && editing.cost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-600 font-medium">Costo</span>
                          <span className="text-slate-800">${Number(editing.cost).toLocaleString('es-CO')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
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
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completar mantenimiento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            {completeDialog?.asset?.name} · {completeDialog?.code}
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Diagnóstico</Label>
              <Textarea
                value={completeForm.diagnosis}
                onChange={(e) => setCompleteForm((p) => ({ ...p, diagnosis: e.target.value }))}
                placeholder="Describe el diagnóstico realizado..."
                rows={3}
                className="text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Solución aplicada</Label>
              <Textarea
                value={completeForm.solution}
                onChange={(e) => setCompleteForm((p) => ({ ...p, solution: e.target.value }))}
                placeholder="Describe la solución implementada..."
                rows={3}
                className="text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Costo (COP)</Label>
              <Input
                type="number"
                value={completeForm.cost}
                onChange={(e) => setCompleteForm((p) => ({ ...p, cost: e.target.value }))}
                placeholder="0.00"
                className="h-9 rounded-xl text-sm"
              />
            </div>

            {/* Checklist dinámico */}
            {completeDialog?.checklist && completeDialog.checklist.items && completeDialog.checklist.items.length > 0 && (
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark size={14} className="text-blue-500" />
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Checklist: {completeDialog.checklist.name}
                  </Label>
                </div>
                <div className="space-y-3">
                  {completeDialog.checklist.items
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((item: any) => (
                      <div key={item.id} className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600">
                          {item.label}
                          {item.required && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>
                        {item.description && (
                          <p className="text-[10px] text-slate-400">{item.description}</p>
                        )}
                        {renderChecklistItem(item)}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCompleteDialog(null)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-sm gap-1.5"
            >
              <CheckCircle size={14} /> Marcar completado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
