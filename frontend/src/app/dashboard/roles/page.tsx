'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/lib/api';
import { Role } from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { SectionWrapper, StaggeredItem } from '@/components/shared/section-wrapper';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Pencil, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MODULES: Record<string, { label: string; actions: { key: string; label: string }[] }> = {
  assets: {
    label: 'Activos',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  maintenance: {
    label: 'Mantenimiento',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  documents: {
    label: 'Documentos',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  tickets: {
    label: 'Tickets',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  checklists: {
    label: 'Checklists',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  users: {
    label: 'Usuarios',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  alerts: {
    label: 'Alertas',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
  reports: {
    label: 'Reportes',
    actions: [
      { key: 'read', label: 'Ver' },
      { key: 'export', label: 'Exportar' },
    ],
  },
  knowledge: {
    label: 'Base Conocimiento',
    actions: [
      { key: 'create', label: 'Crear' },
      { key: 'read', label: 'Ver' },
      { key: 'update', label: 'Editar' },
      { key: 'delete', label: 'Eliminar' },
    ],
  },
};

export default function RolesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPerms, setEditPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [editAdmin, setEditAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const r = await rolesApi.list();
      return r.data as Role[];
    },
  });

  const openEdit = (role: Role) => {
    setEditRole(role);
    setEditName(role.name);
    setEditDescription(role.description || '');
    const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions || '{}') : (role.permissions || {});
    const modulePerms: Record<string, Record<string, boolean>> = {};
    let isAdmin = false;
    for (const [key, val] of Object.entries(perms)) {
      if (key === 'admin' && val === true) {
        isAdmin = true;
      } else if (typeof val === 'object' && val !== null) {
        modulePerms[key] = val as Record<string, boolean>;
      }
    }
    setEditPerms(modulePerms);
    setEditAdmin(isAdmin);
  };

  const togglePerm = (mod: string, action: string) => {
    setEditPerms((prev) => {
      const current = prev[mod] || {};
      return { ...prev, [mod]: { ...current, [action]: !current[action] } };
    });
  };

  const handleSave = async () => {
    if (!editRole) return;
    setSaving(true);
    try {
      const perms: Record<string, any> = { ...editPerms };
      if (editAdmin) perms.admin = true;
      await rolesApi.update(editRole.id, {
        name: editName,
        description: editDescription,
        permissions: JSON.stringify(perms),
      });
      toast({ title: 'Rol actualizado' });
      qc.invalidateQueries({ queryKey: ['roles'] });
      setEditRole(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Roles y Permisos"
        subtitle="Gestionar los roles y permisos del sistema"
      />

      <SectionWrapper>
        {isLoading ? (
          <LoadingSpinner />
        ) : roles.length === 0 ? (
          <EmptyState icon={Shield} title="Sin roles" subtitle="No hay roles configurados" />
        ) : (
          <div className="grid gap-3">
            {roles.map((role) => (
              <StaggeredItem key={role.id} index={0}>
                <Card className="border-slate-100 rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Shield size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{role.name}</p>
                      <p className="text-xs text-slate-400">{role.description || 'Sin descripción'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Users size={13} />
                      <span>{role._count?.users || 0} usuario{(role._count?.users || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => openEdit(role)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                  </CardContent>
                </Card>
              </StaggeredItem>
            ))}
          </div>
        )}
      </SectionWrapper>

      {/* Edit Dialog */}
      <Dialog open={!!editRole} onOpenChange={(o) => !o && setEditRole(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Rol: {editRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nombre</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="text-sm rounded-xl"
              />
            </div>

            {/* Admin toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <input
                type="checkbox"
                checked={editAdmin}
                onChange={(e) => setEditAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-700">Administrador total</p>
                <p className="text-xs text-slate-400">Otorga acceso completo a todos los módulos</p>
              </div>
            </div>

            {/* Granular permissions */}
            {!editAdmin && (
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Permisos por módulo
                </Label>
                {Object.entries(MODULES).map(([modKey, mod]) => (
                  <div key={modKey} className="border border-slate-100 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-700 mb-2">{mod.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {mod.actions.map((act) => {
                        const checked = editPerms[modKey]?.[act.key] === true;
                        return (
                          <button
                            key={act.key}
                            type="button"
                            onClick={() => togglePerm(modKey, act.key)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              checked
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {act.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditRole(null)} className="rounded-xl h-9 text-sm">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
