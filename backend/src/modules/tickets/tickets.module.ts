import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { TicketsController } from './tickets.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
    imports: [NotificationsModule],
    providers: [TicketsService],
    controllers: [TicketsController],
})
export class TicketsModule { }
