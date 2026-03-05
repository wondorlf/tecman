import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    @Post()
    create(@Body() createSupplierDto: any) {
        return this.suppliersService.create(createSupplierDto);
    }

    @Get()
    findAll() {
        return this.suppliersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.suppliersService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateSupplierDto: any) {
        return this.suppliersService.update(id, updateSupplierDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.suppliersService.remove(id);
    }
}
