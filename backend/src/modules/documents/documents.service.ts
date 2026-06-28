import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(query: any) {
    return this.prisma.document.findMany({
      where: query,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.document.create({ data });
  }

  async uploadAndCreate(file: Express.Multer.File, body: any) {
    if (!file) throw new BadRequestException('Archivo requerido');

    const filename = await this.storageService.saveFile(file);

    const docData = {
      name: body.name || file.originalname,
      description: body.description || null,
      type: body.type || 'OTHER',
      path: `/api/storage/${filename}`,
      filename,
      mimeType: file.mimetype,
      size: file.size,
      assetId: body.assetId || null,
      isPublic: body.isPublic === 'true' || body.isPublic === true,
    };

    return this.prisma.document.create({ data: docData });
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });
    if (doc) {
      await this.storageService.deleteFile(doc.filename);
    }
    return this.prisma.document.delete({ where: { id } });
  }
}
