import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Post()
    create(@Body() createMaintenanceDto: any) {
        return this.maintenanceService.create(createMaintenanceDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.maintenanceService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.maintenanceService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateMaintenanceDto: any) {
        return this.maintenanceService.update(id, updateMaintenanceDto);
    }

    @Post(':id/complete')
    complete(@Param('id') id: string, @Body() completeData: any) {
        return this.maintenanceService.complete(id, completeData);
    }

    @Post(':id/evidence')
    uploadEvidence(
        @Param('id') id: string,
        @Body() body: { path: string, filename: string, mimeType: string, size: number, type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'SIGNATURE' }
    ) {
        // Usually the file is uploaded first to /api/storage/upload, which returns metadata.
        // That metadata is then sent here to associate it with the specific maintenance record.
        return this.maintenanceService.uploadEvidence(id, body);
    }
}
