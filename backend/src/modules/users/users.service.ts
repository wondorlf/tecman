import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: Record<string, string>) {
    const page = Number(query?.page) || 1;
    const limit = Math.min(Number(query?.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Búsqueda por nombre o email
    if (query?.search) {
      where.OR = [{ name: { contains: query.search } }, { email: { contains: query.search } }];
    }

    if (query?.active !== undefined) {
      where.active = query.active === 'true';
    }

    const select = {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      active: true,
      roleId: true,
      telegramChatId: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        active: true,
        roleId: true,
        telegramChatId: true,
        createdAt: true,
        role: { select: { id: true, name: true, permissions: true } },
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(emailOrUsername: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
      include: { role: true },
    });
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('La contraseña debe contener al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('La contraseña debe contener al menos una letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('La contraseña debe contener al menos un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_-]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe contener al menos un carácter especial (!@#$%^&*)',
      );
    }
  }

  async create(data: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('El correo ya está en uso');

    if (data.password) {
      this.validatePassword(data.password);
    }

    const hashed = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, password: hashed },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        telegramChatId: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        telegramChatId: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: { id: true, name: true, active: true },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }
}
