import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException(`Rol ${id} no encontrado`);
    return role;
  }

  async update(id: string, data: { name?: string; description?: string; permissions?: string }) {
    await this.findOne(id);
    return this.prisma.role.update({
      where: { id },
      data,
      include: { _count: { select: { users: true } } },
    });
  }
}
