import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';

@Injectable()
export class KitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.kit.findMany({
        where,
        include: {
          parentAsset: { select: { id: true, name: true, code: true } },
          _count: { select: { items: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.kit.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const kit = await this.prisma.kit.findUnique({
      where: { id },
      include: {
        parentAsset: true,
        items: { include: { asset: true } },
      },
    });
    if (!kit) throw new NotFoundException(`Kit ${id} no encontrado`);
    return kit;
  }

  async checkNameAvailability(name: string): Promise<{ available: boolean; usedBy?: string }> {
    const existing = await this.prisma.kit.findUnique({ where: { name } });
    if (existing) {
      return { available: false, usedBy: existing.name };
    }
    return { available: true };
  }

  async create(data: { name: string; description?: string; parentAssetId?: string }) {
    const exists = await this.prisma.kit.findUnique({ where: { name: data.name } });
    if (exists) throw new ConflictException(`El kit ${data.name} ya existe`);

    const kitData: any = { name: data.name, description: data.description };

    // Un activo puede ser el principal del kit
    if (data.parentAssetId) {
      kitData.parentAsset = { connect: { id: data.parentAssetId } };
    }

    return this.prisma.kit.create({ data: kitData });
  }

  async addItem(kitId: string, assetId: string) {
    await this.findOne(kitId);

    // Verificar si el activo ya pertenece a otro kit (ya que es 1:1 por activo)
    const currentItem = await this.prisma.kitItem.findUnique({ where: { assetId } });
    if (currentItem) {
      throw new ConflictException(`El activo ya pertenece a otro kit`);
    }

    return this.prisma.kitItem.create({
      data: { kitId, assetId },
      include: { asset: { select: { id: true, name: true } } },
    });
  }

  async removeItem(kitId: string, assetId: string) {
    const item = await this.prisma.kitItem.findUnique({ where: { assetId } });
    if (!item || item.kitId !== kitId) {
      throw new NotFoundException(`El activo no está en este kit`);
    }
    return this.prisma.kitItem.delete({ where: { assetId } });
  }
}
