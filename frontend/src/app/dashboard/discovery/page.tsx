'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { discoveryApi, assetsApi } from '@/lib/api';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { SearchBar } from '@/components/shared/search-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Monitor,
  ChevronLeft,
  ChevronRight,
  Eye,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Link2,
  Network,
  Server,
  Laptop,
  Globe,
  Radio,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Zap,
  Database,
  Cpu as CpuIcon,
  Wrench,
  Ticket,
  ExternalLink,
  Plus,
  Package,
  Terminal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
}

function formatBytes(bytes: number | string | null | undefined): string {
  if (!bytes) return '—';
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (num === 0) return '0 GB';
  const gb = num / 1024 ** 3;
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

function formatCompactNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

const OS_COLORS: Record<string, string> = {
  windows: '#3b82f6',
  linux: '#f59e0b',
  mac: '#64748b',
  darwin: '#64748b',
  unknown: '#94a3b8',
};

function getOsColor(os: string | null): string {
  if (!os) return OS_COLORS.unknown;
  const lower = os.toLowerCase();
  if (lower.includes('windows')) return OS_COLORS.windows;
  if (lower.includes('linux')) return OS_COLORS.linux;
  if (lower.includes('mac') || lower.includes('darwin')) return OS_COLORS.mac;
  return OS_COLORS.unknown;
}

function getOsIcon(os: string | null, size = 14) {
  if (!os) return <Monitor size={size} className="text-slate-400" />;
  const lower = os.toLowerCase();
  if (lower.includes('windows')) return <Monitor size={size} className="text-blue-500" />;
  if (lower.includes('linux')) return <Monitor size={size} className="text-orange-500" />;
  if (lower.includes('mac') || lower.includes('darwin'))
    return <Laptop size={size} className="text-slate-700" />;
  return <Monitor size={size} className="text-slate-400" />;
}

function getOsShortName(os: string | null): string {
  if (!os) return 'Unknown';
  const lower = os.toLowerCase();
  if (lower.includes('windows')) return 'Windows';
  if (lower.includes('linux')) return 'Linux';
  if (lower.includes('mac') || lower.includes('darwin')) return 'macOS';
  return 'Other';
}

export default function DiscoveryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailDevice, setDetailDevice] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // ── Stats ──────────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['discovery-stats'],
    queryFn: async () => {
      const r = await discoveryApi.getStats();
      return r.data as any;
    },
    refetchInterval: 30000,
  });

  // ── Device List ────────────────────────────────────────────────────────────
  const queryParams: Record<string, string | number> = { page, limit: 20 };
  if (search) queryParams.search = search;

  const { data: listResponse, isLoading: listLoading } = useQuery({
    queryKey: ['discovery-list', page, search],
    queryFn: async () => {
      const r = await discoveryApi.list(queryParams);
      return r.data as any;
    },
  });
  const devices: any[] = listResponse?.data ?? listResponse ?? [];
  const meta = listResponse?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  // ── Detail ─────────────────────────────────────────────────────────────────
  const { data: detail } = useQuery({
    queryKey: ['discovery-detail', detailDevice?.id],
    queryFn: async () => {
      if (!detailDevice?.id) return null;
      const r = await discoveryApi.get(detailDevice.id);
      return r.data as any;
    },
    enabled: !!detailDevice?.id,
  });

  // ── Agent Metrics ──────────────────────────────────────────────────────────
  const { data: agentMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['agent-metrics'],
    queryFn: async () => {
      const r = await discoveryApi.getAgentMetrics();
      return r.data as any;
    },
    refetchInterval: 30000,
  });

  // ── Derived stats ──────────────────────────────────────────────────────────
  const osData = useMemo(() => {
    if (!stats?.osDistribution) return [];
    // Agrupar por nombre corto de SO para evitar duplicados (ej: varias versiones de Windows)
    const groups: Record<string, { name: string; fullName: string; value: number; color: string }> =
      {};
    stats.osDistribution.forEach((o: any) => {
      const shortName = getOsShortName(o.os);
      if (groups[shortName]) {
        groups[shortName].value += o.count;
      } else {
        groups[shortName] = {
          name: shortName,
          fullName: o.os || 'Unknown',
          value: o.count,
          color: getOsColor(o.os),
        };
      }
    });
    return Object.values(groups);
  }, [stats]);

  const deviceCapacity = useMemo(() => {
    if (!devices.length) return [];
    return devices.slice(0, 10).map((d: any) => ({
      name: d.hostname?.split('.')[0] || '?',
      ram: Number(d.ramTotalBytes || 0) / 1024 ** 3,
      disk: Number(d.diskTotalBytes || 0) / 1024 ** 3,
      cores: d.cpuCores || 0,
    }));
  }, [devices]);

  const timelineData = useMemo(() => {
    if (!stats?.devicesByDay) return [];
    return (stats.devicesByDay as any[]).map((d: any) => ({
      date: d.date
        ? new Date(d.date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
        : '',
      count: Number(d.count),
    }));
  }, [stats]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (statsLoading && !stats) return <LoadingSpinner label="Cargando dashboard..." />;

  const isLoading = statsLoading || listLoading;

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader
        title="Discovery de Red"
        subtitle="Visibilidad de todos los dispositivos en la red"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="overview">
            <BarChart3 size={13} className="mr-1.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Monitor size={13} className="mr-1.5" />
            Dispositivos ({meta.total})
          </TabsTrigger>
          <TabsTrigger value="changes">
            <Activity size={13} className="mr-1.5" />
            Cambios recientes
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Terminal size={13} className="mr-1.5" />
            Agentes
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════ OVERVIEW TAB ════════════════════════ */}
        <TabsContent value="overview" className="space-y-4">
          {/* ── KPI Cards ── */}
          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <button onClick={() => setActiveTab('devices')} className="text-left">
                  <Card className="border-slate-100 rounded-2xl hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 w-9 h-9 rounded-xl flex items-center justify-center">
                          <Monitor size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{stats.totalDevices}</p>
                          <p className="text-xs text-slate-400">Dispositivos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>

                <button onClick={() => setActiveTab('devices')} className="text-left">
                  <Card className="border-slate-100 rounded-2xl hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-600 w-9 h-9 rounded-xl flex items-center justify-center">
                          <Wifi size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{stats.onlineDevices}</p>
                          <p className="text-xs text-slate-400">Online (24h)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>

                <Card className="border-slate-100 rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-50 text-amber-600 w-9 h-9 rounded-xl flex items-center justify-center">
                        <Server size={16} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{osData.length}</p>
                        <p className="text-xs text-slate-400">S.O. distintos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <button onClick={() => setActiveTab('devices')} className="text-left">
                  <Card className="border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 text-indigo-500 w-9 h-9 rounded-xl flex items-center justify-center">
                          <Link2 size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{stats.linkedDevices}</p>
                          <p className="text-xs text-slate-400">Vinculados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>

                <button onClick={() => setActiveTab('changes')} className="text-left">
                  <Card className="border-slate-100 rounded-2xl hover:shadow-md hover:border-red-200 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-50 text-red-500 w-9 h-9 rounded-xl flex items-center justify-center">
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{stats.totalChanges}</p>
                          <p className="text-xs text-slate-400">Cambios HW</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>

                <Card className="border-slate-100 rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-50 text-purple-500 w-9 h-9 rounded-xl flex items-center justify-center">
                        <Zap size={16} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{stats.totalCores}</p>
                        <p className="text-xs text-slate-400">Cores totales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Charts Row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* OS Distribution */}
                <Card className="border-slate-100 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <PieChart size={15} className="text-slate-400" />
                      Distribución por S.O.
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {osData.length > 0 ? (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="55%" height={150}>
                          <RePieChart>
                            <Pie
                              data={osData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={55}
                              innerRadius={28}
                            >
                              {osData.map((entry: any, i: number) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => [v, 'dispositivos']} />
                          </RePieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-1.5 flex-1">
                          {osData.map((o: any) => (
                            <div key={o.name} className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: o.color }}
                              />
                              <span className="text-xs text-slate-500 flex-1">{o.name}</span>
                              <span className="text-xs font-semibold text-slate-800">
                                {o.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[150px] flex items-center justify-center text-sm text-slate-400">
                        Sin datos
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resources summary */}
                <Card className="border-slate-100 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Database size={15} className="text-slate-400" />
                      Recursos agregados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                        <MemoryStick size={18} className="text-blue-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-400">RAM Total</p>
                          <p className="text-lg font-bold text-slate-800">
                            {formatBytes(stats.totalRamBytes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3">
                        <HardDrive size={18} className="text-emerald-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-400">Disco Total</p>
                          <p className="text-lg font-bold text-slate-800">
                            {formatBytes(stats.totalDiskBytes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3">
                        <CpuIcon size={18} className="text-amber-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-400">CPU</p>
                          <p className="text-lg font-bold text-slate-800">
                            {stats.totalCores} cores
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Online/Offline */}
                <Card className="border-slate-100 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Radio size={15} className="text-slate-400" />
                      Estado de conectividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-[150px]">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="8"
                            strokeDasharray={`${(stats.onlineDevices / Math.max(stats.totalDevices, 1)) * 264} 264`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-slate-800">
                            {stats.onlineDevices}
                          </span>
                          <span className="text-xs text-slate-400">de {stats.totalDevices}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Online: {stats.onlineDevices}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                          Offline: {stats.offlineDevices}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Network Map / OS Grid ── */}
              <Card className="border-slate-100 rounded-2xl">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Network size={15} className="text-slate-400" />
                    Mapa de red — dispositivos por sistema operativo
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('devices')}
                    className="h-8 text-xs rounded-xl"
                  >
                    Ver todos
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {osData.map((os: any) => {
                      const osDevices = (Array.isArray(devices) ? devices : [])
                        .filter((d: any) => getOsShortName(d.os) === os.name)
                        .slice(0, 4);
                      return (
                        <Card key={os.name} className="border-slate-100 rounded-xl overflow-hidden">
                          <div className="p-3" style={{ background: `${os.color}10` }}>
                            <div className="flex items-center gap-2 mb-2">
                              {getOsIcon(os.fullName, 16)}
                              <span className="font-semibold text-sm text-slate-800">
                                {os.name}
                              </span>
                              <span className="ml-auto text-xs font-bold text-slate-500">
                                {os.value}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {osDevices.length > 0 ? (
                                osDevices.map((d: any) => (
                                  <button
                                    key={d.id}
                                    onClick={() => setDetailDevice(d)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/60 hover:bg-white text-xs text-slate-600 hover:text-slate-800 transition-colors text-left"
                                  >
                                    <Globe size={10} className="text-slate-300 shrink-0" />
                                    <span className="flex-1 truncate">{d.hostname}</span>
                                    <span className="text-slate-300 text-[10px] truncate max-w-[100px] text-right">
                                      {d.cpuModel?.split('(')[0]?.trim() || d.cpuCores
                                        ? `${d.cpuCores}c`
                                        : '?'}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 italic px-2 py-1">
                                  Sin dispositivos en esta vista
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ── Detection timeline ── */}
              {timelineData.length > 0 && (
                <Card className="border-slate-100 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <BarChart3 size={15} className="text-slate-400" />
                      Detecciones (últimos 30 días)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={timelineData}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          width={25}
                        />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ════════════════════════ DEVICES TAB ════════════════════════ */}
        <TabsContent value="devices" className="space-y-4">
          <Card className="border-slate-100 rounded-2xl mb-1">
            <CardContent className="p-3 flex flex-wrap gap-3 items-center">
              <SearchBar
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Buscar por hostname, IP o MAC..."
                className="w-72"
              />
              <span className="ml-auto text-xs text-slate-400 font-medium">
                {meta.total} dispositivo{meta.total !== 1 ? 's' : ''}
              </span>
            </CardContent>
          </Card>

          {listLoading ? (
            <LoadingSpinner />
          ) : !Array.isArray(devices) || devices.length === 0 ? (
            <EmptyState
              icon={Monitor}
              title="Sin dispositivos"
              subtitle="Instala el agente de discovery en los equipos"
            />
          ) : (
            <Card className="border-slate-100 rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead>Hostname</TableHead>
                    <TableHead className="hidden md:table-cell">IP</TableHead>
                    <TableHead className="hidden lg:table-cell">Sistema Operativo</TableHead>
                    <TableHead className="hidden md:table-cell">CPU</TableHead>
                    <TableHead className="hidden md:table-cell">RAM</TableHead>
                    <TableHead className="hidden lg:table-cell">Disco</TableHead>
                    <TableHead className="hidden lg:table-cell">Estado</TableHead>
                    <TableHead className="text-right">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((d: any) => {
                    const isOnline =
                      d.lastSeenAt &&
                      new Date(d.lastSeenAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return (
                      <TableRow
                        key={d.id}
                        onClick={() => setDetailDevice(d)}
                        className="cursor-pointer hover:bg-blue-50/20 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getOsIcon(d.os, 14)}
                            <span className="font-medium text-slate-800 text-sm">{d.hostname}</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs text-slate-500">
                          {d.ipAddress || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                          {d.os?.split('(')[0]?.trim() || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-slate-500">
                            {d.cpuModel?.split('(')[0]?.trim() || '—'}
                          </span>
                          {d.cpuCores && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              {d.cpuCores} cores
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-slate-500">
                          {formatBytes(d.ramTotalBytes)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                          {formatBytes(d.diskTotalBytes)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span
                            className={`inline-flex items-center text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}
                          >
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailDevice(d);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
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
        </TabsContent>

        {/* ════════════════════════ CHANGES TAB ════════════════════════ */}
        <TabsContent value="changes">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Activity size={15} className="text-amber-500" />
                Cambios de hardware detectados
                {stats?.totalChanges ? (
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({stats.totalChanges} totales)
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentChanges?.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentChanges.map((ch: any) => (
                    <div
                      key={ch.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-amber-50/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Activity size={14} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">
                            {ch.device?.hostname || 'Dispositivo'}
                          </span>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            {ch.component}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ch.oldValue || '?'} → {ch.newValue || '?'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(ch.detectedAt).toLocaleString('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CheckCircle2 size={32} className="text-emerald-300 mb-2" />
                  <p className="text-sm">Sin cambios de hardware registrados</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Todos los dispositivos tienen su configuración original
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ AGENTS TAB ════════════════════════ */}
        <TabsContent value="agents" className="space-y-4">
          {metricsLoading && !agentMetrics ? (
            <LoadingSpinner label="Cargando métricas de agentes..." />
          ) : (
            <>
              {/* ── Agent Health KPI Cards ── */}
              {agentMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-slate-100 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 w-9 h-9 rounded-xl flex items-center justify-center">
                          <Terminal size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {agentMetrics.totalDevices}
                          </p>
                          <p className="text-xs text-slate-400">Dispositivos con agente</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-600 w-9 h-9 rounded-xl flex items-center justify-center">
                          <Activity size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {agentMetrics.lastHour}
                          </p>
                          <p className="text-xs text-slate-400">Reportes última hora</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-50 text-amber-600 w-9 h-9 rounded-xl flex items-center justify-center">
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {agentMetrics.noVersion}
                          </p>
                          <p className="text-xs text-slate-400">Agentes legacy (sin versión)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-50 text-purple-500 w-9 h-9 rounded-xl flex items-center justify-center">
                          <Server size={16} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {agentMetrics.versionDistribution?.length || 0}
                          </p>
                          <p className="text-xs text-slate-400">Versiones distintas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Version Distribution + Report Timeline ── */}
              {agentMetrics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Version distribution */}
                  <Card className="border-slate-100 rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Package size={15} className="text-slate-400" />
                        Distribución de versiones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {agentMetrics.versionDistribution?.length > 0 ? (
                        <div className="space-y-2">
                          {agentMetrics.versionDistribution.map((v: any) => {
                            const pct = ((v.count / agentMetrics.totalDevices) * 100).toFixed(1);
                            const isLegacy = v.version === 'Legacy (sin versión)';
                            return (
                              <div key={v.version} className="flex items-center gap-3">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLegacy ? 'bg-amber-400' : v.version.startsWith('go') ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                />
                                <span
                                  className="text-xs text-slate-600 w-24 truncate"
                                  title={v.version}
                                >
                                  {isLegacy ? 'Legacy' : v.version}
                                </span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isLegacy ? 'bg-amber-400' : v.version.startsWith('go') ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-600 w-12 text-right">
                                  {v.count}
                                </span>
                                <span className="text-[10px] text-slate-400 w-10 text-right">
                                  {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-[100px] flex items-center justify-center text-sm text-slate-400">
                          Sin datos de versiones
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reports last 24h */}
                  <Card className="border-slate-100 rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <BarChart3 size={15} className="text-slate-400" />
                        Reportes (últimas 24h)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {agentMetrics.reportsByHour?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart
                            data={agentMetrics.reportsByHour.map((r: any) => ({
                              hour:
                                typeof r.hour === 'string'
                                  ? r.hour.split(' ')[1]?.substring(0, 5) || r.hour
                                  : '',
                              count: Number(r.count),
                            }))}
                          >
                            <XAxis
                              dataKey="hour"
                              tick={{ fontSize: 9, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              interval={2}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 9, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              width={20}
                            />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
                          Sin reportes en las últimas 24h
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Latest Reports Table ── */}
              {agentMetrics && agentMetrics.latestReports?.length > 0 && (
                <Card className="border-slate-100 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Activity size={15} className="text-slate-400" />
                      Últimos reportes de agentes
                    </CardTitle>
                    <span className="text-xs text-slate-400 font-medium">
                      {agentMetrics.latestReports.length} reportes
                    </span>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead>Dispositivo</TableHead>
                          <TableHead className="hidden md:table-cell">IP</TableHead>
                          <TableHead className="hidden lg:table-cell">S.O.</TableHead>
                          <TableHead>Agente</TableHead>
                          <TableHead className="hidden lg:table-cell">Fabricante</TableHead>
                          <TableHead>Último reporte</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="hidden md:table-cell">Vinculado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentMetrics.latestReports.map((d: any) => {
                          const isOnline =
                            d.lastSeenAt &&
                            new Date(d.lastSeenAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                          const isRecent =
                            d.lastSeenAt &&
                            new Date(d.lastSeenAt) > new Date(Date.now() - 60 * 60 * 1000);
                          return (
                            <TableRow key={d.id} className="hover:bg-blue-50/20 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-slate-800">
                                    {d.hostname}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell font-mono text-xs text-slate-500">
                                {d.ipAddress || '—'}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-slate-500 truncate max-w-[120px]">
                                {d.os?.split('(')[0]?.trim() || '—'}
                              </TableCell>
                              <TableCell>
                                {d.agentVersion ? (
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] font-mono ${d.agentVersion.startsWith('go') ? 'bg-blue-100 text-blue-700' : d.agentVersion.startsWith('ps') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                  >
                                    {d.agentVersion}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-amber-100 text-amber-700"
                                  >
                                    Legacy
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                                {d.manufacturer || '—'}
                              </TableCell>
                              <TableCell>
                                <span
                                  className="text-xs text-slate-500"
                                  title={new Date(d.lastSeenAt).toLocaleString('es-CO')}
                                >
                                  {formatRelativeTime(d.lastSeenAt)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isRecent ? 'bg-emerald-500' : isOnline ? 'bg-blue-400' : 'bg-slate-300'}`}
                                  />
                                  <span
                                    className={`text-xs font-medium ${isRecent ? 'text-emerald-600' : isOnline ? 'text-blue-500' : 'text-slate-400'}`}
                                  >
                                    {isRecent ? 'Activo' : isOnline ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {d.asset ? (
                                  <a
                                    href={`/dashboard/assets/${d.asset.id}`}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    {d.asset.name}
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ════════════════════════ DETAIL DIALOG ════════════════════════ */}
      <Dialog open={!!detailDevice} onOpenChange={() => setDetailDevice(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getOsIcon(detailDevice?.os, 16)}
              {detailDevice?.hostname || 'Detalle'}
            </DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              {/* ── General ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Dirección MAC</p>
                  <p className="text-sm font-mono font-semibold text-slate-700">
                    {detail.macAddress}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Dirección IP</p>
                  <p className="text-sm font-mono font-semibold text-slate-700">
                    {detail.ipAddress || '—'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Sistema Operativo</p>
                  <p className="text-sm font-semibold text-slate-700">{detail.os || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">Último reporte</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {detail.lastSeenAt ? new Date(detail.lastSeenAt).toLocaleString('es-CO') : '—'}
                  </p>
                </div>
              </div>

              {/* ── Fabricante ── */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Fabricante
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Fabricante</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {detail.manufacturer || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Modelo</p>
                    <p className="text-sm font-semibold text-slate-700">{detail.model || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">N° Serie</p>
                    <p className="text-sm font-mono font-semibold text-slate-700">
                      {detail.serialNumber || '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">BIOS/UEFI</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {detail.biosVersion || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── CPU ── */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Procesador
                </h4>
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <Cpu size={20} className="text-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {detail.cpuModel || '—'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {detail.cpuCores || '?'} cores
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RAM ── */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Memoria RAM
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <MemoryStick size={18} className="mx-auto text-emerald-500 mb-1" />
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-sm font-bold text-slate-700">
                      {formatBytes(detail.ramTotalBytes)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <MemoryStick size={18} className="mx-auto text-emerald-500 mb-1" />
                    <p className="text-xs text-slate-400">Tipo</p>
                    <p className="text-sm font-bold text-slate-700">{detail.ramType || '—'}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Slots ocupados</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {detail.ramSlotsUsed || '?'} de {detail.ramSlots || '?'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Velocidad</p>
                    <p className="text-sm font-semibold text-slate-700">{detail.ramSpeed || '—'}</p>
                  </div>
                </div>
              </div>

              {/* ── Disco ── */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Almacenamiento
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <HardDrive size={18} className="mx-auto text-amber-500 mb-1" />
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-sm font-bold text-slate-700">
                      {formatBytes(detail.diskTotalBytes)}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <HardDrive size={18} className="mx-auto text-amber-500 mb-1" />
                    <p className="text-xs text-slate-400">Tipo</p>
                    <p className="text-sm font-bold text-slate-700">{detail.diskType || '—'}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Libre</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {detail.diskFreeBytes ? formatBytes(detail.diskFreeBytes) : '—'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Usado</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {detail.diskUsedBytes ? formatBytes(detail.diskUsedBytes) : '—'}
                    </p>
                  </div>
                </div>

                {detail.volumes &&
                  (() => {
                    try {
                      const vols =
                        typeof detail.volumes === 'string'
                          ? JSON.parse(detail.volumes)
                          : detail.volumes;
                      if (Array.isArray(vols) && vols.length > 0) {
                        return (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                              Volúmenes
                            </p>
                            <div className="space-y-1.5">
                              {vols.map((v: any, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-xs"
                                >
                                  <span className="font-mono font-bold text-slate-700 w-10">
                                    {v.deviceId}
                                  </span>
                                  <span className="text-slate-400 flex-1 truncate">
                                    {v.label || '—'}
                                  </span>
                                  <span className="text-slate-500">{v.fileSystem || '—'}</span>
                                  <span className="font-mono text-slate-600">
                                    {formatBytes(v.totalBytes)}
                                  </span>
                                  <span className="text-slate-400">
                                    {formatBytes(v.freeBytes)} libres
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
              </div>

              {/* ── Red y dominio ── */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Red y dominio
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Dominio</p>
                    <p className="text-sm font-semibold text-slate-700">{detail.domain || '—'}</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Usuario</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {detail.loggedUser || '—'}
                    </p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Último inicio</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {detail.lastBoot ? new Date(detail.lastBoot).toLocaleString('es-CO') : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Vinculación ── */}
              {detail.asset ? (
                <div className="space-y-2">
                  <a
                    href={`/dashboard/assets/${detail.asset.id}`}
                    className="block bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 hover:bg-emerald-100 transition-colors group"
                  >
                    <Link2 size={16} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-600 font-semibold group-hover:underline">
                        Vinculado al activo
                      </p>
                      <p className="text-sm text-emerald-800 truncate">
                        {detail.asset.name} ({detail.asset.code})
                      </p>
                    </div>
                    <span className="ml-auto text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Ver →
                    </span>
                  </a>
                  {/* Acciones rápidas desde discovery */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`/dashboard/tickets?assetCode=${encodeURIComponent(detail.asset.code)}`}
                      className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-2.5 hover:bg-blue-100 transition-colors group"
                    >
                      <Ticket size={14} className="text-blue-500 shrink-0" />
                      <span className="text-xs font-semibold text-blue-700">Crear ticket</span>
                    </a>
                    <a
                      href={`/dashboard/maintenance?assetCode=${encodeURIComponent(detail.asset.code)}`}
                      className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5 hover:bg-amber-100 transition-colors group"
                    >
                      <Wrench size={14} className="text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-amber-700">Mantenimiento</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">No vinculado a ningún activo en TecMan</p>
                  </div>
                  {/* Botón: Crear activo desde Discovery */}
                  <button
                    onClick={async () => {
                      try {
                        const r = await discoveryApi.linkToAsset(detail.id, {
                          createNew: true,
                          assetData: { name: detail.hostname },
                        });
                        const newAsset = r.data;
                        setDetailDevice(null);
                        window.location.href = `/dashboard/assets/${newAsset.id}`;
                      } catch (e: any) {
                        alert('Error al crear activo: ' + (e.response?.data?.message || e.message));
                      }
                    }}
                    className="flex items-center gap-2 w-full bg-blue-600 border border-blue-500 rounded-xl p-2.5 hover:bg-blue-700 transition-colors group text-white"
                  >
                    <Plus size={14} className="shrink-0" />
                    <span className="text-xs font-semibold">Crear activo desde Discovery</span>
                  </button>
                  {/* Acciones para dispositivo no vinculado */}
                  {(() => {
                    const searchTerm = [detail.hostname, detail.serialNumber, detail.macAddress]
                      .filter(Boolean)
                      .join(' ');
                    if (!searchTerm) return null;
                    return (
                      <a
                        href={`/dashboard/assets?search=${encodeURIComponent(searchTerm)}`}
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:bg-slate-100 transition-colors group"
                      >
                        <ExternalLink size={14} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-600">
                          Buscar activo por datos del dispositivo
                        </span>
                      </a>
                    );
                  })()}
                  <a
                    href="/dashboard/assets"
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 hover:bg-slate-100 transition-colors group"
                  >
                    <Package size={14} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600">Ir a Activos</span>
                  </a>
                </div>
              )}

              {/* ── Cambios ── */}
              {detail.changes?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Historial de cambios
                  </h4>
                  <div className="space-y-2">
                    {detail.changes.map((ch: any) => (
                      <div
                        key={ch.id}
                        className="flex items-start gap-2 bg-slate-50 rounded-xl p-3"
                      >
                        <Activity size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-600">
                            {ch.component} — {new Date(ch.detectedAt).toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs text-slate-400">
                            {ch.oldValue} → {ch.newValue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
