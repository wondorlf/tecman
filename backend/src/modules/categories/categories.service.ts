import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        subcategories: { orderBy: { name: 'asc' } },
        attributes: { orderBy: { name: 'asc' } },
        _count: { select: { assets: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async checkNameAvailability(name: string, excludeId?: string): Promise<{ available: boolean; usedBy?: string }> {
    const existing = await this.prisma.category.findUnique({ where: { name } });
    if (existing && existing.id !== excludeId) {
      return { available: false, usedBy: existing.name };
    }
    return { available: true };
  }

  async create(data: any) {
    const { available } = await this.checkNameAvailability(data.name);
    if (!available) {
      throw new ConflictException(`La categoría "${data.name}" ya existe`);
    }
    return this.prisma.category.create({
      data,
      include: { subcategories: true },
    });
  }

  async update(id: string, data: any) {
    if (data.name) {
      const existing = await this.prisma.category.findUnique({ where: { id } });
      if (existing && data.name !== existing.name) {
        const { available } = await this.checkNameAvailability(data.name, id);
        if (!available) {
          throw new ConflictException(`La categoría "${data.name}" ya existe`);
        }
      }
    }
    return this.prisma.category.update({
      where: { id },
      data,
      include: { subcategories: true },
    });
  }

  async remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  // ── Subcategories ──────────────────────────────────────────────────────────

  async createSubcategory(categoryId: string, data: { name: string; description?: string }) {
    return this.prisma.subcategory.create({
      data: { ...data, categoryId },
    });
  }

  async updateSubcategory(id: string, data: { name?: string; description?: string }) {
    return this.prisma.subcategory.update({
      where: { id },
      data,
    });
  }

  async removeSubcategory(id: string) {
    return this.prisma.subcategory.delete({ where: { id } });
  }
}
