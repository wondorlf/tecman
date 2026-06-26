'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, alertsApi, maintenanceApi, ticketsApi, discoveryApi, downloadBlob } from '@/lib/api';
import {
  Asset,
  Alert,
  Maintenance,
  Ticket,
  ASSET_STATUS_LABELS,
  PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/types';
import { PageHeader, LoadingSpinner } from '@/components/shared/page-header';
import { SectionWrapper, StaggeredItem } from '@/components/shared/section-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Package,
  Wrench,
  Bell,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  ArrowUpRight,
  LayoutDashboard,
  Users,
  HardDrive,
  Server,
  Activity,
  Link2,
  Ticket as TicketIcon,
  Eye,
  CalendarDays,
  FileDown,
  Calendar,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  MAINTENANCE: '#f59e0b',
  INACTIVE: '#94a3b8',
  DISPOSED: '#ef4444',
  RESERVED: '#6366f1',
};

const SECTION_CONFIG = {
  overview: {
    label: 'Resumen General',
    icon: LayoutDashboard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  assets: { label: 'Activos', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  maintenance: { label: 'Mantenimiento', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
  tickets: { label: 'Tickets', icon: TicketIcon, color: 'text-red-500', bg: 'bg-red-50' },
  alerts: { label: 'Alertas', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50' },
  discovery: { label: 'Discovery', icon: Monitor, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  calendar: { label: 'Calendario', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

type SectionKey = keyof typeof SECTION_CONFIG;

const STORAGE_KEY = 'tecman-dashboard-consolidated-visible-sections';

function loadVisibleSections(): Record<SectionKey, boolean> {
  if (typeof window === 'undefined') {
    return Object.keys(SECTION_CONFIG).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<SectionKey, boolean>,
    );
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored)
      return {
        ...Object.keys(SECTION_CONFIG).reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {} as Record<SectionKey, boolean>,
        ),
        ...JSON.parse(stored),
      };
  } catch {}
  return Object.keys(SECTION_CONFIG).reduce(
    (acc, k) => ({ ...acc, [k]: true }),
    {} as Record<SectionKey, boolean>,
  );
}

export default function ConsolidatedDashboardPage() {
  const [visibleSections, setVisibleSections] =
    useState<Record<SectionKey, boolean>>(loadVisibleSections);
  const [showSettings, setShowSettings] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const toggleSection = (key: SectionKey) => {
    setVisibleSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetVisibility = () => {
    const all = Object.keys(SECTION_CONFIG).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<SectionKey, boolean>,
    );
    setVisibleSections(all);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const r = await dashboardApi.stats();
      return r.data;
    },
  });

  const { data: discoveryStats } = useQuery({
    queryKey: ['discovery-stats'],
    queryFn: async () => {
      const r = await discoveryApi.getStats();
      return r.data as any;
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts-consolidated'],
    queryFn: async () => {
      const r = await alertsApi.list({ resolved: 'false', limit: '10' });
      return r.data as Alert[];
    },
  });

  const { data: maintenances } = useQuery({
    queryKey: ['maintenance-consolidated'],
    queryFn: async () => {
      const r = await maintenanceApi.list({ limit: '10' });
      return (r.data as any)?.data ?? (r.data as Maintenance[]);
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets-consolidated'],
    queryFn: async () => {
      const r = await ticketsApi.list({ limit: '10' });
      return r.data as Ticket[];
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

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (!dashboardRef.current || pdfExporting) return;
    setPdfExporting(true);
    try {
      const [html2canvasModule, jsPdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jsPdfModule;

      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard-consolidado-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('Error al exportar PDF:', e);
    } finally {
      setPdfExporting(false);
    }
  }, [pdfExporting]);

  const isVisible = (key: SectionKey) => visibleSections[key];

  // ── Date filter helpers ────────────────────────────────────────────────────
  const hasDateFilter = dateFrom || dateTo;

  const isInDateRange = (dateStr: string | null | undefined): boolean => {
    if (!hasDateFilter || !dateStr) return !hasDateFilter;
    const d = new Date(dateStr);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      if (d > endDate) return false;
    }
    return true;
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredMaintenances = Array.isArray(maintenances)
    ? maintenances.filter((m) => isInDateRange(m.createdAt) || isInDateRange(m.scheduledDate))
    : [];

  const filteredTickets = Array.isArray(tickets)
    ? tickets.filter((t) => isInDateRange(t.createdAt))
    : [];

  const filteredAlerts = Array.isArray(alerts)
    ? alerts.filter((a) => isInDateRange(a.createdAt))
    : [];

  // ── Derived data ───────────────────────────────────────────────────────────
  const assetsByStatus =
    stats?.assetsByStatus?.map((s: any) => ({
      name: ASSET_STATUS_LABELS[s.status as keyof typeof ASSET_STATUS_LABELS] || s.status,
      value: s._count?.status ?? s.count ?? 0,
      color: STATUS_COLORS[s.status] || '#94a3b8',
    })) || [];

  const totalTickets = filteredTickets.length;
  const openTickets = filteredTickets.filter((t: Ticket) => t.status === 'OPEN').length;
  const resolvedTickets = filteredTickets.filter((t: Ticket) =>
    ['RESOLVED', 'CLOSED'].includes(t.status),
  ).length;

  const pendingMaint = filteredMaintenances.filter(
    (m: Maintenance) => m.status === 'PENDING',
  ).length;
  const completedMaint = filteredMaintenances.filter(
    (m: Maintenance) => m.status === 'COMPLETED',
  ).length;

  const activeAlerts = filteredAlerts.length;
  const criticalAlerts = filteredAlerts.filter((a: Alert) => a.priority === 'CRITICAL').length;

  const totalDevices = discoveryStats?.totalDevices || 0;
  const onlineDevices = discoveryStats?.onlineDevices || 0;
  const linkedDevices = discoveryStats?.linkedDevices || 0;
  const totalCores = discoveryStats?.totalCores || 0;

  const overviewKpis = [
    {
      href: '/dashboard/assets',
      label: 'Activos',
      value: stats?.assetsCount ?? 0,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      hoverBorder: 'hover:border-blue-200',
    },
    {
      href: '/dashboard/maintenance',
      label: 'Pendientes',
      value: pendingMaint,
      icon: Wrench,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      hoverBorder: 'hover:border-amber-200',
    },
    {
      href: '/dashboard/tickets',
      label: 'Abiertos',
      value: openTickets,
      icon: TicketIcon,
      color: 'text-red-500',
      bg: 'bg-red-50',
      hoverBorder: 'hover:border-red-200',
    },
    {
      href: '/dashboard/alerts',
      label: 'Alertas',
      value: activeAlerts,
      icon: Bell,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      hoverBorder: 'hover:border-orange-200',
    },
    {
      href: '/dashboard/discovery',
      label: 'Dispositivos',
      value: totalDevices,
      icon: Monitor,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      hoverBorder: 'hover:border-indigo-200',
    },
    {
      href: '/dashboard/users',
      label: 'Usuarios',
      value: stats?.usersCount ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      hoverBorder: 'hover:border-emerald-200',
    },
  ];

  const maintKpis = [
    { label: 'Pendientes', value: pendingMaint, color: 'text-slate-800', bg: 'bg-amber-50' },
    {
      label: 'En proceso',
      value: filteredMaintenances.filter((m: Maintenance) => m.status === 'IN_PROGRESS').length,
      color: 'text-slate-800',
      bg: 'bg-blue-50',
    },
    { label: 'Completados', value: completedMaint, color: 'text-slate-800', bg: 'bg-emerald-50' },
  ];

  const ticketKpis = [
    { label: 'Abiertos', value: openTickets, color: 'text-slate-800', bg: 'bg-red-50' },
    {
      label: 'En proceso',
      value: filteredTickets.filter((t: Ticket) => t.status === 'IN_PROGRESS').length,
      color: 'text-slate-800',
      bg: 'bg-amber-50',
    },
    { label: 'Resueltos', value: resolvedTickets, color: 'text-slate-800', bg: 'bg-emerald-50' },
  ];

  const discoveryKpis = [
    {
      label: 'Dispositivos detectados',
      value: totalDevices,
      icon: Monitor,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Online (24h)',
      value: onlineDevices,
      icon: Activity,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Vinculados',
      value: linkedDevices,
      icon: Link2,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Cores totales',
      value: totalCores,
      icon: Server,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div ref={dashboardRef} className="max-w-7xl space-y-4">
      <PageHeader
        title="Dashboard Consolidado"
        subtitle="Visibilidad de todas las secciones del sistema en un solo lugar"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await dashboardApi.report();
                  downloadBlob(res.data, `reporte-kpis-${new Date().toISOString().split('T')[0]}.xlsx`);
                } catch (e) {
                  console.error('Error al descargar reporte:', e);
                }
              }}
              className="rounded-xl h-9 px-3 text-sm gap-1.5 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            >
              <FileDown size={14} />
              XLSX
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={pdfExporting}
              className="rounded-xl h-9 px-3 text-sm gap-1.5"
            >
              {pdfExporting ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <FileDown size={14} />
              )}
              {pdfExporting ? 'Exportando...' : 'PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-xl h-9 px-3 text-sm gap-1.5 transition-colors ${showSettings ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
            >
              <Settings2 size={14} />
              {showSettings ? 'Cerrar configuración' : 'Personalizar'}
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" className="rounded-xl h-9 px-3 text-sm gap-1.5">
                <LayoutDashboard size={14} />
                Dashboard principal
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Date Filter Bar ── */}
      <Card className="border-slate-100 rounded-2xl">
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <CalendarDays size={15} className="text-slate-400" />
            <span>Filtrar por fecha:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="filter-date-from"
              name="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              title="Desde"
            />
            <span className="text-slate-300 text-xs">→</span>
            <input
              id="filter-date-to"
              name="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              title="Hasta"
            />
          </div>
          {hasDateFilter && (
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span>Filtro activo</span>
              <button
                onClick={clearDateFilter}
                className="ml-1 hover:text-blue-800"
                title="Limpiar filtro"
              >
                <X size={13} />
              </button>
            </span>
          )}
          <span className="text-xs text-slate-400 ml-auto">
            {filteredMaintenances.length + filteredTickets.length + filteredAlerts.length} ítems en
            el rango
          </span>
        </CardContent>
      </Card>

      {/* ── Settings Panel ── */}
      {showSettings && (
        <SectionWrapper>
          <Card className="border-blue-100 bg-blue-50/50 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">Secciones visibles</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetVisibility}
                  className="h-7 text-xs rounded-lg text-blue-600"
                >
                  Restablecer todas
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SECTION_CONFIG).map(([key, config]) => (
                  <label
                    key={key}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all text-xs font-medium ${
                      visibleSections[key as SectionKey]
                        ? 'bg-white border-slate-200 text-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    <Switch
                      checked={visibleSections[key as SectionKey]}
                      onCheckedChange={() => toggleSection(key as SectionKey)}
                      className="scale-75"
                    />
                    <config.icon
                      size={13}
                      className={
                        visibleSections[key as SectionKey] ? config.color : 'text-slate-300'
                      }
                    />
                    {config.label}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </SectionWrapper>
      )}

      {/* ═══════════════════════ OVERVIEW ═══════════════════════ */}
      {isVisible('overview') && (
        <SectionWrapper className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {overviewKpis.map((kpi, i) => (
            <Link key={kpi.href} href={kpi.href} className="text-left">
              <StaggeredItem index={i} baseDelay={0}>
                <Card
                  className={`border-slate-100 rounded-2xl hover:shadow-md ${kpi.hoverBorder} transition-all cursor-pointer`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`${kpi.bg} ${kpi.color} w-9 h-9 rounded-xl flex items-center justify-center`}
                      >
                        <kpi.icon size={16} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                        <p className="text-xs text-slate-400">{kpi.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggeredItem>
            </Link>
          ))}
        </SectionWrapper>
      )}

      {/* ═══════════════════════ ASSETS ═══════════════════════ */}
      {isVisible('assets') && (
        <SectionWrapper delay={100}>
          <Card className="border-blue-100 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-transparent">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Package size={15} className="text-blue-500" />
                Activos — Resumen
              </CardTitle>
              <Link
                href="/dashboard/assets"
                className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
              >
                Gestionar activos <ArrowUpRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {statsLoading ? (
                <div className="h-[100px] flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : assetsByStatus.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="40%" height={100}>
                    <PieChart>
                      <Pie
                        data={assetsByStatus}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={40}
                        innerRadius={22}
                      >
                        {assetsByStatus.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 flex-1">
                    {assetsByStatus.map((s: any) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: s.color }}
                        />
                        <span className="text-xs text-slate-500">{s.name}</span>
                        <span className="text-xs font-semibold text-slate-800">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[80px] flex items-center justify-center text-slate-400 text-sm">
                  Sin datos
                </div>
              )}
            </CardContent>
          </Card>
        </SectionWrapper>
      )}

      {/* ═══════════════════════ MAINTENANCE + TICKETS ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isVisible('maintenance') && (
          <SectionWrapper delay={200}>
            <Card className="border-amber-100 rounded-2xl">
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-amber-50 to-transparent">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Wrench size={15} className="text-amber-500" />
                  Mantenimiento
                </CardTitle>
                <Link
                  href="/dashboard/maintenance"
                  className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                  Ver todo <ArrowUpRight size={12} />
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {maintKpis.map((kpi, i) => (
                    <StaggeredItem
                      key={kpi.label}
                      index={i}
                      baseDelay={0}
                      className={`${kpi.bg} rounded-xl p-2.5 text-center`}
                    >
                      <p className="text-lg font-bold text-slate-800">{kpi.value}</p>
                      <p className="text-[10px] text-slate-400">{kpi.label}</p>
                    </StaggeredItem>
                  ))}
                </div>

                {filteredMaintenances.filter((m: Maintenance) => m.status === 'PENDING').length >
                0 ? (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {filteredMaintenances
                      .filter((m: Maintenance) => m.status === 'PENDING')
                      .slice(0, 5)
                      .map((m: Maintenance) => (
                        <Link
                          key={m.id}
                          href={`/dashboard/assets/${m.assetId}`}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <Wrench size={11} className="text-amber-600" />
                          </div>
                          <span className="text-xs text-slate-700 flex-1 truncate">
                            {m.asset?.name || '—'}
                          </span>
                          <span className="text-[10px] text-slate-400">{m.code}</span>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-slate-400 text-sm gap-2">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    Sin mantenimientos pendientes
                  </div>
                )}
              </CardContent>
            </Card>
          </SectionWrapper>
        )}

        {isVisible('tickets') && (
          <SectionWrapper delay={250}>
            <Card className="border-red-100 rounded-2xl">
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-red-50 to-transparent">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <TicketIcon size={15} className="text-red-500" />
                  Tickets
                </CardTitle>
                <Link
                  href="/dashboard/tickets"
                  className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                  Ver todo <ArrowUpRight size={12} />
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {ticketKpis.map((kpi, i) => (
                    <StaggeredItem
                      key={kpi.label}
                      index={i}
                      baseDelay={0}
                      className={`${kpi.bg} rounded-xl p-2.5 text-center`}
                    >
                      <p className="text-lg font-bold text-slate-800">{kpi.value}</p>
                      <p className="text-[10px] text-slate-400">{kpi.label}</p>
                    </StaggeredItem>
                  ))}
                </div>

                {filteredTickets.length > 0 ? (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {filteredTickets.slice(0, 5).map((t: Ticket) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            t.status === 'OPEN'
                              ? 'bg-red-100'
                              : t.status === 'IN_PROGRESS'
                                ? 'bg-amber-100'
                                : 'bg-emerald-100'
                          }`}
                        >
                          <TicketIcon
                            size={11}
                            className={
                              t.status === 'OPEN'
                                ? 'text-red-600'
                                : t.status === 'IN_PROGRESS'
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            }
                          />
                        </div>
                        <span className="text-xs text-slate-700 flex-1 truncate">{t.title}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {TICKET_STATUS_LABELS[t.status] || t.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-slate-400 text-sm gap-2">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    Sin tickets
                  </div>
                )}
              </CardContent>
            </Card>
          </SectionWrapper>
        )}
      </div>

      {/* ═══════════════════════ ALERTS + DISCOVERY ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isVisible('alerts') && (
          <SectionWrapper delay={300}>
            <Card className="border-orange-100 rounded-2xl">
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-orange-50 to-transparent">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Bell size={15} className="text-orange-500" />
                  Alertas Activas
                </CardTitle>
                <Link
                  href="/dashboard/alerts"
                  className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                  Ver todo <ArrowUpRight size={12} />
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                {criticalAlerts > 0 && (
                  <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
                    <AlertTriangle size={14} className="text-red-600 shrink-0" />
                    <span className="text-xs font-semibold text-red-700">
                      {criticalAlerts} alerta{criticalAlerts !== 1 ? 's' : ''} crítica
                      {criticalAlerts !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {filteredAlerts.length > 0 ? (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {filteredAlerts.slice(0, 6).map((a: Alert) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
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
                          <p className="text-xs text-slate-700 truncate">{a.title}</p>
                          {a.asset && (
                            <Link
                              href={`/dashboard/assets/${a.asset.id}`}
                              className="text-[10px] text-blue-600 hover:underline"
                            >
                              {a.asset.name}
                            </Link>
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
                          className="text-[9px] px-1.5 py-0 h-4 shrink-0"
                        >
                          {PRIORITY_LABELS[a.priority]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-slate-400 text-sm gap-2">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    Sin alertas activas
                  </div>
                )}
              </CardContent>
            </Card>
          </SectionWrapper>
        )}

        {isVisible('discovery') && (
          <SectionWrapper delay={350}>
            <Card className="border-indigo-100 rounded-2xl">
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-transparent">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Monitor size={15} className="text-indigo-500" />
                  Discovery de Red
                </CardTitle>
                <Link
                  href="/dashboard/discovery"
                  className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                  Ver todo <ArrowUpRight size={12} />
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                {totalDevices > 0 ? (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {discoveryKpis.map((kpi, i) => (
                      <StaggeredItem
                        key={kpi.label}
                        index={i}
                        baseDelay={0}
                        className={`${kpi.bg} rounded-xl p-3 text-center`}
                      >
                        <kpi.icon
                          size={18}
                          className="mx-auto mb-1"
                          style={{ color: kpi.color.replace('text-', '') }}
                        />
                        <p className="text-lg font-bold text-slate-800">{kpi.value}</p>
                        <p className="text-[10px] text-slate-400">{kpi.label}</p>
                      </StaggeredItem>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-sm">
                    <Monitor size={24} className="text-slate-200 mb-2" />
                    <p>Instala el agente de discovery</p>
                    <Link
                      href="/dashboard/agents"
                      className="text-xs text-blue-600 hover:underline mt-1"
                    >
                      Descargar agente →
                    </Link>
                  </div>
                )}

                {totalDevices > 0 && (
                  <div className="flex gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <HardDrive size={12} className="text-slate-400" />
                      RAM:{' '}
                      {discoveryStats?.totalRamBytes
                        ? formatBytes(discoveryStats.totalRamBytes)
                        : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Server size={12} className="text-slate-400" />
                      Disco:{' '}
                      {discoveryStats?.totalDiskBytes
                        ? formatBytes(discoveryStats.totalDiskBytes)
                        : '—'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </SectionWrapper>
        )}
      </div>

      {/* ═══════════════════════ CALENDARIO ═══════════════════════ */}
      {isVisible('calendar') && (
        <SectionWrapper delay={400}>
          <Card className="border-emerald-100 rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gradient-to-r from-emerald-50 to-transparent">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CalendarDays size={15} className="text-emerald-500" />
                Calendario de Mantenimientos
              </CardTitle>
              <Link
                href="/dashboard/maintenance"
                className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
              >
                Ver todo <ArrowUpRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <MiniCalendar maintenances={filteredMaintenances} />
            </CardContent>
          </Card>
        </SectionWrapper>
      )}
    </div>
  );
}

// ── Mini Calendar Component ─────────────────────────────────────────────────────
function MiniCalendar({ maintenances }: { maintenances: Maintenance[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const scheduledMaints = maintenances.filter((m) => m.scheduledDate);

  const maintByDay: Record<number, Maintenance[]> = {};
  scheduledMaints.forEach((m) => {
    const d = new Date(m.scheduledDate!);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const day = d.getDate();
      if (!maintByDay[day]) maintByDay[day] = [];
      maintByDay[day].push(m);
    }
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-slate-700">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold text-slate-400 uppercase py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
          const events = maintByDay[day] || [];
          const hasEvents = events.length > 0;
          const criticalCount = events.filter(
            (e) => e.priority === 'CRITICAL' || e.priority === 'HIGH',
          ).length;

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative ${
                isToday
                  ? 'bg-emerald-100 text-emerald-800 font-bold ring-2 ring-emerald-400'
                  : hasEvents
                    ? 'bg-amber-50 text-amber-800 font-medium'
                    : 'hover:bg-slate-50 text-slate-600'
              }`}
              title={
                hasEvents
                  ? events.map((e) => `${e.asset?.name || '—'} [${e.code}]`).join('\n')
                  : undefined
              }
            >
              <span>{day}</span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-0.5">
                  {criticalCount > 0 ? (
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                  )}
                  {events.length > 1 && <span className="w-1 h-1 rounded-full bg-amber-300" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {scheduledMaints.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Próximos mantenimientos
          </p>
          {scheduledMaints.slice(0, 4).map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/assets/${m.assetId}`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <CalendarDays size={11} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 truncate">{m.asset?.name || '—'}</p>
                <p className="text-[10px] text-slate-400">
                  {m.scheduledDate
                    ? new Date(m.scheduledDate).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{m.code}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number | string | null | undefined): string {
  if (!bytes) return '—';
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (num === 0) return '0 GB';
  const gb = num / 1024 ** 3;
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}
