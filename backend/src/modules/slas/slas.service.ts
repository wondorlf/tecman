import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SlasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sla.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    resolutionHours: number;
    responseHours: number;
  }) {
    return this.prisma.sla.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      resolutionHours: number;
      responseHours: number;
      active: boolean;
    }>,
  ) {
    return this.prisma.sla.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.sla.delete({ where: { id } });
  }
}
