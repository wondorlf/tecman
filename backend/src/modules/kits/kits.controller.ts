import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KitsService } from './kits.service.js';

@ApiTags('kits')
@ApiBearerAuth()
@Controller('kits')
export class KitsController {
  constructor(private readonly kitsService: KitsService) {}

  @Get('check-name/:name')
  @ApiOperation({ summary: 'Verificar disponibilidad de nombre de kit' })
  async checkName(@Param('name') name: string) {
    return this.kitsService.checkNameAvailability(name);
  }

  @Get()
  @ApiOperation({ summary: 'Listar kits' })
  findAll(@Query() query: Record<string, string>) {
    return this.kitsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un kit' })
  findOne(@Param('id') id: string) {
    return this.kitsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo kit' })
  create(@Body() data: { name: string; description?: string; parentAssetId?: string }) {
    return this.kitsService.create(data);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Añadir activo al kit' })
  addItem(@Param('id') id: string, @Body() data: { assetId: string }) {
    return this.kitsService.addItem(id, data.assetId);
  }

  @Delete(':id/items/:assetId')
  @ApiOperation({ summary: 'Remover activo del kit' })
  removeItem(@Param('id') id: string, @Param('assetId') assetId: string) {
    return this.kitsService.removeItem(id, assetId);
  }
}
