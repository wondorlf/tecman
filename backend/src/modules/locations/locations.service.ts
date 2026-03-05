import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class LocationsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.location.findMany({
            include: { parent: true, _count: { select: { assets: true, children: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const location = await this.prisma.location.findUnique({
            where: { id },
            include: { parent: true, children: true, assets: true },
        });
        if (!location) throw new NotFoundException(`Location ${id} not found`);
        return location;
    }

    async create(data: any) {
        return this.prisma.location.create({ data });
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.location.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.location.delete({ where: { id } });
    }
}
