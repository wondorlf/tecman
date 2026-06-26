import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [
    TenantsModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST', 'smtp.gmail.com'),
          port: config.get('SMTP_PORT', 587),
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.get('SMTP_USER', ''),
            pass: config.get('SMTP_PASS', ''),
          },
        },
        defaults: {
          from: '"No Reply - Egan GAMA" <noreply@egan.com>',
        },
      }),
    }),
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
