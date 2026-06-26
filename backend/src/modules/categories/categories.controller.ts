import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoría' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get('check-name/:name')
  @ApiOperation({ summary: 'Verificar disponibilidad de nombre de categoría' })
  async checkName(@Param('name') name: string) {
    return this.categoriesService.checkNameAvailability(name);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías con subcategorías' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // ── Subcategories ──────────────────────────────────────────────────────────

  @Post(':id/subcategories')
  @ApiOperation({ summary: 'Crear subcategoría dentro de una categoría' })
  createSubcategory(
    @Param('id') categoryId: string,
    @Body() dto: { name: string; description?: string },
  ) {
    return this.categoriesService.createSubcategory(categoryId, dto);
  }

  @Put(':id/subcategories/:subId')
  @ApiOperation({ summary: 'Editar subcategoría' })
  updateSubcategory(
    @Param('subId') subId: string,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.categoriesService.updateSubcategory(subId, dto);
  }

  @Delete(':id/subcategories/:subId')
  @ApiOperation({ summary: 'Eliminar subcategoría' })
  removeSubcategory(@Param('subId') subId: string) {
    return this.categoriesService.removeSubcategory(subId);
  }
}
