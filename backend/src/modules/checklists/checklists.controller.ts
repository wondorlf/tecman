import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChecklistsService } from './checklists.service.js';
import { CreateChecklistDto } from './dto/create-checklist.dto.js';

@ApiTags('checklists')
@ApiBearerAuth()
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear checklist con ítems' })
  create(@Body() dto: CreateChecklistDto) {
    return this.checklistsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar checklists con ítems' })
  findAll() {
    return this.checklistsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener checklist por ID' })
  findOne(@Param('id') id: string) {
    return this.checklistsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar checklist e ítems' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateChecklistDto>) {
    return this.checklistsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar checklist' })
  remove(@Param('id') id: string) {
    return this.checklistsService.remove(id);
  }
}
