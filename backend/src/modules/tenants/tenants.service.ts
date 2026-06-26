import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService implements OnModuleInit {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Ensure default tenant
    const tenantCount = await this.prisma.tenant.count();
    if (tenantCount === 0) {
      await this.prisma.tenant.create({
        data: {
          name: 'TecMan',
          primaryColor: '#16a34a',
          secondaryColor: '#0f172a',
          supportPortalTitle: 'Mesa de Ayuda TI',
          supportPortalSubtitle:
            'Sistema inteligente de reporte y seguimiento de incidencias técnicas.',
        },
      });
    }

    // Ensure Guest User for public tickets — with LIMITED role, NOT Administrador
    const guestEmail = 'guest@tecman.local';
    const guestUser = await this.prisma.user.findUnique({ where: { email: guestEmail } });
    if (!guestUser) {
      // Find a limited role for the guest user
      let guestRole = await this.prisma.role.findFirst({ where: { name: 'Portal Público' } });
      if (!guestRole) {
        guestRole = await this.prisma.role.findFirst({ where: { name: 'Gestor' } });
      }
      if (!guestRole) {
        guestRole = await this.prisma.role.findFirst({ where: { name: 'Técnico' } });
      }
      const fallbackRole = guestRole || (await this.prisma.role.findFirst());
      if (!fallbackRole) {
        this.logger.warn('[Tenants] No se encontró ningún rol para asignar al usuario guest');
        return;
      }
      const password = await bcrypt.hash('GuestTicket123!', 10);
      await this.prisma.user.create({
        data: {
          email: guestEmail,
          password,
          name: 'Portal Público (Invitado)',
          roleId: fallbackRole.id,
          active: true,
        },
      });
    }
  }

  async getTenantSettings() {
    return this.prisma.tenant.findFirst();
  }

  async updateTenantSettings(id: string, updateTenantDto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async getPublicSettings() {
    const settings = await this.prisma.tenant.findFirst({
      select: {
        name: true,
        logoUrl: true,
        companyName: true,
        companyLogoUrl: true,
        companyDocument: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        primaryColor: true,
        secondaryColor: true,
        supportPortalTitle: true,
        supportPortalSubtitle: true,
        supportPortalBackgroundUrl: true,
        maxUploadSize: true,
      },
    });

    if (!settings || !settings.maxUploadSize || settings.maxUploadSize <= 0) {
      return {
        ...settings,
        maxUploadSize: 10485760,
      };
    }

    return settings;
  }

  async getGuestUser() {
    return this.prisma.user.findUnique({ where: { email: 'guest@tecman.local' } });
  }
}
