import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    this.logger.debug(`Intentando login para: ${email}`);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.debug(`Usuario no encontrado en la base de datos.`);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    this.logger.debug(`Usuario encontrado: ${user.email} (ID: ${user.id}). Activo: ${user.active}`);
    if (!user.active)
      throw new UnauthorizedException('Usuario desactivado. Contacta al administrador.');

    const valid = await bcrypt.compare(password, user.password);
    this.logger.debug(`¿Contraseña válida?: ${valid}`);

    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: {
    id: string;
    email: string;
    roleId: string;
    name: string;
    role: { name: string };
  }) {
    const payload = { sub: user.id, email: user.email, roleId: user.roleId };
    const accessToken = this.jwtService.sign(payload);

    // Generar refresh token
    const refreshToken = randomUUID();
    const refreshTokenExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');

    // Calcular fecha de expiración
    const expiresAt = new Date();
    if (refreshTokenExpiresIn.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(refreshTokenExpiresIn));
    } else if (refreshTokenExpiresIn.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(refreshTokenExpiresIn));
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7); // default: 7 días
    }

    // Almacenar refresh token en BD
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.expiresAt < new Date()) {
      // Eliminar token expirado
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expirado. Inicia sesión nuevamente.');
    }

    if (!stored.user.active) {
      throw new UnauthorizedException('Usuario desactivado. Contacta al administrador.');
    }

    // Eliminar el refresh token usado (rotación)
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    // Generar nuevos tokens
    const payload = { sub: stored.user.id, email: stored.user.email, roleId: stored.user.roleId };
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.user.id,
        expiresAt,
      },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: {
        id: stored.user.id,
        name: stored.user.name,
        email: stored.user.email,
        role: stored.user.role,
      },
    };
  }

  async logout(userId: string) {
    // Eliminar todos los refresh tokens del usuario
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return { message: 'Sesión cerrada exitosamente' };
  }

  async me(userId: string) {
    return this.usersService.findOne(userId);
  }
}
