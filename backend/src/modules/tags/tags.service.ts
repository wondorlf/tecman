import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkNameAvailability(name: string): Promise<{ available: boolean; usedBy?: string }> {
    const existing = await this.prisma.tag.findUnique({ where: { name } });
    if (existing) {
      return { available: false, usedBy: existing.name };
    }
    return { available: true };
  }

  async findAll() {
    return this.prisma.tag.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; color?: string }) {
    const exists = await this.prisma.tag.findUnique({ where: { name: data.name } });
    if (exists) throw new ConflictException(`El tag ${data.name} ya existe`);

    return this.prisma.tag.create({ data });
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException(`Tag ${id} no encontrado`);
    return this.prisma.tag.delete({ where: { id } });
  }

  // Asignar tag a un activo
  async assignToAsset(assetId: string, tagId: string) {
    return this.prisma.assetTag.create({
      data: { assetId, tagId },
    });
  }

  // Remover tag de un activo
  async removeFromAsset(assetId: string, tagId: string) {
    return this.prisma.assetTag.delete({
      where: { assetId_tagId: { assetId, tagId } },
    });
  }
}
