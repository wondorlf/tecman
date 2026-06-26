'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { changeRequestsApi, ticketsApi, usersApi } from '@/lib/api';
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
  GitPullRequest,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente aprobación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  IMPLEMENTED: 'Implementado',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  IMPLEMENTED: 'bg-blue-100 text-blue-700',
};
const RISK_LABELS: Record<string, string> = {
  LOW: 'Bajo',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
};
const RISK_COLORS: Record<string, string> = {
  LOW: 'text-slate-500',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-500',
};

export default function ChangeRequestsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    justification: '',
    riskLevel: 'MEDIUM',
    requesterId: '',
    ticketId: '',
  });
  const [saving, setSaving] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ rfc: any } | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    scheduledStart: '',
    scheduledEnd: '',
  });

  const queryParams: Record<string, string | number> = { page, limit: 20 };
  if (statusFilter !== 'ALL') queryParams.status = statusFilter;

  const { data: response, isLoading } = useQuery({
    queryKey: ['change-requests', page, statusFilter],
    queryFn: async () => {
      const r = await changeRequestsApi.list(queryParams);
      return r.data as any;
    },
  });
  const rfcList: any[] = response?.data ?? response ?? [];
  const meta = response?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets-simple'],
    queryFn: async () => {
      const r = await ticketsApi.list({ limit: 200 });
      return (r.data as any)?.data ?? (r.data as any[]);
    },
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await usersApi.list();
      return r.data as any[];
    },
  });

  const openCreate = () => {
    setForm({
      title: '',
      description: '',
      justification: '',
      riskLevel: 'MEDIUM',
      requesterId: '',
      ticketId: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.justification) {
      toast({ title: 'Completa todos los campos requeridos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        ticketId: form.ticketId || undefined,
        requesterId: form.requesterId || undefined,
      };
      await changeRequestsApi.create(payload);
      toast({ title: 'RFC creado' });
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openStatusUpdate = (rfc: any) => {
    setStatusDialog({ rfc });
    setStatusForm({ status: rfc.status, scheduledStart: '', scheduledEnd: '' });
  };

  const handleStatusUpdate = async () => {
    if (!statusDialog) return;
    try {
      await changeRequestsApi.updateStatus(statusDialog.rfc.id, statusForm.status, {
        start: statusForm.scheduledStart || undefined,
        end: statusForm.scheduledEnd || undefined,
      });
      toast({ title: 'Estado actualizado' });
      qc.invalidateQueries({ queryKey: ['change-requests'] });
      setStatusDialog(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Gestión de Cambios (RFC)"
        subtitle="Solicitudes de cambio con flujo de aprobación"
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nuevo RFC
          </Button>
        }
      />

      <Card className="border-slate-100 rounded-2xl mb-4">
        <CardContent className="p-3 flex gap-3 items-center">
          <select
            id="filter-rfc-status"
            name="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="ALL">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-slate-400">
            {meta.total} RFC{meta.total !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : !Array.isArray(rfcList) || rfcList.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="Sin solicitudes de cambio"
          subtitle="Crea la primera solicitud RFC"
        />
      ) : (
        <Card className="border-slate-100 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Riesgo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Solicitante</TableHead>
                <TableHead className="hidden lg:table-cell">Creado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfcList.map((rfc: any) => (
                <TableRow key={rfc.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{rfc.code}</TableCell>
                  <TableCell className="font-medium text-slate-800 max-w-[250px] truncate">
                    {rfc.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${RISK_COLORS[rfc.riskLevel] || ''}`}
                    >
                      <AlertTriangle size={12} /> {RISK_LABELS[rfc.riskLevel] || rfc.riskLevel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[rfc.status] || 'bg-slate-100 text-slate-600'}`}
                    >
                      {STATUS_LABELS[rfc.status] || rfc.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                    {rfc.requester?.name || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                    {new Date(rfc.createdAt).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => openStatusUpdate(rfc)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Actualizar estado"
                    >
                      <Eye size={15} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl h-8 px-3 text-xs gap-1"
          >
            <ChevronLeft size={14} /> Anterior
          </Button>
          <span className="text-sm text-slate-500">
            Página {meta.page} de {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl h-8 px-3 text-xs gap-1"
          >
            Siguiente <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Create RFC Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Cambio (RFC)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ej. Migración de servidor de correo"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Nivel de riesgo</Label>
                <select
                  value={form.riskLevel}
                  onChange={(e) => setForm((p) => ({ ...p, riskLevel: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {Object.entries(RISK_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Solicitante</Label>
                <select
                  value={form.requesterId}
                  onChange={(e) => setForm((p) => ({ ...p, requesterId: e.target.value }))}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Seleccionar...</option>
                  {Array.isArray(users) &&
                    users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Ticket relacionado</Label>
              <select
                value={form.ticketId}
                onChange={(e) => setForm((p) => ({ ...p, ticketId: e.target.value }))}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Sin ticket</option>
                {Array.isArray(tickets) &&
                  tickets.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.code} - {t.title}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="text-sm rounded-xl"
                placeholder="Describe el cambio propuesto..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Justificación *</Label>
              <Textarea
                value={form.justification}
                onChange={(e) => setForm((p) => ({ ...p, justification: e.target.value }))}
                rows={3}
                className="text-sm rounded-xl"
                placeholder="Explica por qué es necesario este cambio..."
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
              {saving ? 'Creando...' : 'Crear RFC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar RFC {statusDialog?.rfc?.code}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 -mt-1">{statusDialog?.rfc?.title}</p>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nuevo estado</Label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            {(statusForm.status === 'APPROVED' || statusForm.status === 'IMPLEMENTED') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Inicio programado</Label>
                  <Input
                    type="date"
                    value={statusForm.scheduledStart}
                    onChange={(e) =>
                      setStatusForm((p) => ({ ...p, scheduledStart: e.target.value }))
                    }
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Fin programado</Label>
                  <Input
                    type="date"
                    value={statusForm.scheduledEnd}
                    onChange={(e) => setStatusForm((p) => ({ ...p, scheduledEnd: e.target.value }))}
                    className="h-9 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setStatusDialog(null)}
              className="rounded-xl h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              Actualizar estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
