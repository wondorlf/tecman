import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.resolved !== undefined) {
      where.resolved = query.resolved === 'true';
    }
    if (query.assetId) where.assetId = query.assetId;
    if (query.type) where.type = query.type;

    // Búsqueda por título o mensaje
    if (query.search) {
      where.OR = [{ title: { contains: query.search } }, { message: { contains: query.search } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: [{ resolved: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.alert.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async create(data: any) {
    return this.prisma.alert.create({
      data,
      include: {
        asset: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async resolve(id: string, resolvedBy?: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    return this.prisma.alert.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: resolvedBy || undefined,
      },
    });
  }

  // ── Verificación automática de alertas pendientes ─────────────────────────
  async checkAndCreateAlerts() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let created = 0;

    // 1. Garantías por vencer en 30 días
    const expiringWarranty = await this.prisma.asset.findMany({
      where: {
        warrantyExpiry: { lte: in30Days, gte: now },
        status: { not: 'DISPOSED' },
      },
      select: { id: true, name: true, code: true, warrantyExpiry: true },
    });

    for (const asset of expiringWarranty) {
      const exists = await this.prisma.alert.findFirst({
        where: { assetId: asset.id, type: 'WARRANTY_EXPIRY', resolved: false },
      });
      if (!exists) {
        await this.prisma.alert.create({
          data: {
            assetId: asset.id,
            type: 'WARRANTY_EXPIRY',
            priority: 'HIGH',
            title: `Garantía por vencer: ${asset.code}`,
            message: `La garantía del activo "${asset.name}" (${asset.code}) vence el ${asset.warrantyExpiry!.toISOString().split('T')[0]}.`,
            dueDate: asset.warrantyExpiry,
          },
        });
        created++;
      }
    }

    // 2. Mantenimientos pendientes vencidos
    const overdueMaint = await this.prisma.maintenance.findMany({
      where: {
        scheduledDate: { lt: now },
        status: { in: ['PENDING', 'SCHEDULED'] },
      },
      include: { asset: { select: { id: true, name: true, code: true } } },
    });

    for (const maint of overdueMaint) {
      const exists = await this.prisma.alert.findFirst({
        where: { assetId: maint.assetId, type: 'MAINTENANCE_DUE', resolved: false },
      });
      if (!exists) {
        await this.prisma.alert.create({
          data: {
            assetId: maint.assetId,
            type: 'MAINTENANCE_DUE',
            priority: 'CRITICAL',
            title: `Mantenimiento vencido: ${maint.code}`,
            message: `El mantenimiento ${maint.code} del activo "${maint.asset.name}" estaba programado para ${maint.scheduledDate!.toISOString().split('T')[0]} y no se ha completado.`,
            dueDate: maint.scheduledDate,
          },
        });
        created++;
      }
    }

    return { checked: true, alertsCreated: created };
  }
}
