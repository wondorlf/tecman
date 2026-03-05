import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ChecklistsService } from './checklists.service.js';
import { MaintenanceType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('checklists')
export class ChecklistsController {
    constructor(private readonly checklistsService: ChecklistsService) { }

    @Post()
    create(@Body() createChecklistDto: any) {
        return this.checklistsService.create(createChecklistDto);
    }

    @Get()
    findAll(@Query('categoryId') categoryId?: string, @Query('maintenanceType') maintenanceType?: MaintenanceType) {
        return this.checklistsService.findAll({ categoryId, maintenanceType });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.checklistsService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateChecklistDto: any) {
        return this.checklistsService.update(id, updateChecklistDto);
    }

    @Put(':id/items')
    updateItems(@Param('id') id: string, @Body() items: any[]) {
        return this.checklistsService.updateItems(id, items);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.checklistsService.remove(id);
    }

    @Post(':id/duplicate')
    duplicate(@Param('id') id: string, @Body('name') newName: string) {
        return this.checklistsService.duplicate(id, newName);
    }
}
