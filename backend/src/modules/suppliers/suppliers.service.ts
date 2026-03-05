import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SuppliersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.supplier.findMany({
            include: { _count: { select: { assets: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: { assets: true },
        });
        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
        return supplier;
    }

    async create(data: any) {
        return this.prisma.supplier.create({ data });
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.supplier.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.supplier.delete({ where: { id } });
    }
}
