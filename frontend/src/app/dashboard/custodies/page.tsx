'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { custodiesApi, assetsApi, usersApi } from '@/lib/api';
import { Custody, Asset, User, PaginatedResponse } from '@/lib/types';
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
  UserCheck,
  CornerUpLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Package,
} from 'lucide-react';

export default function CustodiesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('true'); // "true", "false", "all"
  const [page, setPage] = useState(1);

  // Modales
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState<Custody | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulario Asignación
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Formulario Devolución
  const [returnNotes, setReturnNotes] = useState('');

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const queryParams: Record<string, string | number> = { page, limit: 15 };
  if (search) queryParams.search = search;
  if (activeFilter !== 'all') queryParams.active = activeFilter;

  const { data: response, isLoading } = useQuery({
    queryKey: ['custodies', page, search, activeFilter],
    queryFn: async () => {
      const r = await custodiesApi.list(queryParams);
      return r.data as PaginatedResponse<Custody>;
    },
  });
  const custodies = response?.data ?? [];
  const meta = response?.meta ?? { total: 0, page: 1, limit: 15, totalPages: 1 };

  // Cargar activos y usuarios para el modal (idealmente usaríamos un Select con búsqueda)
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

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedAsset || !selectedUser) {
      toast({
        title: 'Faltan datos',
        description: 'Selecciona el activo y el usuario.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await custodiesApi.assign({ assetId: selectedAsset, userId: selectedUser, notes });
      toast({ title: 'Activo asignado exitosamente' });
      setAssignOpen(false);
      setSelectedAsset('');
      setSelectedUser('');
      setNotes('');
      qc.invalidateQueries({ queryKey: ['custodies'] });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.response?.data?.message || 'No se pudo asignar.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnOpen) return;
    setSaving(true);
    try {
      await custodiesApi.returnAsset(returnOpen.id, returnNotes);
      toast({ title: 'Activo devuelto exitosamente' });
      setReturnOpen(null);
      setReturnNotes('');
      qc.invalidateQueries({ queryKey: ['custodies'] });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: 'No se pudo procesar la devolución.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Asignaciones"
        subtitle={`${meta.total} registros de custodia`}
        action={
          <Button
            onClick={() => setAssignOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm font-medium gap-1.5"
          >
            <Plus size={15} /> Asignar Activo
          </Button>
        }
      />

      <Card className="border-slate-100 rounded-2xl mb-4">
        <CardContent className="p-3 flex flex-wrap gap-3 items-center">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Buscar por equipo, código o usuario..."
            className="w-72"
          />

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">Todas las asignaciones</option>
            <option value="true">Solo activas (En uso)</option>
            <option value="false">Histórico (Devueltas)</option>
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : custodies.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No hay asignaciones"
          subtitle="Aún no se ha entregado ningún activo a los usuarios."
        />
      ) : (
        <Card className="border-slate-100 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Activo</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha Asignación</TableHead>
                <TableHead>Fecha Devolución</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custodies.map((c) => {
                const isActive = !c.returnedAt;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{c.asset?.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{c.asset?.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{c.user?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(c.assignedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {c.returnedAt ? new Date(c.returnedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          En uso
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          Devuelto
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReturnOpen(c)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <CornerUpLeft size={14} className="mr-1.5" /> Devolver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Paginación */}
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

      {/* Modal: Asignar Activo */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Activo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Seleccionar Activo *</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccione un activo...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Asignar a Usuario *</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccione un usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Notas de entrega</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Estado del equipo, accesorios incluidos..."
                className="text-sm rounded-xl"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignOpen(false)}
              className="rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={saving}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-9"
            >
              {saving ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Devolver Activo */}
      <Dialog open={!!returnOpen} onOpenChange={() => setReturnOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Devolución de Activo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <p className="text-sm text-slate-600">
              Registrar la devolución del activo <strong>{returnOpen?.asset?.name}</strong>{' '}
              entregado a <strong>{returnOpen?.user?.name}</strong>.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Notas de recepción</label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Observaciones sobre el estado en el que se devuelve (daños, faltantes)..."
                className="text-sm rounded-xl"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnOpen(null)}
              className="rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReturn}
              disabled={saving}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-9"
            >
              {saving ? 'Procesando...' : 'Confirmar Devolución'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
