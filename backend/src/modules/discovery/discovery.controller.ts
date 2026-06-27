import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Put,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { DiscoveryService } from './discovery.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de dispositivos descubiertos' })
  async getStats() {
    return this.discoveryService.getStats();
  }

  @Get('agent-metrics')
  @ApiOperation({ summary: 'Obtener métricas de agentes (versiones, última conexión, etc.)' })
  async getAgentMetrics() {
    return this.discoveryService.getAgentMetrics();
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los dispositivos descubiertos' })
  async findAll(@Query() query: Record<string, string> & PaginationDto) {
    return this.discoveryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un dispositivo descubierto' })
  async findOne(@Param('id') id: string) {
    return this.discoveryService.findOne(id);
  }

  @Get(':id/changes')
  @ApiOperation({ summary: 'Obtener historial de cambios de hardware' })
  async getChanges(@Param('id') id: string) {
    return this.discoveryService.getChanges(id);
  }

  @Public()
  @Post('agent')
  @ApiOperation({ summary: 'Recibir datos del Agente de descubrimiento' })
  async receiveAgentData(@Body() payload: any, @Headers('x-api-key') apiKey?: string) {
    // Validar API key del agente de descubrimiento
    // Primero intentar desde Tenant (configurado en /admin), fallback a env var
    const tenantKey = await this.discoveryService.getApiKey();
    const expectedKey = tenantKey || process.env.DISCOVERY_API_KEY || 'discovery-default-key-change-me';
    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('API key inválida para el agente de descubrimiento');
    }
    const result = await this.discoveryService.processAgentData(payload);
    return { success: true, data: result };
  }

  @Put(':id/link-to-asset')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vincular dispositivo discovery a activo existente o crear nuevo' })
  async linkToAsset(
    @Param('id') id: string,
    @Body() body: { createNew: boolean; assetData?: any },
  ) {
    return this.discoveryService.linkDiscoveryDevice(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un dispositivo discovery' })
  async remove(@Param('id') id: string) {
    return this.discoveryService.remove(id);
  }
}
