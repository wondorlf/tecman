import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustodiesService } from './custodies.service.js';

@ApiTags('custodies')
@ApiBearerAuth()
@Controller('custodies')
export class CustodiesController {
  constructor(private readonly custodiesService: CustodiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar asignaciones/custodias' })
  findAll(@Query() query: Record<string, string>) {
    return this.custodiesService.findAll(query);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Asignar un activo a un usuario' })
  assign(@Body() data: { assetId: string; userId: string; notes?: string }) {
    return this.custodiesService.assign(data);
  }

  @Put(':id/return')
  @ApiOperation({ summary: 'Registrar la devolución de un activo' })
  returnAsset(@Param('id') id: string, @Body() data: { notes?: string }) {
    return this.custodiesService.returnAsset(id, data.notes);
  }
}
