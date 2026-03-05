import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly mailerService: MailerService) { }

    async sendEmail(to: string, subject: string, htmlContent: string) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                html: htmlContent,
            });
            this.logger.log(`Email sent successfully to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            // Don't throw to prevent blocking the main process if email fails (unless critical)
            return false;
        }
    }

    async sendTicketCreatedNotification(ownerEmail: string, ticketCode: string) {
        const subject = `Ticket Creado: ${ticketCode}`;
        const html = `
            <h2>Hola,</h2>
            <p>Tu ticket <b>${ticketCode}</b> ha sido generado con éxito en nuestro sistema de Egan - GAMA.</p>
            <p>Pronto uno de nuestros analistas revisará el caso.</p>
            <br/>
            <small>Este es un email generado automáticamente.</small>
        `;
        return this.sendEmail(ownerEmail, subject, html);
    }
}
