import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.supplier.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }
}
