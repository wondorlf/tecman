import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-email')
  async sendTestEmail(@Body() body: { email: string }) {
    const sent = await this.notificationsService.sendEmail(
      body.email,
      '🔧 Prueba de Conexión Egan GAMA',
      '<h1>¡Hola!</h1><p>El servidor SMTP está configurado correctamente en AdminJS.</p>',
    );
    return { success: sent, message: sent ? 'Email enviado' : 'Fallo en envío' };
  }
}
