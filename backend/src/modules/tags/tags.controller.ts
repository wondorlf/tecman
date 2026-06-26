import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TagsService } from './tags.service.js';

@ApiTags('tags')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('check-name/:name')
  @ApiOperation({ summary: 'Verificar disponibilidad de nombre de tag' })
  async checkName(@Param('name') name: string) {
    return this.tagsService.checkNameAvailability(name);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los tags' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tag' })
  create(@Body() data: { name: string; color?: string }) {
    return this.tagsService.create(data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un tag' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Asignar tag a activo' })
  assignToAsset(@Body() data: { assetId: string; tagId: string }) {
    return this.tagsService.assignToAsset(data.assetId, data.tagId);
  }

  @Delete('remove/:assetId/:tagId')
  @ApiOperation({ summary: 'Remover tag de activo' })
  removeFromAsset(@Param('assetId') assetId: string, @Param('tagId') tagId: string) {
    return this.tagsService.removeFromAsset(assetId, tagId);
  }
}
