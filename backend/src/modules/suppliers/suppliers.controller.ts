import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear proveedor' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateSupplierDto>) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar proveedor' })
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
