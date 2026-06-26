import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LocationsService } from './locations.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';

@ApiTags('locations')
@ApiBearerAuth()
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear ubicación' })
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ubicaciones' })
  findAll() {
    return this.locationsService.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar ubicación' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateLocationDto>) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar ubicación' })
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
