import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SlasService } from './slas.service.js';

@ApiTags('slas')
@ApiBearerAuth()
@Controller('slas')
export class SlasController {
  constructor(private readonly slasService: SlasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar SLAs' })
  findAll() {
    return this.slasService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear SLA' })
  create(
    @Body()
    data: {
      name: string;
      description?: string;
      resolutionHours: number;
      responseHours: number;
    },
  ) {
    return this.slasService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar SLA' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.slasService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar SLA' })
  remove(@Param('id') id: string) {
    return this.slasService.remove(id);
  }
}
