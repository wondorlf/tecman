'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi } from '@/lib/api';
import { User } from '@/lib/types';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Users, Pencil, ToggleLeft, ToggleRight, Shield } from 'lucide-react';

const EMPTY = { name: '', email: '', password: '', phone: '', roleId: '' };

export default function UsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await usersApi.list();
      return (r.data as any).data as User[];
    },
  });
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const r = await rolesApi.list();
      return r.data as any[];
    },
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', roleId: u.roleId });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!editing && !form.password)) {
      toast({ title: 'Nombre, email y contraseña son requeridos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        roleId: form.roleId || undefined,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        await usersApi.update(editing.id, payload);
        toast({ title: 'Usuario actualizado' });
      } else {
        await usersApi.create(payload);
        toast({ title: 'Usuario creado' });
      }
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (u: User) => {
    try {
      await usersApi.toggle(u.id);
      toast({ title: u.active ? 'Usuario desactivado' : 'Usuario activado' });
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const active = users.filter((u) => u.active).length;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Usuarios"
        subtitle={`${active} activos de ${users.length} en total`}
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nuevo usuario
          </Button>
        }
      />

      <Card className="border-slate-100 rounded-2xl mb-4">
        <CardContent className="p-3 flex flex-wrap gap-3 items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o email..."
            className="w-full sm:w-72"
          />
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin usuarios"
          subtitle="Crea el primer usuario con el botón de arriba"
        />
      ) : (
        <Card className="border-slate-100 rounded-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Rol</TableHead>
                <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>{' '}
            <TableBody>
              {filtered.map((u) => (
                <TableRow
                  key={u.id}
                  onClick={() => openEdit(u)}
                  className="cursor-pointer hover:bg-blue-50/20 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500">
                    {u.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                      <Shield size={10} />
                      {u.role?.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                    {u.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(u);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(u);
                        }}
                        title={u.active ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.active
                            ? 'hover:bg-red-50 hover:text-red-500'
                            : 'hover:bg-emerald-50 hover:text-emerald-600'
                        } text-slate-400`}
                      >
                        {u.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre completo *</Label>
              <Input
                value={form.name}
                onChange={(e) => f('name', e.target.value)}
                placeholder="Juan García"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Correo electrónico *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => f('email', e.target.value)}
                placeholder="juan@empresa.com"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                {editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => f('password', e.target.value)}
                placeholder="••••••••"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => f('phone', e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Rol</Label>
                <select
                  value={form.roleId}
                  onChange={(e) => f('roleId', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Sin rol</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
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
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
