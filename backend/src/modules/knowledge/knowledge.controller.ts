import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service.js';

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías de knowledge base' })
  listCategories() {
    return this.knowledgeService.listCategories();
  }

  @Get('articles')
  @ApiOperation({ summary: 'Listar artículos' })
  listArticles(@Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    return this.knowledgeService.listArticles(categoryId, search);
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Ver artículo (incrementa vistas)' })
  getArticle(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Post('articles/:id/rate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calificar artículo como útil o no útil' })
  rate(@Param('id') id: string, @Body() body: { helpful: boolean }) {
    return this.knowledgeService.rate(id, body.helpful);
  }
}
