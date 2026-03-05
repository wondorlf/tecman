import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post()
    create(@Body() createDocumentDto: any) {
        return this.documentsService.create(createDocumentDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.documentsService.findAll(query);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.documentsService.remove(id);
    }
}
