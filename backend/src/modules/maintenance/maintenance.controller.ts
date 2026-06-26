import { Controller, Get, Post, Put, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto.js';

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Verificar disponibilidad de código de mantenimiento' })
  async checkCode(@Param('code') code: string) {
    return this.maintenanceService.checkCodeAvailability(code);
  }

  @Post()
  @ApiOperation({ summary: 'Crear orden de mantenimiento' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mantenimientos con filtros opcionales' })
  findAll(@Query() query: Record<string, string>) {
    return this.maintenanceService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar todos los mantenimientos a XLSX' })
  async exportXlsx(@Res() res: Response) {
    const rows = await this.maintenanceService.exportAll();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=mantenimientos_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener mantenimiento por ID' })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar mantenimiento' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateMaintenanceDto>) {
    return this.maintenanceService.update(id, dto);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Marcar mantenimiento como completado' })
  complete(@Param('id') id: string, @Body() dto: CompleteMaintenanceDto) {
    return this.maintenanceService.complete(id, dto);
  }
}
