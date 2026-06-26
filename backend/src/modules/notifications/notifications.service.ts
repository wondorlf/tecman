import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { TenantsService } from '../tenants/tenants.service.js';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly tenantsService: TenantsService,
  ) {}

  async sendEmail(to: string, subject: string, htmlContent: string, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.mailerService.sendMail({
          to,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Email sent successfully to ${to}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Failed to send email to ${to} (attempt ${attempt + 1}/${retries + 1}): ${error.message}`,
        );
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    return false;
  }

  async sendTelegramMessage(chatId: string, message: string, retries = 2) {
    const settings = await this.tenantsService.getTenantSettings();
    if (!settings || !settings.telegramBotToken || !settings.telegramNotificationsEnabled) {
      this.logger.warn('Telegram notifications are disabled or bot token is missing');
      return false;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
        await axios.post(url, {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        });
        this.logger.log(`Telegram message sent successfully to ${chatId}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Failed to send Telegram message to ${chatId} (attempt ${attempt + 1}/${retries + 1}): ${error.message}`,
        );
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    return false;
  }


  async sendTicketCreatedNotification(
    ownerEmail: string,
    ticketCode: string,
    telegramChatId?: string,
    ticketDetails?: { title?: string; category?: string; creatorName?: string },
  ) {
    const subject = `Ticket Creado: ${ticketCode}`;
    const html = `
            <h2>Hola,</h2>
            <p>Tu ticket <b>${ticketCode}</b> ha sido generado con éxito en nuestro sistema de Egan - GAMA.</p>
            <p>Pronto uno de nuestros analistas revisará el caso.</p>
            <br/>
            <small>Este es un email generado automáticamente.</small>
        `;

    // 1. Send Email to owner
    if (ownerEmail) {
      await this.sendEmail(ownerEmail, subject, html);
    }

    // 2. Send Telegram to owner (personal notification)
    if (telegramChatId) {
      const telegramMessage = `🆕 <b>Ticket Creado: ${ticketCode}</b>\n\nTu ticket ha sido generado con éxito. Pronto uno de nuestros analistas revisará el caso.`;
      await this.sendTelegramMessage(telegramChatId, telegramMessage);
    }

    // 3. Send Telegram to Admin Group (Global notification)
    const settings = await this.tenantsService.getTenantSettings();
    if (settings?.telegramChatId && settings.telegramNotificationsEnabled) {
      const adminMessage =
        `🚨 <b>NUEVO TICKET RECIBIDO</b>\n\n` +
        `<b>Código:</b> ${ticketCode}\n` +
        `<b>Título:</b> ${ticketDetails?.title || 'Sin título'}\n` +
        `<b>Categoría:</b> ${ticketDetails?.category || 'General'}\n` +
        `<b>Creado por:</b> ${ticketDetails?.creatorName || 'Usuario'}\n\n` +
        `<a href="${process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || '3000'}`}/dashboard/tickets">Ver en el sistema</a>`;
      await this.sendTelegramMessage(settings.telegramChatId, adminMessage);
    }

    return true;
  }
}
