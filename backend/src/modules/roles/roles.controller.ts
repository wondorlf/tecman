import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @Roles('Administrador', 'Superadministrador Egan')
  @ApiOperation({ summary: 'Actualizar rol (nombre, descripción, permisos)' })
  update(@Param('id') id: string, @Body() dto: { name?: string; description?: string; permissions?: string }) {
    return this.rolesService.update(id, dto);
  }
}
