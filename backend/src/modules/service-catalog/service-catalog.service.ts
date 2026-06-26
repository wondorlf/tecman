import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.serviceCatalog.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async create(data: { name: string; description: string; category: string; type: string }) {
    return this.prisma.serviceCatalog.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      type: string;
      active: boolean;
    }>,
  ) {
    return this.prisma.serviceCatalog.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.serviceCatalog.delete({ where: { id } });
  }
}
