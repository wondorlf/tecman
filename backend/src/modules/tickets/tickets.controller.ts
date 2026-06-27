import { Controller, Get, Post, Put, Body, Param, Query, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { CreateTicketMessageDto } from './dto/create-message.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { TenantsService } from '../tenants/tenants.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly tenantsService: TenantsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('public')
  @ApiOperation({ summary: 'Crear ticket desde portal público o Agente' })
  async createPublic(@Body() dto: CreateTicketDto) {
    let creatorId = '';

    // 1. Si viene un usuario de dominio (reportedUser), intentar mapearlo a un usuario real de TecMan
    if (dto.reportedUser) {
      const existingUser = await this.prisma.user.findFirst({
        where: { username: dto.reportedUser },
        select: { id: true },
      });
      if (existingUser) {
        creatorId = existingUser.id;
      }
    }

    // 2. Si no se encontró usuario de dominio, usar el usuario Invitado
    if (!creatorId) {
      const guest = await this.tenantsService.getGuestUser();
      creatorId = guest?.id || '';
    }

    return this.ticketsService.create(dto, creatorId);
  }

  @Public()
  @Get('public/track/:code')
  @ApiOperation({ summary: 'Consultar estado de ticket por código' })
  trackPublic(@Param('code') code: string) {
    return this.ticketsService.findByCode(code);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Verificar disponibilidad de código de ticket' })
  async checkCode(@Param('code') code: string) {
    return this.ticketsService.checkCodeAvailability(code);
  }

  @Post()
  @ApiOperation({ summary: 'Crear ticket' })
  create(@Body() dto: CreateTicketDto, @Request() req: { user?: { id: string } }) {
    return this.ticketsService.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets con filtros opcionales' })
  findAll(@Query() query: Record<string, string>) {
    return this.ticketsService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar todos los tickets a XLSX' })
  async exportXlsx(@Res() res: Response) {
    const rows = await this.ticketsService.exportAll();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=tickets_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID (incluye mensajes)' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar estado/asignación/prioridad/solución del ticket' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTicketDto> & { solution?: string },
  ) {
    return this.ticketsService.update(id, dto);
  }

  @Put(':id/self-assign')
  @ApiOperation({ summary: 'Auto-asignarse un ticket' })
  selfAssign(@Param('id') id: string, @Request() req: { user?: { id: string } }) {
    return this.ticketsService.selfAssign(id, req.user?.id);
  }

  @Put(':id/change-priority')
  @ApiOperation({ summary: 'Cambiar prioridad del ticket' })
  changePriority(@Param('id') id: string, @Body() dto: { priority: string }) {
    return this.ticketsService.update(id, { priority: dto.priority });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Agregar mensaje al ticket' })
  addMessage(
    @Param('id') id: string,
    @Body() dto: CreateTicketMessageDto,
    @Request() req: { user?: { id: string } },
  ) {
    return this.ticketsService.addMessage(id, dto, req.user?.id);
  }

  @Public()
  @Post(':id/csat')
  @ApiOperation({ summary: 'Enviar encuesta CSAT post-resolución' })
  submitCsat(@Param('id') id: string, @Body() dto: { score: number; comment?: string }) {
    return this.ticketsService.submitCsat(id, dto);
  }
}
