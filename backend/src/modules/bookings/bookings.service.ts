import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BookingStatus } from '@prisma/client';
import { paginate } from '../../common/dto/pagination.dto.js';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    if (query.search) {
      where.OR = [
        { asset: { name: { contains: query.search } } },
        { asset: { code: { contains: query.search } } },
        { user: { name: { contains: query.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async create(data: {
    assetId: string;
    userId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    // Validar cruce de reservas (Status no cancelado/devuelto)
    const conflicting = await this.prisma.booking.findFirst({
      where: {
        assetId: data.assetId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] },
        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
      },
    });

    if (conflicting) {
      throw new ConflictException(
        'El activo ya tiene una reserva en el rango de fechas seleccionado.',
      );
    }

    return this.prisma.booking.create({
      data: { ...data, startDate: start, endDate: end },
      include: {
        asset: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException(`Reserva ${id} no encontrada`);

    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }
}
