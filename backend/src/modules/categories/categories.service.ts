import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({
            include: { subcategories: true, _count: { select: { assets: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: { subcategories: true, assets: true },
        });
        if (!category) throw new NotFoundException(`Category ${id} not found`);
        return category;
    }

    async create(data: any) {
        return this.prisma.category.create({ data });
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.category.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.category.delete({ where: { id } });
    }
}
