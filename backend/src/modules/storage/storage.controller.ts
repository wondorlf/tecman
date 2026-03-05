import { Controller, Get, Param, Res, UseGuards, NotFoundException, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StorageService } from './storage.service.js';
import * as fs from 'fs';
import * as path from 'path';

@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Get(':filename')
    @UseGuards(JwtAuthGuard)
    getFile(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = this.storageService.getFilePath(filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('File not found');
        }

        // Role-based logic could be added here if certain files were tied to specific roles
        // For now, any authenticated user can view files as requested

        return res.sendFile(filePath);
    }
}
