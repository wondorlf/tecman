import { Controller, Get, Post, Patch, Body, Param, Delete, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
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

  @Post('upload')
  @ApiOperation({ summary: 'Upload document file and create record' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 100 * 1024 * 1024 },
  }))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.documentsService.uploadAndCreate(file, body);
  }

  @Get()
  @ApiOperation({ summary: 'List documents with optional filters' })
  findAll(@Query() query: Record<string, string>) {
    return this.documentsService.findAll(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata (public/private, category)' })
  update(@Param('id') id: string, @Body() updateDto: { isPublic?: boolean; type?: string; name?: string }) {
    return this.documentsService.update(id, updateDto);
  }

  @Roles('Administrador', 'Superadministrador Egan')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove document (admin only)' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
