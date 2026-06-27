'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, assetsApi, usersApi } from '@/lib/api';
import { Ticket, TICKET_STATUS_LABELS, TICKET_CATEGORY_LABELS, PRIORITY_LABELS } from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { SectionWrapper, StaggeredItem } from '@/components/shared/section-wrapper';
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
import axios from 'axios';
import {
  Plus,
  Ticket as TicketIcon,
  Eye,
  MessageSquare,
  Star,
  ThumbsUp,
  Package,
  Wrench,
  Monitor,
  User,
  Mail,
  Phone,
  ArrowRightCircle,
  CheckCircle2,
  XCircle,
  ImageIcon,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { getAccessToken } from '@/lib/api';

const CATEGORIES = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'OTHER'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED'] as const;

const EMPTY = {
  title: '',
  description: '',
  category: 'HARDWARE',
  priority: 'MEDIUM',
  assetId: '',
  assigneeId: '',
};

export default function TicketsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [solutionText, setSolutionText] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const r = await ticketsApi.list();
      return (r.data as any).data as Ticket[];
    },
  });
  const { data: assets = [] } = useQuery({
    queryKey: ['assets-simple'],
    queryFn: async () => {
      const r = await assetsApi.list();
      return (r.data as any).data as any[];
    },
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await usersApi.list();
      return (r.data as any).data as any[];
    },
  });
  const { data: ticketDetail } = useQuery({
    queryKey: ['ticket-detail', detailTicket?.id],
    queryFn: async () => {
      const r = await ticketsApi.get(detailTicket!.id);
      return r.data as Ticket;
    },
    enabled: !!detailTicket,
    refetchInterval: 8000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets.filter((t) => {
      const ms = !q || t.title.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q);
      const ss = statusFilter === 'ALL' || t.status === statusFilter;
      return ms && ss;
    });
  }, [tickets, search, statusFilter]);

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast({ title: 'Título y descripción son requeridos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await ticketsApi.create({
        ...form,
        assetId: form.assetId || undefined,
        assigneeId: form.assigneeId || undefined,
      });
      toast({ title: 'Ticket creado' });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setDialogOpen(false);
      setForm({ ...EMPTY });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!detailTicket || !replyMsg.trim()) return;
    try {
      await ticketsApi.reply(detailTicket.id, { message: replyMsg });
      toast({ title: 'Mensaje enviado' });
      qc.invalidateQueries({ queryKey: ['ticket-detail', detailTicket.id] });
      setReplyMsg('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleSelfAssign = async () => {
    if (!detailTicket) return;
    try {
      await ticketsApi.selfAssign(detailTicket.id);
      toast({ title: 'Ticket auto-asignado' });
      qc.invalidateQueries({ queryKey: ['ticket-detail', detailTicket.id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!detailTicket) return;
    setUpdatingStatus(true);
    try {
      const data: any = { status };
      if (status === 'RESOLVED' && solutionText.trim()) {
        data.solution = solutionText.trim();
      }
      await ticketsApi.update(detailTicket.id, data);
      toast({ title: `Ticket actualizado a ${TICKET_STATUS_LABELS[status as keyof typeof TICKET_STATUS_LABELS]}` });
      qc.invalidateQueries({ queryKey: ['ticket-detail', detailTicket.id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setShowResolveForm(false);
      setSolutionText('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReassign = async (assigneeId: string) => {
    if (!detailTicket) return;
    try {
      await ticketsApi.update(detailTicket.id, { assigneeId: assigneeId || null });
      toast({ title: 'Ticket reasignado' });
      qc.invalidateQueries({ queryKey: ['ticket-detail', detailTicket.id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' });
    }
  };

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Tickets"
        subtitle="Sistema de soporte y seguimiento de incidencias"
        action={
          <Button
            onClick={() => {
              setForm({ ...EMPTY });
              setDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-sm gap-1.5"
          >
            <Plus size={15} /> Nuevo ticket
          </Button>
        }
      />
      <SectionWrapper className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            label: 'Abiertos',
            value: openCount,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            filter: 'OPEN',
          },
          {
            label: 'En proceso',
            value: inProgCount,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            filter: 'IN_PROGRESS',
          },
          {
            label: 'Resueltos',
            value: resolvedCount,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            filter: 'RESOLVED',
          },
        ].map((k, i) => (
          <StaggeredItem key={k.label} index={i} baseDelay={0}>
            <button onClick={() => setStatusFilter(k.filter)} className="text-left w-full">
              <Card className="border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`${k.bg} ${k.color} w-9 h-9 rounded-xl flex items-center justify-center`}
                  >
                    <TicketIcon size={16} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                    <p className="text-xs text-slate-400">{k.label}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          </StaggeredItem>
        ))}
      </SectionWrapper>
      <SectionWrapper delay={100}>
        <Card className="border-slate-100 rounded-2xl mb-4">
          <CardContent className="p-3 flex flex-wrap gap-3 items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar tickets..."
              className="w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">Todos los estados</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <span className="ml-auto text-xs text-slate-400">
              {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
            </span>
          </CardContent>
        </Card>
      </SectionWrapper>
      <SectionWrapper delay={200}>
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={TicketIcon}
            title="Sin tickets"
            subtitle="Crea el primero con el botón de arriba"
          />
        ) : (
          <Card className="border-slate-100 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="hidden md:table-cell">Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Asignado a</TableHead>
                  <TableHead className="hidden lg:table-cell">Creado</TableHead>
                  <TableHead className="text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>{' '}
              <TableBody>
                {filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    onClick={() => setDetailTicket(t)}
                    className="cursor-pointer hover:bg-blue-50/20 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-slate-500">{t.code}</TableCell>
                    <TableCell className="font-medium text-slate-800 max-w-[200px] truncate">
                      {t.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                      {TICKET_CATEGORY_LABELS[t.category]}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status={t.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                      {t.assignee?.name || 'Sin asignar'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailTicket(t);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
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
      </SectionWrapper>
      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => f('title', e.target.value)}
                placeholder="Describe el problema brevemente"
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Categoría</Label>
                <select
                  value={form.category}
                  onChange={(e) => f('category', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {TICKET_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Prioridad</Label>
                <select
                  value={form.priority}
                  onChange={(e) => f('priority', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Activo relacionado</Label>
                <select
                  value={form.assetId}
                  onChange={(e) => f('assetId', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Sin activo</option>
                  {assets.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Asignar a</Label>
                <select
                  value={form.assigneeId}
                  onChange={(e) => f('assigneeId', e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Sin asignar</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Descripción *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => f('description', e.target.value)}
                placeholder="Describe detalladamente el problema..."
                rows={4}
                className="text-sm rounded-xl"
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
              {saving ? 'Creando...' : 'Crear ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>{' '}
      {/* Detail / Chat Dialog */}
      <Dialog open={!!detailTicket} onOpenChange={(o) => !o && setDetailTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 shrink-0 overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {/* ── Badges row ── */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-mono text-xs text-slate-400">
                    {(ticketDetail || detailTicket)?.code}
                  </span>
                  <StatusBadge status={(ticketDetail || detailTicket)?.status || ''} />
                  <StatusBadge status={(ticketDetail || detailTicket)?.priority || ''} />
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {TICKET_CATEGORY_LABELS[(ticketDetail || detailTicket)?.category as any] || ''}
                  </span>
                </div>

                {/* ── Title & Description ── */}
                <h2 className="text-base font-semibold text-slate-900">
                  {(ticketDetail || detailTicket)?.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">
                  {(ticketDetail || detailTicket)?.description}
                </p>
                {/* Imágenes en la descripción */}
                {ticketDetail?.description && extractImageUrls(ticketDetail.description).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extractImageUrls(ticketDetail.description).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group">
                        <img
                          src={url}
                          alt={`Adjunto ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-xl border border-slate-200 group-hover:border-blue-300 transition-colors"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* ── Creator Data ── */}
                {(ticketDetail?.creator?.email || ticketDetail?.creator?.phone || ticketDetail?.reportedUser) && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                    {ticketDetail.creator?.name && (
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        {ticketDetail.creator.name}
                      </span>
                    )}
                    {ticketDetail.creator?.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        {ticketDetail.creator.email}
                      </span>
                    )}
                    {ticketDetail.creator?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        {ticketDetail.creator.phone}
                      </span>
                    )}
                    {ticketDetail.reportedUser && (
                      <span className="text-amber-600 font-medium">
                        Usuario dominio: {ticketDetail.reportedUser}
                      </span>
                    )}
                  </div>
                )}

                {/* ── Asset Links ── */}
                {(ticketDetail || detailTicket)?.asset && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a
                      href={`/dashboard/assets/${(ticketDetail || detailTicket)?.asset?.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                    >
                      <Package size={12} />
                      Ver activo: {(ticketDetail || detailTicket)?.asset?.name} →
                    </a>
                    <a
                      href={`/dashboard/maintenance?assetCode=${encodeURIComponent((ticketDetail || detailTicket)?.asset?.code || '')}`}
                      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline font-medium"
                    >
                      <Wrench size={12} />
                      Mantenimiento
                    </a>
                    <a
                      href={`/dashboard/discovery?search=${encodeURIComponent((ticketDetail || detailTicket)?.asset?.code || '')}`}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline font-medium"
                    >
                      <Monitor size={12} />
                      Discovery
                    </a>
                  </div>
                )}

                {/* ── Solution Block ── */}
                {ticketDetail?.solution && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        Solución
                      </span>
                    </div>
                    <p className="text-sm text-emerald-800 whitespace-pre-wrap">
                      {ticketDetail.solution}
                    </p>
                  </div>
                )}

                {/* ── CSAT ── */}
                {ticketDetail &&
                  ['RESOLVED', 'CLOSED'].includes(ticketDetail.status) &&
                  !ticketDetail.csatScore && (
                    <CsatSurvey
                      ticketId={ticketDetail.id}
                      onSubmitted={() =>
                        qc.invalidateQueries({ queryKey: ['ticket-detail', ticketDetail.id] })
                      }
                    />
                  )}

                {ticketDetail?.csatScore && (
                  <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-emerald-700">
                      Satisfacción: {ticketDetail.csatScore}/5
                    </span>
                    {ticketDetail.csatComment && (
                      <span className="text-xs text-emerald-600 ml-2">
                        "{ticketDetail.csatComment}"
                      </span>
                    )}
                  </div>
                )}

                {/* ── Action Bar ── */}
                {ticketDetail && ticketDetail.status !== 'CLOSED' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    {/* Status actions */}
                    <div className="flex flex-wrap gap-2">
                      {ticketDetail.status === 'OPEN' && (
                        <button
                          onClick={() => handleStatusChange('IN_PROGRESS')}
                          disabled={updatingStatus}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <ArrowRightCircle size={13} />
                          Tomar ticket
                        </button>
                      )}
                      {['OPEN', 'IN_PROGRESS', 'WAITING_ON_USER'].includes(ticketDetail.status) && (
                        <>
                          {!showResolveForm ? (
                            <button
                              onClick={() => setShowResolveForm(true)}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              Resolver
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowResolveForm(false)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              <XCircle size={13} />
                              Cancelar
                            </button>
                          )}
                        </>
                      )}
                      {ticketDetail.status === 'RESOLVED' && (
                        <button
                          onClick={() => handleStatusChange('CLOSED')}
                          disabled={updatingStatus}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Cerrar ticket
                        </button>
                      )}
                    </div>

                    {/* Solution textarea (when resolving) */}
                    {showResolveForm && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <FileText size={12} />
                          Solución / Procedimiento realizado
                        </label>
                        <Textarea
                          value={solutionText}
                          onChange={(e) => setSolutionText(e.target.value)}
                          placeholder="Describe la solución aplicada o el procedimiento realizado para resolver el ticket..."
                          rows={3}
                          className="text-sm rounded-xl resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusChange('RESOLVED')}
                            disabled={updatingStatus || !solutionText.trim()}
                            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {updatingStatus ? 'Guardando...' : 'Resolver con solución'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Priority & Reassign */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Prioridad:</span>                          <select
                            value={ticketDetail.priority}
                            onChange={async (e) => {
                              try {
                                await ticketsApi.changePriority(ticketDetail.id, e.target.value);
                                toast({ title: 'Prioridad actualizada' });
                                qc.invalidateQueries({ queryKey: ['ticket-detail', ticketDetail.id] });
                                qc.invalidateQueries({ queryKey: ['tickets'] });
                              } catch {
                                toast({ title: 'Error al cambiar prioridad', variant: 'destructive' });
                              }
                            }}
                          className="h-7 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Asignado a:</span>
                        <select
                          value={ticketDetail.assignee?.id || ''}
                          onChange={(e) => handleReassign(e.target.value)}
                          className="h-7 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">Sin asignar</option>
                          {users.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      {!ticketDetail.assignee && (
                        <button
                          onClick={handleSelfAssign}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <User size={12} />
                          Auto-asignarme
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Messages Thread ── */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-3"
            style={{ minHeight: '200px', maxHeight: '340px' }}
          >
            {(ticketDetail?.messages || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <MessageSquare size={28} className="text-slate-200 mb-2" />
                <p className="text-sm">Sin mensajes aún</p>
              </div>
            ) : (
              (ticketDetail?.messages || []).map((msg: any) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isInternal ? 'opacity-70' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                    {msg.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700">{msg.user?.name}</span>
                      {msg.isInternal && (
                        <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 rounded font-semibold">
                          Interno
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(msg.createdAt).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5 bg-slate-50 rounded-xl px-3 py-2 whitespace-pre-wrap">
                      {msg.message}
                    </p>
                    {/* Imágenes en el mensaje */}
                    {extractImageUrls(msg.message).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {extractImageUrls(msg.message).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={`Imagen ${i + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Reply Area ── */}
          <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0">
            <Textarea
              value={replyMsg}
              onChange={(e) => setReplyMsg(e.target.value)}
              placeholder="Escribe una respuesta... (Ctrl+Enter para enviar)"
              rows={2}
              className="text-sm rounded-xl flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply();
              }}
            />
            <Button
              onClick={handleReply}
              disabled={!replyMsg.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 self-end h-9 text-sm shrink-0"
            >
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Extraer URLs de imágenes de un texto ───────────────────────────────────────
function extractImageUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'\)>]+(?:\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s"'\)>]*)?)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

// ── Componente CSAT Survey ──────────────────────────────────────────────────────
function CsatSurvey({ ticketId, onSubmitted }: { ticketId: string; onSubmitted: () => void }) {
  const { toast } = useToast();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const labels = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  const handleSubmit = async () => {
    if (score === 0) {
      toast({ title: 'Selecciona una puntuación', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const token = getAccessToken();
      await axios.post(
        `/api/tickets/${ticketId}/csat`,
        { score, comment },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({ title: '¡Gracias por tu evaluación!' });
      onSubmitted();
    } catch {
      toast({ title: 'Error al enviar evaluación', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Star size={12} className="text-amber-400 fill-amber-400" />
        ¿Qué tan satisfecho estás con la resolución?
      </p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setScore(n)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
              score >= n
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-white text-slate-400 border border-slate-200 hover:border-amber-200'
            }`}
            title={labels[n - 1]}
          >
            {n}
          </button>
        ))}
      </div>
      {score > 0 && (
        <>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentario adicional (opcional)..."
            className="w-full h-8 rounded-lg border border-slate-200 text-xs px-3 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full h-8 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar evaluación'}
          </button>
        </>
      )}
    </div>
  );
}
