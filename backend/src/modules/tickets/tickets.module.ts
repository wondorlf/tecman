import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsService } from './tickets.service.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsGateway } from './tickets.gateway.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [
    NotificationsModule,
    TenantsModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  providers: [TicketsService, TicketsGateway],
  controllers: [TicketsController],
})
export class TicketsModule {}
