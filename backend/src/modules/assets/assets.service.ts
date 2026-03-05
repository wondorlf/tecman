import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AssetsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: any) {
        return this.prisma.asset.findMany({
            where: query,
            include: {
                category: true,
                subcategory: true,
                location: true,
            },
        });
    }

    async findOne(id: string) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: {
                category: true,
                subcategory: true,
                location: true,
                hojaVida: {
                    include: { events: { orderBy: { createdAt: 'desc' } } }
                }
            },
        });
        if (!asset) throw new NotFoundException(`Asset with ID ${id} not found`);
        return asset;
    }

    async create(data: any) {
        return this.prisma.asset.create({
            data,
        });
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.asset.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.asset.delete({
            where: { id },
        });
    }
}
