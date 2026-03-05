import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Post()
    create(@Body() createAssetDto: any) {
        return this.assetsService.create(createAssetDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.assetsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.assetsService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateAssetDto: any) {
        return this.assetsService.update(id, updateAssetDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.assetsService.remove(id);
    }
}
