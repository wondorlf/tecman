import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('feedback')
  @ApiOperation({ summary: 'Registrar feedback de solución del chatbot' })
  async trackFeedback(@Body() body: { solutionId: string; resolved: boolean; timestamp: string }) {
    try {
      // Store in a simple JSON log via a custom field or use audit table
      await this.prisma.audit.create({
        data: {
          userId: 'chatbot-anonymous',
          action: 'CHATBOT_FEEDBACK',
          entity: 'solution',
          entityId: body.solutionId,
          changes: JSON.stringify({
            resolved: body.resolved,
            timestamp: body.timestamp,
          }),
        },
      });
    } catch {
      // Silently fail - analytics shouldn't block user experience
    }
    return { ok: true };
  }

  @Public()
  @Post('view')
  @ApiOperation({ summary: 'Registrar vista de solución del chatbot' })
  async trackView(@Body() body: { solutionId: string; timestamp: string }) {
    try {
      await this.prisma.audit.create({
        data: {
          userId: 'chatbot-anonymous',
          action: 'CHATBOT_VIEW',
          entity: 'solution',
          entityId: body.solutionId,
          changes: JSON.stringify({ timestamp: body.timestamp }),
        },
      });
    } catch {}
    return { ok: true };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de chatbot' })
  async getStats() {
    try {
      const feedback = await this.prisma.audit.groupBy({
        by: ['entityId'],
        where: { action: 'CHATBOT_FEEDBACK' },
        _count: { id: true },
      });

      const resolved = await this.prisma.audit.groupBy({
        by: ['entityId'],
        where: { action: 'CHATBOT_FEEDBACK', changes: { contains: '"resolved":true' } },
        _count: { id: true },
      });

      const views = await this.prisma.audit.groupBy({
        by: ['entityId'],
        where: { action: 'CHATBOT_VIEW' },
        _count: { id: true },
      });

      return { feedback, resolved, views };
    } catch {
      return { feedback: [], resolved: [], views: [] };
    }
  }
}
