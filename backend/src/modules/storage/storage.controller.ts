import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { StorageService } from './storage.service.js';
import * as fs from 'fs';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10) || 10485760 },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No file uploaded');
    const filename = await this.storageService.saveFile(file);

    return {
      filename,
      originalName: file.originalname,
      url: `/api/storage/${filename}`, // Authenticated URL reference
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Public()
  @Post('public-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for public uploads
    }),
  )
  async publicUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se ha recibido ningún archivo.');

    // Only allow images from public uploads
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      const ext = file.originalname?.split('.').pop()?.toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
      if (!ext || !allowedExts.includes(ext)) {
        throw new BadRequestException(
          `Tipo de archivo no válido: "${file.mimetype}". Solo se permiten imágenes: JPG, PNG, WebP, GIF, SVG.`,
        );
      }
    }

    const filename = await this.storageService.saveFile(file);

    return {
      filename,
      originalName: file.originalname,
      url: `/api/storage/public/${filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Public()
  @Get('public/:filename')
  getPublicFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.storageService.getFilePath(filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return res.sendFile(filePath);
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
      url: `/api/storage/view/${urlToken}`,
    };
  }
}
