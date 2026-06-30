import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MaintenanceStatus } from '@prisma/client';
import { paginate } from '../../common/dto/pagination.dto.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.assetId) where.assetId = query.assetId;
    if (query.type) where.type = query.type;
    if (query.technicianId) where.technicianId = query.technicianId;

    // Búsqueda por código o descripción o nombre del activo
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { description: { contains: query.search } },
        { asset: { name: { contains: query.search } } },
        { asset: { code: { contains: query.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.maintenance.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, code: true } },
          technician: { select: { id: true, name: true } },
          checklist: {
            select: {
              id: true,
              name: true,
              items: { orderBy: { order: 'asc' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.maintenance.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
      include: {
        asset: true,
        technician: true,
        checklist: { include: { items: { orderBy: { order: 'asc' } } } },
        evidence: true,
      },
    });
    if (!maintenance) throw new NotFoundException(`Mantenimiento ${id} no encontrado`);
    return maintenance;
  }

  async checkCodeAvailability(code: string, excludeId?: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.maintenance.findUnique({ where: { code } });
    if (existing && existing.id !== excludeId) {
      return { available: false };
    }
    return { available: true };
  }

  async create(data: any) {
    // Generación atómica del código: usa MAX del código existente
    const last = await this.prisma.maintenance.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const nextNum = last ? parseInt(last.code.replace('MNT-', ''), 10) + 1 : 1;
    const code = `MNT-${String(nextNum).padStart(5, '0')}`;

    return this.prisma.maintenance.create({
      data: { ...data, code },
      include: {
        asset: { select: { id: true, name: true, code: true } },
        technician: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.findOne(id);
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new Error(`No se puede editar un mantenimiento con estado ${existing.status}`);
    }
    return this.prisma.maintenance.update({
      where: { id },
      data,
      include: {
        asset: { select: { id: true, name: true, code: true } },
        technician: { select: { id: true, name: true } },
      },
    });
  }

  async complete(id: string, data: any) {
    const cleanData = { ...data };
    if (cleanData.checklistData && typeof cleanData.checklistData === 'object') {
      cleanData.checklistData = JSON.stringify(cleanData.checklistData);
    }
    await this.findOne(id);
    return this.prisma.maintenance.update({
      where: { id },
      data: {
        ...cleanData,
        status: MaintenanceStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  async uploadEvidence(
    id: string,
    fileData: {
      path: string;
      filename: string;
      mimeType: string;
      size: number;
      type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'SIGNATURE';
    },
  ) {
    await this.findOne(id);
    return this.prisma.evidence.create({
      data: { maintenanceId: id, ...fileData },
    });
  }

  async remove(id: string) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
      include: { evidence: { select: { filename: true } } },
    });
    if (!maintenance) throw new NotFoundException(`Mantenimiento ${id} no encontrado`);

    await this.prisma.$transaction(async (tx) => {
      for (const ev of maintenance.evidence) {
        await this.storageService
          .deleteFile(ev.filename)
          .catch((e: Error) =>
            this.logger.warn(`No se pudo eliminar evidencia ${ev.filename}: ${e.message}`),
          );
      }
      await tx.maintenance.delete({ where: { id } });
    });
  }

  // ── Exportar mantenimientos para XLSX con lógica de cumplimiento ───────────
  async exportAll() {
    const data = await this.prisma.maintenance.findMany({
      include: {
        asset: { select: { name: true, code: true } },
        technician: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    return data.map((m) => {
      const scheduled = m.scheduledDate ? new Date(m.scheduledDate) : null;
      const completed = m.completedAt ? new Date(m.completedAt) : null;

      let cumplimiento = 'PENDIENTE';
      if (completed && scheduled) {
        // Normalizar a fechas sin hora para comparar solo el día
        const sDate = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate());
        const cDate = new Date(completed.getFullYear(), completed.getMonth(), completed.getDate());

        cumplimiento = cDate <= sDate ? 'A TIEMPO' : 'EXTEMPORÁNEO';
      } else if (!completed && scheduled) {
        const today = new Date();
        const sDate = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate());
        const tDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (tDate > sDate) cumplimiento = 'ATRASADO';
      }

      return {
        Código: m.code,
        Activo: `${m.asset.name} (${m.asset.code})`,
        Tipo: m.type,
        Prioridad: m.priority,
        Estado: m.status,
        Descripción: m.description || '',
        'Fecha Programada': scheduled ? scheduled.toISOString().split('T')[0] : '',
        'Fecha Completado': completed ? completed.toISOString().split('T')[0] : '',
        Técnico: m.technician?.name || 'Sin asignar',
        'Email Técnico': m.technician?.email || '',
        Supervisor: m.createdBy?.name || 'Sistema',
        'Email Supervisor': m.createdBy?.email || '',
        Cumplimiento: cumplimiento,
        Diagnóstico: m.diagnosis || '',
        Solución: m.solution || '',
        Costo: m.cost ? Number(m.cost) : 0,
      };
    });
  }
}
