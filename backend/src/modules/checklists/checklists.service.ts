import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ChecklistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.checklist.findMany({
      include: {
        items: { orderBy: { order: 'asc' } },
        categories: true,
        _count: { select: { maintenances: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const cl = await this.prisma.checklist.findUnique({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!cl) throw new NotFoundException(`Checklist ${id} no encontrado`);
    return cl;
  }

  async create(data: any) {
    const { items, ...checklistData } = data;
    return this.prisma.checklist.create({
      data: {
        ...checklistData,
        items: items?.length
          ? {
              create: items.map((item: any, i: number) => ({
                ...item,
                order: item.order ?? i + 1,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const { items, ...checklistData } = data;

    // Si se envían ítems, eliminar los existentes y recrear
    if (items !== undefined) {
      await this.prisma.checklistItem.deleteMany({ where: { checklistId: id } });
      if (items.length > 0) {
        await this.prisma.checklistItem.createMany({
          data: items.map((item: any, i: number) => ({
            ...item,
            checklistId: id,
            order: item.order ?? i + 1,
          })),
        });
      }
    }

    return this.prisma.checklist.update({
      where: { id },
      data: checklistData,
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(id: string) {
    return this.prisma.checklist.delete({ where: { id } });
  }

  // ── Exportar checklists a XLSX ───────────────────────────────────────────
  async exportAll() {
    const data = await this.prisma.checklist.findMany({
      include: {
        items: { orderBy: { order: 'asc' } },
        _count: { select: { maintenances: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Primero, una fila por checklist con metadata
    const summaryRows = data.map((c) => ({
      Nombre: c.name,
      Descripción: c.description || '',
      'Tipo Mantenimiento': c.maintenanceType || 'Cualquiera',
      Activo: c.active ? 'Sí' : 'No',
      'Cant. Ítems': c.items.length,
      'Usado en Mantenimientos': c._count.maintenances,
      Creado: new Date(c.createdAt).toISOString().split('T')[0],
    }));

    // Luego, una fila por ítem de cada checklist
    const itemRows = data.flatMap((c) =>
      c.items.map((item, i) => ({
        Checklist: c.name,
        '#': i + 1,
        Ítem: item.label,
        Tipo: item.type,
        Obligatorio: item.required ? 'Sí' : 'No',
        Descripción: item.description || '',
      })),
    );

    return { summaryRows, itemRows };
  }
}
