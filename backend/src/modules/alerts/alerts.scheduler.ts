import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from './alerts.service.js';

/**
 * Ejecuta verificaciones automáticas de alertas.
 * - Cada 6 horas revisa garantías por vencer y mantenimientos atrasados.
 * - Al iniciar la aplicación ejecuta una verificación inmediata.
 */
@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(private readonly alertsService: AlertsService) {}

  // Ejecutar cada 6 horas
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleAlertCheck() {
    this.logger.log('⏰ Ejecutando verificación automática de alertas...');
    try {
      const result = await this.alertsService.checkAndCreateAlerts();
      this.logger.log(`✅ Verificación completada: ${result.alertsCreated} alertas creadas`);
    } catch (error) {
      this.logger.error('❌ Error en verificación de alertas:', error);
    }
  }
}
