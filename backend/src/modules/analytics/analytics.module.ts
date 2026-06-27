import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
