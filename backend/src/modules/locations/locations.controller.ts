import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Post()
    create(@Body() createLocationDto: any) {
        return this.locationsService.create(createLocationDto);
    }

    @Get()
    findAll() {
        return this.locationsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateLocationDto: any) {
        return this.locationsService.update(id, updateLocationDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.locationsService.remove(id);
    }
}
