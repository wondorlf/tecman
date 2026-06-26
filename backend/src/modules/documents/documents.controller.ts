import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or upload new document metadata' })
  create(@Body() createDocumentDto: any) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List documents with optional filters' })
  findAll(@Query() query: Record<string, string>) {
    return this.documentsService.findAll(query);
  }

  @Roles('Administrador', 'Superadministrador Egan')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove document (admin only)' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
