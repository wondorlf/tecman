import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MaintenanceStatus } from '@prisma/client';

@Injectable()
export class MaintenanceService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: any) {
        return this.prisma.maintenance.findMany({
            where: query,
            include: {
                asset: { select: { name: true, code: true } },
                technician: { select: { name: true } },
            },
            orderBy: { scheduledDate: 'desc' },
        });
    }

    async findOne(id: string) {
        const maintenance = await this.prisma.maintenance.findUnique({
            where: { id },
            include: {
                asset: true,
                technician: true,
                checklist: { include: { items: true } },
            },
        });
        if (!maintenance) throw new NotFoundException(`Maintenance ${id} not found`);
        return maintenance;
    }

    async create(data: any) {
        return this.prisma.maintenance.create({ data });
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.maintenance.update({ where: { id }, data });
    }

    async complete(id: string, data: any) {
        await this.findOne(id);
        return this.prisma.maintenance.update({
            where: { id },
            data: {
                ...data,
                status: MaintenanceStatus.COMPLETED,
                completedAt: new Date(),
            },
        });
    }

    async uploadEvidence(id: string, fileData: { path: string, filename: string, mimeType: string, size: number, type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'SIGNATURE' }) {
        await this.findOne(id);

        return this.prisma.evidence.create({
            data: {
                maintenanceId: id,
                ...fileData
            }
        });
    }
}
