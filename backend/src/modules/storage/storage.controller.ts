import { Controller, Get, Post, Param, Res, UseGuards, NotFoundException, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StorageService } from './storage.service.js';
import * as fs from 'fs';
import * as path from 'path';

@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new NotFoundException('No file uploaded');
        const filename = await this.storageService.saveFile(file);

        return {
            filename,
            originalName: file.originalname,
            url: `/api/storage/${filename}`, // Authenticated URL reference
            size: file.size,
            mimetype: file.mimetype
        };
    }

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

    @Get('view/:token')
    viewFile(@Param('token') token: string, @Res() res: Response) {
        try {
            const filename = this.storageService.verifyPresignedUrl(token);
            const filePath = this.storageService.getFilePath(filename);

            if (!fs.existsSync(filePath)) {
                throw new NotFoundException('File not found');
            }

            return res.sendFile(filePath);
        } catch (e) {
            throw new NotFoundException('Invalid or expired link');
        }
    }

    @Get('presign/:filename')
    @UseGuards(JwtAuthGuard)
    getPresignedUrl(@Param('filename') filename: string) {
        const urlToken = this.storageService.generatePresignedUrl(filename);
        return {
            url: `/api/storage/view/${urlToken}`
        };
    }
}
