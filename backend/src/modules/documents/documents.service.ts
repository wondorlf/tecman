import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DocumentsService {
    constructor(private readonly prisma: PrismaService) { }

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
        return this.prisma.document.delete({ where: { id } });
    }
}
