import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChangeRequestsService } from './change-requests.service.js';

@ApiTags('change-requests')
@ApiBearerAuth()
@Controller('change-requests')
export class ChangeRequestsController {
  constructor(private readonly rfcService: ChangeRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes de cambio (RFC)' })
  findAll(@Query() query: Record<string, string>) {
    return this.rfcService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un RFC' })
  findOne(@Param('id') id: string) {
    return this.rfcService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva solicitud de cambio' })
  create(
    @Body()
    data: {
      title: string;
      description: string;
      justification: string;
      riskLevel: string;
      requesterId: string;
      ticketId?: string;
    },
  ) {
    return this.rfcService.create(data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Actualizar estado y fechas programadas del RFC' })
  updateStatus(
    @Param('id') id: string,
    @Body() data: { status: string; scheduledStart?: string; scheduledEnd?: string },
  ) {
    let dates = undefined;
    if (data.scheduledStart && data.scheduledEnd) {
      dates = {
        start: new Date(data.scheduledStart),
        end: new Date(data.scheduledEnd),
      };
    }
    return this.rfcService.updateStatus(id, data.status, dates);
  }
}
