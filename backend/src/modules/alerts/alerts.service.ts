import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AlertsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: any) {
        return this.prisma.alert.findMany({
            where: query,
            include: { asset: { select: { name: true, code: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resolve(id: string, userId: string) {
        return this.prisma.alert.update({
            where: { id },
            data: {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: userId,
            },
        });
    }
}
