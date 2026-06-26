import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'KPIs y estadísticas generales' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Actividad reciente: activos, mantenimientos y alertas' })
  getRecent() {
    return this.dashboardService.getRecent();
  }

  @Get('report')
  @ApiOperation({ summary: 'Exportar reporte mensual de KPIs a XLSX' })
  async downloadReport(@Res() res: Response) {
    const rows = await this.dashboardService.getReportData();

    const ws = XLSX.utils.json_to_sheet(rows);

    // Ajustar ancho de columnas
    ws['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 55 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte KPIs');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte-kpis-${new Date().toISOString().split('T')[0]}.xlsx`,
    );
    res.send(buffer);
  }
}
