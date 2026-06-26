import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { AlertsController } from './alerts.controller.js';
import { AlertsScheduler } from './alerts.scheduler.js';

@Module({
  providers: [AlertsService, AlertsScheduler],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
