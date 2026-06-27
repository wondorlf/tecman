'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import { Alert, ALERT_TYPE_LABELS } from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { SearchBar } from '@/components/shared/search-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Bell, CheckCircle2, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AlertsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'all' | 'resolved'>('active');
  const [resolving, setResolving] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', filter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filter === 'active') params.resolved = 'false';
      if (filter === 'resolved') params.resolved = 'true';
      const r = await alertsApi.list(params);
      return (r.data as any).data as Alert[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return alerts;
    return alerts.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        (a.asset?.name?.toLowerCase().includes(q) ?? false),
    );
  }, [alerts, search]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await alertsApi.resolve(id);
      toast({ title: 'Alerta resuelta' });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['alerts-unresolved'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setResolving(null);
    }
  };

  const PRIORITY_RING: Record<string, string> = {
    CRITICAL: 'border-l-4 border-red-500',
    HIGH: 'border-l-4 border-orange-400',
    MEDIUM: 'border-l-4 border-amber-300',
    LOW: 'border-l-4 border-slate-200',
  };

  const kpis = [
    {
      label: 'Total',
      value: alerts.length,
      icon: Bell,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
    },
    {
      label: 'Críticas',
      value: alerts.filter((a) => a.priority === 'CRITICAL' && !a.resolved).length,
      icon: ShieldAlert,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Altas',
      value: alerts.filter((a) => a.priority === 'HIGH' && !a.resolved).length,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      label: 'Con vencimiento',
      value: alerts.filter((a) => !!a.dueDate && !a.resolved).length,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="max-w-4xl">
      <PageHeader title="Alertas" subtitle="Monitoreo de condiciones críticas y vencimientos" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-slate-100 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`${k.bg} ${k.color} w-9 h-9 rounded-xl flex items-center justify-center`}
              >
                <k.icon size={16} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                <p className="text-xs text-slate-400">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-100 rounded-2xl mb-4">
        <CardContent className="p-3 flex flex-wrap gap-3 items-center">
          <SearchBar
            id="search-alerts"
            value={search}
            onChange={setSearch}
            placeholder="Buscar alertas..."
            className="w-64"
          />
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {(['active', 'all', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 h-9 text-sm font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f === 'active' ? 'Activas' : f === 'all' ? 'Todas' : 'Resueltas'}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={filter === 'active' ? 'Sin alertas activas' : 'Sin alertas'}
          subtitle="Todo en orden 🎉"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card
              key={a.id}
              className={`border-slate-100 rounded-2xl overflow-hidden ${PRIORITY_RING[a.priority] || ''} ${
                a.resolved ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    a.priority === 'CRITICAL'
                      ? 'bg-red-50 text-red-500'
                      : a.priority === 'HIGH'
                        ? 'bg-orange-50 text-orange-500'
                        : a.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-500'
                          : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-800">{a.title}</h3>
                    <StatusBadge status={a.priority} />
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {ALERT_TYPE_LABELS[a.type]}
                    </span>
                    {a.resolved && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                        Resuelta
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{a.message}</p>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {a.asset && (
                      <Link
                        href={`/dashboard/assets/${a.asset.id}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        {a.asset.name}
                      </Link>
                    )}
                    {a.dueDate && (
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          new Date(a.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'
                        }`}
                      >
                        <Clock size={11} />
                        {new Date(a.dueDate).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>
                {!a.resolved && (
                  <Button
                    onClick={() => handleResolve(a.id)}
                    disabled={resolving === a.id}
                    variant="outline"
                    className="shrink-0 h-8 px-3 text-xs rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    {resolving === a.id ? (
                      '...'
                    ) : (
                      <>
                        <CheckCircle2 size={13} className="mr-1" />
                        Resolver
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
