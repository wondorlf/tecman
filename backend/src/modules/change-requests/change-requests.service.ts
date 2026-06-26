import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';

@Injectable()
export class ChangeRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.riskLevel) where.riskLevel = query.riskLevel;

    if (query.search) {
      where.OR = [{ code: { contains: query.search } }, { title: { contains: query.search } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.changeRequest.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true } },
          ticket: { select: { id: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.changeRequest.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async create(data: {
    title: string;
    description: string;
    justification: string;
    riskLevel: string;
    requesterId: string;
    ticketId?: string;
  }) {
    // Generar código atómico RFC-XXX
    const lastRfc = await this.prisma.changeRequest.findFirst({
      orderBy: { code: 'desc' },
    });

    let nextNumber = 1;
    if (lastRfc && lastRfc.code.startsWith('RFC-')) {
      const parts = lastRfc.code.split('-');
      if (parts.length === 2) {
        nextNumber = parseInt(parts[1], 10) + 1;
      }
    }

    const code = `RFC-${nextNumber.toString().padStart(4, '0')}`;

    return this.prisma.changeRequest.create({
      data: {
        ...data,
        code,
        status: 'DRAFT',
      },
    });
  }

  async updateStatus(id: string, status: string, scheduledDates?: { start: Date; end: Date }) {
    const updateData: any = { status };
    if (scheduledDates) {
      updateData.scheduledStart = scheduledDates.start;
      updateData.scheduledEnd = scheduledDates.end;
    }

    return this.prisma.changeRequest.update({
      where: { id },
      data: updateData,
    });
  }

  async findOne(id: string) {
    const rfc = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: {
        requester: true,
        ticket: true,
      },
    });
    if (!rfc) throw new NotFoundException(`RFC ${id} no encontrado`);
    return rfc;
  }
}
