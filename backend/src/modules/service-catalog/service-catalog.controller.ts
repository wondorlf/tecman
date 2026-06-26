import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceCatalogService } from './service-catalog.service.js';

@ApiTags('service-catalog')
@ApiBearerAuth()
@Controller('service-catalog')
export class ServiceCatalogController {
  constructor(private readonly catalogService: ServiceCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los servicios del catálogo' })
  findAll() {
    return this.catalogService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Añadir nuevo servicio al catálogo' })
  create(@Body() data: { name: string; description: string; category: string; type: string }) {
    return this.catalogService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar servicio del catálogo' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.catalogService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar servicio del catálogo' })
  remove(@Param('id') id: string) {
    return this.catalogService.remove(id);
  }
}
