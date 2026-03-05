import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import { MaintenanceController } from './maintenance.controller.js';

@Module({
    providers: [MaintenanceService],
    controllers: [MaintenanceController],
})
export class MaintenanceModule { }
