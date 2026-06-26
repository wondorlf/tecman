import { Controller, Get, Post, Put, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service.js';
import { CreateAlertDto } from './dto/create-alert.dto.js';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear alerta' })
  create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar alertas con filtros, paginación y búsqueda' })
  findAll(@Query() query: Record<string, string>) {
    return this.alertsService.findAll(query);
  }

  @Post('check')
  @ApiOperation({
    summary: 'Verificar y generar alertas automáticas (garantías, mantenimiento vencido)',
  })
  checkAlerts() {
    return this.alertsService.checkAndCreateAlerts();
  }

  @Put(':id/resolve')
  @ApiOperation({ summary: 'Marcar alerta como resuelta' })
  resolve(@Param('id') id: string, @Request() req: any) {
    return this.alertsService.resolve(id, req.user?.id);
  }
}
