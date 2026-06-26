import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Get('public')
  getPublicSettings() {
    return this.tenantsService.getPublicSettings();
  }

  @Get('settings')
  @Roles('Administrador')
  getSettings() {
    return this.tenantsService.getTenantSettings();
  }

  @Get('discovery-key')
  @Roles('Administrador')
  async getDiscoveryKey() {
    const tenant = await this.tenantsService.getTenantSettings();
    return { discoveryApiKey: tenant?.discoveryApiKey || null };
  }

  @Patch('settings/:id')
  @Roles('Administrador')
  updateSettings(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.updateTenantSettings(id, updateTenantDto);
  }
}
