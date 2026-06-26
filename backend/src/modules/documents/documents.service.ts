import { Injectable } from '@nestjs/common';
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
