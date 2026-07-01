'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, alertsApi, maintenanceApi } from '@/lib/api';
import {
  Package,
  Wrench,
  Bell,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ASSET_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
  PRIORITY_LABELS,
  type Alert,
  type Maintenance,
} from '@/lib/types';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  MAINTENANCE: '#f59e0b',
  INACTIVE: '#94a3b8',
  DISPOSED: '#ef4444',
  RESERVED: '#6366f1',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await dashboardApi.stats();
      return res.data;
    },
  });

  // Calcular tendencias
  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return { direction: current > 0 ? 'up' : 'neutral', pct: 100 };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral', pct: Math.abs(pct) };
  };

  const trendAssets = stats?.comparison
    ? calcTrend(stats.comparison.assetsCreated.current, stats.comparison.assetsCreated.previous)
    : null;
  const trendTickets = stats?.comparison
    ? calcTrend(stats.comparison.ticketsCreated.current, stats.comparison.ticketsCreated.previous)
    : null;
  const trendMaint = stats?.comparison
    ? calcTrend(stats.comparison.maintCompleted.current, stats.comparison.maintCompleted.previous)
    : null;
  const trendResolved = stats?.comparison
    ? calcTrend(stats.comparison.ticketsResolved.current, stats.comparison.ticketsResolved.previous)
    : null;

  const { data: alerts } = useQuery({
    queryKey: ['alerts-recent'],
    queryFn: async () => {
      const res = await alertsApi.list({ resolved: 'false', limit: '5' });
      return res.data as Alert[];
    },
  });

  const { data: maintenances } = useQuery({
    queryKey: ['maintenance-upcoming'],
    queryFn: async () => {
      const res = await maintenanceApi.list({ status: 'PENDING' });
      return (res.data as Maintenance[]).slice(0, 5);
    },
  });

  const user = (() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const statCards = [
    {
      title: 'Total Activos',
      value: stats?.assetsCount ?? 0,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/dashboard/assets',
      trend: stats?.comparison ? `${stats.comparison.assetsCreated.current} nuevos este mes` : '—',
      trendData: trendAssets,
    },
    {
      title: 'Mantenimientos',
      value: stats?.pendingMaint ?? 0,
      icon: Wrench,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/dashboard/maintenance',
      trend: 'pendientes',
      trendData: null,
    },
    {
      title: 'Tickets creados',
      value: stats?.comparison?.ticketsCreated?.current ?? 0,
      icon: Bell,
      color: 'text-red-500',
      bg: 'bg-red-50',
      href: '/dashboard/tickets',
      trend: 'este mes',
      trendData: trendTickets,
    },
    {
      title: 'Resueltos',
      value: stats?.comparison?.ticketsResolved?.current ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/dashboard/tickets',
      trend: 'este mes',
      trendData: trendResolved,
    },
  ];

  const assetsByStatus =
    stats?.assetsByStatus?.map((s: any) => ({
      name: ASSET_STATUS_LABELS[s.status as keyof typeof ASSET_STATUS_LABELS] || s.status,
      value: s._count?.status ?? s.count ?? 0,
      color: STATUS_COLORS[s.status] || '#94a3b8',
    })) || [];

  const maintByType =
    stats?.maintenanceByType?.map((m: any) => ({
      name: MAINTENANCE_TYPE_LABELS[m.type as keyof typeof MAINTENANCE_TYPE_LABELS] || m.type,
      total: m._count?.type ?? m.count ?? 0,
    })) || [];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Hola, {user?.name?.split(' ')[0] || 'usuario'} 👋
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
          <TrendingUp size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-700">{user?.role?.name || 'Sistema'}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) =>
          statsLoading ? (
            <Skeleton key={card.title} className="h-32" />
          ) : (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-100 rounded-2xl">
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {card.title}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1 hidden sm:block">{card.trend}</p>
                      {card.trendData && (
                        <p
                          className={`text-xs mt-0.5 flex items-center gap-0.5 ${
                            card.trendData.direction === 'up'
                              ? 'text-emerald-600'
                              : card.trendData.direction === 'down'
                                ? 'text-red-500'
                                : 'text-slate-400'
                          }`}
                        >
                          {card.trendData.direction === 'up' ? (
                            <ArrowUpRight size={11} />
                          ) : card.trendData.direction === 'down' ? (
                            <ArrowDownRight size={11} />
                          ) : (
                            <Minus size={11} />
                          )}
                          {card.trendData.pct}% vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className={`${card.bg} ${card.color} p-2.5 rounded-xl`}>
                      <card.icon size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ),
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Assets by status */}
        <Card className="lg:col-span-2 border-slate-100 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Activos por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assetsByStatus.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={140}>
                  <PieChart>
                    <Pie
                      data={assetsByStatus}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      innerRadius={30}
                    >
                      {assetsByStatus.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'Activos']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {assetsByStatus.map((s: any) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: s.color }}
                      />
                      <span className="text-xs text-slate-500 flex-1">{s.name}</span>
                      <span className="text-xs font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-slate-400 text-sm">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance by type */}
        <Card className="lg:col-span-3 border-slate-100 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Mantenimientos por tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {maintByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={maintByType} barSize={32}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-slate-400 text-sm">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent alerts */}
        <Card className="border-slate-100 rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" />
              Alertas recientes
            </CardTitle>
            <Link
              href="/dashboard/alerts"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts && alerts.length > 0 ? (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      a.priority === 'CRITICAL'
                        ? 'bg-red-500'
                        : a.priority === 'HIGH'
                          ? 'bg-orange-400'
                          : a.priority === 'MEDIUM'
                            ? 'bg-amber-400'
                            : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                    {a.asset ? (
                      <a
                        href={`/dashboard/assets/${a.asset.id}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        {a.asset.name}
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400">—</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      a.priority === 'CRITICAL'
                        ? 'destructive'
                        : a.priority === 'HIGH'
                          ? 'warning'
                          : 'secondary'
                    }
                    className="shrink-0"
                  >
                    {PRIORITY_LABELS[a.priority]}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 size={32} className="text-emerald-300 mb-2" />
                <p className="text-sm">Sin alertas pendientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming maintenance */}
        <Card className="border-slate-100 rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock size={15} className="text-amber-400" />
              Mantenimientos pendientes
            </CardTitle>
            <Link
              href="/dashboard/maintenance"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {maintenances && maintenances.length > 0 ? (
              maintenances.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      m.type === 'CORRECTIVE'
                        ? 'bg-red-50'
                        : m.type === 'PREVENTIVE'
                          ? 'bg-blue-50'
                          : 'bg-purple-50'
                    }`}
                  >
                    <Wrench
                      size={14}
                      className={
                        m.type === 'CORRECTIVE'
                          ? 'text-red-500'
                          : m.type === 'PREVENTIVE'
                            ? 'text-blue-500'
                            : 'text-purple-500'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {m.asset ? (
                      <a
                        href={`/dashboard/assets/${m.asset.id}`}
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors truncate block"
                      >
                        {m.asset.name}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-800 truncate">—</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {MAINTENANCE_TYPE_LABELS[m.type]}
                      {m.scheduledDate
                        ? ` · ${new Date(m.scheduledDate).toLocaleDateString('es-CO')}`
                        : ''}
                    </p>
                  </div>
                  <Badge variant="warning" className="shrink-0 text-xs">
                    Pendiente
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 size={32} className="text-emerald-300 mb-2" />
                <p className="text-sm">Todo al día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
