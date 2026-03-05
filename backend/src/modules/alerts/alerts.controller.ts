import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    findAll(@Request() req) {
        return this.alertsService.findAll({ resolved: false });
    }

    @Post(':id/resolve')
    resolve(@Param('id') id: string, @Request() req) {
        return this.alertsService.resolve(id, req.user.id);
    }
}
