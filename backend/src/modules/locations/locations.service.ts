import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.location.findMany({
      include: {
        children: { orderBy: { name: 'asc' } },
        _count: { select: { assets: true } },
      },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.location.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.location.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.location.delete({ where: { id } });
  }
}
