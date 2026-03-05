import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AssetStatus, MaintenanceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getStats() {
        const [assetsCount, pendingMaint, activeAlerts, usersCount] = await Promise.all([
            this.prisma.asset.count(),
            this.prisma.maintenance.count({ where: { status: MaintenanceStatus.PENDING } }),
            this.prisma.alert.count({ where: { resolved: false } }),
            this.prisma.user.count(),
        ]);

        return {
            assetsCount,
            pendingMaint,
            activeAlerts,
            usersCount,
        };
    }

    async getAssetsByStatus() {
        const stats = await this.prisma.asset.groupBy({
            by: ['status'],
            _count: true,
        });
        return stats;
    }
}
