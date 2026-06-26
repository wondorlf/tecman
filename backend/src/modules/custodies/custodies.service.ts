import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';

@Injectable()
export class CustodiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.userId) where.userId = query.userId;

    // Activas o históricas
    if (query.active === 'true') where.returnedAt = null;
    else if (query.active === 'false') where.returnedAt = { not: null };

    if (query.search) {
      where.OR = [
        { asset: { name: { contains: query.search } } },
        { asset: { code: { contains: query.search } } },
        { user: { name: { contains: query.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.custody.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { assignedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.custody.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async assign(data: { assetId: string; userId: string; notes?: string }) {
    // Si ya está asignado a alguien y no ha sido devuelto, marcarlo como devuelto
    await this.prisma.custody.updateMany({
      where: { assetId: data.assetId, returnedAt: null },
      data: { returnedAt: new Date() },
    });

    const custody = await this.prisma.custody.create({
      data,
      include: {
        asset: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // Registrar en la hoja de vida
    const hv = await this.prisma.hojaVida.findUnique({ where: { assetId: data.assetId } });
    if (hv) {
      await this.prisma.hojaVidaEvent.create({
        data: {
          hojaVidaId: hv.id,
          type: 'CUSTOM',
          description: `Custodia asignada a ${custody.user.name}`,
          data: JSON.stringify({ userId: data.userId, custodyId: custody.id }),
        },
      });
    }

    return custody;
  }

  async returnAsset(id: string, notes?: string) {
    const custody = await this.prisma.custody.findUnique({
      where: { id },
      include: { asset: true, user: true },
    });
    if (!custody) throw new NotFoundException(`Custodia ${id} no encontrada`);

    const updated = await this.prisma.custody.update({
      where: { id },
      data: {
        returnedAt: new Date(),
        notes: notes ? `${custody.notes || ''}\n[Devolución]: ${notes}` : custody.notes,
      },
    });

    const hv = await this.prisma.hojaVida.findUnique({ where: { assetId: custody.assetId } });
    if (hv) {
      await this.prisma.hojaVidaEvent.create({
        data: {
          hojaVidaId: hv.id,
          type: 'CUSTOM',
          description: `Custodia devuelta por ${custody.user.name}`,
          data: JSON.stringify({ userId: custody.userId, custodyId: custody.id }),
        },
      });
    }

    return updated;
  }
}
