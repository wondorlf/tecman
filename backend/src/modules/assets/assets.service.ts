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

    // Snipe-IT / GLPI Feature: Linear Depreciation Calculation
    async calculateDepreciation(id: string) {
        const asset = await this.findOne(id);

        if (!asset.acquisitionCost || !asset.acquisitionDate || !asset.expectedLifeCycle) {
            return {
                message: 'Asset lacks necessary financial data for depreciation (cost, date, or lifecycle in months).',
                currentValue: asset.acquisitionCost || 0,
            };
        }

        const cost = parseFloat(asset.acquisitionCost.toString());
        const monthsLife = asset.expectedLifeCycle;
        const monthlyDepreciation = cost / monthsLife;

        const acquisitionDate = new Date(asset.acquisitionDate);
        const today = new Date();

        let monthsElapsed = (today.getFullYear() - acquisitionDate.getFullYear()) * 12;
        monthsElapsed -= acquisitionDate.getMonth();
        monthsElapsed += today.getMonth();

        monthsElapsed = Math.max(0, monthsElapsed);

        const totalDepreciated = Math.min(cost, monthlyDepreciation * monthsElapsed);
        const currentValue = Math.max(0, cost - totalDepreciated);

        return {
            originalCost: cost,
            monthlyDepreciation,
            monthsElapsed,
            totalDepreciated,
            currentValue,
            isFullyDepreciated: currentValue <= 0
        };
    }
}
