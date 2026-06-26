'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { maintenanceApi, ticketsApi } from '@/lib/api';
import {
  Maintenance,
  Ticket,
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  PRIORITY_LABELS,
} from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Ticket as TicketIcon, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function MisOrdenesPage() {
  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const { data: maintenances = [], isLoading: loadingMaint } = useQuery({
    queryKey: ['mis-ordenes-maint'],
    queryFn: async () => {
      const r = await maintenanceApi.list({ technicianId: user?.id || '', limit: '50' });
      return r.data as Maintenance[];
    },
    enabled: !!user?.id,
  });

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['mis-ordenes-tickets'],
    queryFn: async () => {
      const r = await ticketsApi.list({ assigneeId: user?.id || '', limit: '50' });
      return r.data as Ticket[];
    },
    enabled: !!user?.id,
  });

  const activeMaintenances = maintenances.filter(
    (m) => !['COMPLETED', 'CANCELLED'].includes(m.status),
  );
  const activeTickets = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status));

  if (!user) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader
        title="Mis Órdenes"
        subtitle={`Órdenes y tickets asignados a ${user.name?.split(' ')[0] || 'ti'}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Mantenimientos activos',
            value: activeMaintenances.length,
            icon: Wrench,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Tickets activos',
            value: activeTickets.length,
            icon: TicketIcon,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Mantenimientos completados',
            value: maintenances.filter((m) => m.status === 'COMPLETED').length,
            icon: ClipboardList,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Tickets resueltos',
            value: tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length,
            icon: ClipboardList,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-slate-100 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`${kpi.bg} ${kpi.color} w-9 h-9 rounded-xl flex items-center justify-center`}
              >
                <kpi.icon size={16} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-400">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ordenes de mantenimiento asignadas */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Wrench size={15} className="text-amber-500" />
          Órdenes de Mantenimiento Asignadas
          <span className="text-xs text-slate-400 font-normal">({maintenances.length} total)</span>
        </h3>

        {loadingMaint ? (
          <LoadingSpinner />
        ) : maintenances.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Sin órdenes asignadas"
            subtitle="No tienes órdenes de mantenimiento asignadas"
          />
        ) : (
          <div className="grid gap-2">
            {maintenances.map((m) => {
              const isOverdue =
                m.scheduledDate &&
                new Date(m.scheduledDate) < new Date() &&
                !['COMPLETED', 'CANCELLED'].includes(m.status);
              return (
                <Link key={m.id} href={`/dashboard/maintenance`} className="block">
                  <Card
                    className={`border-slate-100 rounded-2xl hover:shadow-md transition-all ${isOverdue ? 'bg-red-50/30 border-red-100' : ''}`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          m.type === 'CORRECTIVE'
                            ? 'bg-red-50 text-red-500'
                            : m.type === 'PREVENTIVE'
                              ? 'bg-blue-50 text-blue-500'
                              : 'bg-purple-50 text-purple-500'
                        }`}
                      >
                        <Wrench size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400">{m.code}</span>
                          <StatusBadge status={m.status} />
                          <StatusBadge status={m.priority} />
                        </div>
                        <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">
                          {m.asset?.name || '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {MAINTENANCE_TYPE_LABELS[m.type]}
                          {m.scheduledDate
                            ? ` · ${new Date(m.scheduledDate).toLocaleDateString('es-CO')}`
                            : ''}
                          {isOverdue ? ' · ⚠️ Vencida' : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Tickets asignados */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <TicketIcon size={15} className="text-blue-500" />
          Tickets Asignados
          <span className="text-xs text-slate-400 font-normal">({tickets.length} total)</span>
        </h3>

        {loadingTickets ? (
          <LoadingSpinner />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={TicketIcon}
            title="Sin tickets asignados"
            subtitle="No tienes tickets asignados"
          />
        ) : (
          <div className="grid gap-2">
            {tickets.map((t) => (
              <Link key={t.id} href={`/dashboard/tickets`} className="block">
                <Card className="border-slate-100 rounded-2xl hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                      <TicketIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{t.code}</span>
                        <StatusBadge status={t.status} />
                        <StatusBadge status={t.priority} />
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">
                        {t.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {TICKET_CATEGORY_LABELS[t.category]}
                        {t.createdAt
                          ? ` · ${new Date(t.createdAt).toLocaleDateString('es-CO')}`
                          : ''}
                        {t.asset ? ` · ${t.asset.name}` : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
