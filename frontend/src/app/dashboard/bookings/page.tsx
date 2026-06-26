'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, assetsApi, usersApi } from '@/lib/api';
import { Booking, Asset, User, PaginatedResponse, BookingStatus } from '@/lib/types';
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
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  CornerDownLeft,
  XCircle,
} from 'lucide-react';

export default function BookingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [openCreate, setOpenCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulario de reserva
  const [form, setForm] = useState({
    assetId: '',
    userId: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Queries
  const queryParams: Record<string, string | number> = { page, limit: 15 };
  if (statusFilter !== 'ALL') queryParams.status = statusFilter;

  const { data: response, isLoading } = useQuery({
    queryKey: ['bookings', page, statusFilter],
    queryFn: async () => {
      const r = await bookingsApi.list(queryParams);
      return r.data as PaginatedResponse<Booking>;
    },
  });
  const bookings = response?.data ?? [];
  const meta = response?.meta ?? { total: 0, page: 1, limit: 15, totalPages: 1 };

  const { data: assets = [] } = useQuery({
    queryKey: ['assets-list'],
    queryFn: async () => {
      const r = await assetsApi.list({ limit: 500 });
      return r.data.data as Asset[];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const r = await usersApi.list({ active: 'true', limit: 500 });
      return r.data.data as User[];
    },
  });

  const handleCreate = async () => {
    if (!form.assetId || !form.userId || !form.startDate || !form.endDate) {
      toast({
        title: 'Datos incompletos',
        description: 'Llena todos los campos obligatorios.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await bookingsApi.create(form);
      toast({ title: 'Reserva creada exitosamente' });
      setOpenCreate(false);
      setForm({ assetId: '', userId: '', startDate: '', endDate: '', notes: '' });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.response?.data?.message || 'Hubo un conflicto con otra reserva.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      await bookingsApi.updateStatus(id, status);
      toast({ title: 'Estado actualizado' });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    } catch (e) {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const maps: Record<BookingStatus, { label: string; color: string }> = {
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
      CHECKED_OUT: { label: 'En uso', color: 'bg-green-100 text-green-800' },
      RETURNED: { label: 'Devuelto', color: 'bg-slate-100 text-slate-800' },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    };
    const s = maps[status];
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Reservas"
        subtitle="Agendamiento de uso de equipos"
        action={
          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm font-medium gap-1.5"
          >
            <Plus size={15} /> Nueva Reserva
          </Button>
        }
      />

      <Card className="border-slate-100 rounded-2xl mb-4">
        <CardContent className="p-3">
          <select
            id="filter-status"
            name="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="CHECKED_OUT">En uso (Checked out)</option>
            <option value="RETURNED">Devueltos</option>
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No hay reservas"
          subtitle="Crea la primera reserva para agendar un equipo."
        />
      ) : (
        <Card className="border-slate-100 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Activo</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-slate-800">{b.asset?.name}</TableCell>
                  <TableCell className="text-slate-600">{b.user?.name}</TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {new Date(b.startDate).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {new Date(b.endDate).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(b.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {b.status === 'PENDING' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(b.id, 'CONFIRMED')}
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            title="Confirmar"
                          >
                            <CheckCircle2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(b.id, 'CANCELLED')}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            title="Cancelar"
                          >
                            <XCircle size={16} />
                          </Button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(b.id, 'CHECKED_OUT')}
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                          title="Entregar equipo (Check-out)"
                        >
                          <Play size={16} />
                        </Button>
                      )}
                      {b.status === 'CHECKED_OUT' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(b.id, 'RETURNED')}
                          className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100"
                          title="Recibir equipo (Return)"
                        >
                          <CornerDownLeft size={16} />
                        </Button>
                      )}
                    </div>
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

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Activo *</label>
              <select
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccione...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Usuario *</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Inicio *</label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Fin *</label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="h-9 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Notas</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-xl"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenCreate(false)}
              className="rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-9"
            >
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
