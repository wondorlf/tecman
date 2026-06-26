import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LdapService } from './ldap.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('ldap')
@ApiBearerAuth()
@Controller('ldap')
export class LdapController {
  constructor(private readonly ldapService: LdapService) {}

  @Post('test')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Probar conexión con LDAP' })
  async testConnection() {
    await this.ldapService.testConnection();
    return { success: true, message: 'Conexión exitosa' };
  }

  @Post('sync/users')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Sincronizar usuarios desde LDAP' })
  syncUsers() {
    return this.ldapService.syncUsers();
  }

  @Post('sync/computers')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Sincronizar equipos desde LDAP' })
  syncComputers() {
    return this.ldapService.syncComputers();
  }
}
