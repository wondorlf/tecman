import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TicketsGateway } from './tickets.gateway.js';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.creatorId) where.creatorId = query.creatorId;
    if (query.category) where.category = query.category;

    // Búsqueda por código, título o descripción
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true, telegramChatId: true } },
          assignee: { select: { id: true, name: true, email: true, telegramChatId: true } },
          asset: { select: { id: true, name: true, code: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, telegramChatId: true } },
        assignee: { select: { id: true, name: true, email: true, telegramChatId: true } },
        asset: { select: { id: true, name: true, code: true } },
        messages: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);
    return ticket;
  }

  async checkCodeAvailability(code: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.ticket.findUnique({ where: { code } });
    return { available: !existing };
  }

  async findByCode(code: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { code },
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true, code: true } },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${code} no encontrado`);
    return ticket;
  }

  async create(data: any, creatorId: string) {
    // Generación atómica del código: busca el máximo número numérico entre los códigos TKT-
    // Primero intenta con orden descendente (más rápido si los códigos son limpios)
    const allCodes = await this.prisma.ticket.findMany({
      select: { code: true },
    });
    let maxNum = 0;
    for (const t of allCodes) {
      const match = t.code.match(/^TKT-(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    const code = `TKT-${String(nextNum).padStart(4, '0')}`;

    const { macAddress, creatorName, creatorPhone, ...ticketData } = data;
    let finalAssetId = ticketData.assetId;

    // Si viene de un Agente (macAddress), intentar vincular el activo automáticamente
    if (macAddress) {
      const discovered = await this.prisma.discoveredDevice.findUnique({
        where: { macAddress },
        select: { assetId: true },
      });
      if (discovered && discovered.assetId) {
        finalAssetId = discovered.assetId;
      }
    }

    const ticket = await this.prisma.ticket.create({
      data: { ...ticketData, assetId: finalAssetId, code, creatorId },
      include: {
        creator: {
          select: { id: true, name: true, email: true, telegramChatId: true, username: true },
        },
        assignee: { select: { id: true, name: true, email: true, telegramChatId: true } },
        asset: { select: { id: true, name: true, code: true } },
      },
    });

    // Send notifications
    await this.notificationsService.sendTicketCreatedNotification(
      ticket.creator?.email || '',
      ticket.code,
      ticket.creator?.telegramChatId || undefined,
      {
        title: ticket.title,
        category: ticket.category,
        creatorName:
          ticket.creator?.name ||
          ((ticket as Record<string, unknown>).reportedUser as string) ||
          'Usuario',
      },
    );

    // Real-time WebSocket notification
    this.ticketsGateway.emitTicketCreated(ticket);

    return ticket;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.status === 'RESOLVED' && !data.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    return this.prisma.ticket.update({
      where: { id },
      data: updateData,
    });
  }

  async submitCsat(id: string, data: { score: number; comment?: string }) {
    await this.findOne(id);
    return this.prisma.ticket.update({
      where: { id },
      data: {
        csatScore: data.score,
        csatComment: data.comment || null,
        csatAnsweredAt: new Date(),
      },
    });
  }

  async addMessage(ticketId: string, data: any, userId: string) {
    await this.findOne(ticketId);
    return this.prisma.ticketMessage.create({
      data: { ticketId, userId, ...data },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // ── Exportar tickets para XLSX con lógica de cumplimiento ─────────────────
  async exportAll() {
    const data = await this.prisma.ticket.findMany({
      include: {
        creator: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        asset: { select: { name: true, code: true } },
        sla: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return data.map((t) => {
      const created = new Date(t.createdAt);
      const due = t.dueDate ? new Date(t.dueDate) : null;
      const resolved = t.resolvedAt ? new Date(t.resolvedAt) : null;

      let cumplimiento = 'PENDIENTE';
      if (resolved && due) {
        cumplimiento = resolved <= due ? 'A TIEMPO' : 'EXTEMPORÁNEO';
      } else if (!resolved && due) {
        if (new Date() > due) cumplimiento = 'ATRASADO';
      }

      return {
        Código: t.code,
        Título: t.title,
        Categoría: t.category,
        Prioridad: t.priority,
        Estado: t.status,
        Creador: t.creator.name,
        'Email Creador': t.creator.email,
        Asignado: t.assignee?.name || 'Sin asignar',
        'Email Asignado': t.assignee?.email || '',
        Activo: t.asset ? `${t.asset.name} (${t.asset.code})` : 'N/A',
        SLA: t.sla?.name || 'Estándar',
        'Fecha Creación': created.toISOString().split('T')[0],
        'Fecha Límite': due ? due.toISOString().split('T')[0] : '',
        'Fecha Resolución': resolved ? resolved.toISOString().split('T')[0] : '',
        Cumplimiento: cumplimiento,
        Descripción: t.description,
      };
    });
  }
}
