import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../common/dto/pagination.dto.js';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalDevices, totalChanges, osGroups, linkedDevices, recentChanges, devicesByDay] =
      await Promise.all([
        this.prisma.discoveredDevice.count(),
        this.prisma.hardwareChange.count(),
        this.prisma.discoveredDevice.groupBy({
          by: ['os'],
          _count: { id: true },
        }),
        this.prisma.discoveredDevice.count({
          where: { assetId: { not: null } },
        }),
        this.prisma.hardwareChange.findMany({
          orderBy: { detectedAt: 'desc' },
          take: 20,
          include: {
            device: { select: { hostname: true, ipAddress: true } },
          },
        }),
        this.prisma.$queryRaw`
        SELECT DATE(lastSeenAt) as date, COUNT(*) as count
        FROM discovered_devices
        WHERE lastSeenAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(lastSeenAt)
        ORDER BY date ASC
      `,
      ]);

    // Calculate online/offline (seen in last 24h = online)
    const onlineThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const onlineDevices = await this.prisma.discoveredDevice.count({
      where: { lastSeenAt: { gte: onlineThreshold } },
    });

    // Total resources
    const allDevices = await this.prisma.discoveredDevice.findMany({
      select: { ramTotalBytes: true, diskTotalBytes: true, cpuCores: true },
    });

    const totalRam = allDevices.reduce(
      (acc, d) => acc + (d.ramTotalBytes ? Number(d.ramTotalBytes.toString()) : 0),
      0,
    );
    const totalDisk = allDevices.reduce(
      (acc, d) => acc + (d.diskTotalBytes ? Number(d.diskTotalBytes.toString()) : 0),
      0,
    );
    const totalCores = allDevices.reduce((acc, d) => acc + (d.cpuCores || 0), 0);

    return {
      totalDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
      linkedDevices,
      unlinkedDevices: totalDevices - linkedDevices,
      totalChanges,
      totalRamBytes: totalRam,
      totalDiskBytes: totalDisk,
      totalCores,
      osDistribution: osGroups.map((g: { os: string | null; _count: { id: number } }) => ({
        os: g.os || 'Unknown',
        count: g._count.id,
      })),
      recentChanges,
      devicesByDay: Array.isArray(devicesByDay) ? devicesByDay : [],
    };
  }

  async findAll(query: Record<string, string>) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { hostname: { contains: query.search } },
        { ipAddress: { contains: query.search } },
        { macAddress: { contains: query.search } },
        { os: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.discoveredDevice.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.discoveredDevice.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const device = await this.prisma.discoveredDevice.findUnique({
      where: { id },
      include: {
        asset: { select: { id: true, name: true, code: true } },
        changes: { orderBy: { detectedAt: 'desc' } },
      },
    });
    if (!device) throw new NotFoundException(`Dispositivo ${id} no encontrado`);
    return device;
  }

  async getChanges(id: string) {
    await this.findOne(id);
    return this.prisma.hardwareChange.findMany({
      where: { discoveredDeviceId: id },
      orderBy: { detectedAt: 'desc' },
    });
  }

  async getAgentMetrics() {
    // Versiones de agente distribuidas (raw SQL para evitar errores de tipo de Prisma groupBy)
    const versionGroups: any[] = await this.prisma.$queryRaw`
      SELECT agentVersion, COUNT(*) as count, MAX(lastSeenAt) as lastSeen
      FROM discovered_devices
      GROUP BY agentVersion
      ORDER BY count DESC
    `;

    // Últimos 50 reportes
    const latestReports = await this.prisma.discoveredDevice.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
      select: {
        id: true,
        hostname: true,
        ipAddress: true,
        macAddress: true,
        os: true,
        agentVersion: true,
        lastSeenAt: true,
        createdAt: true,
        serialNumber: true,
        manufacturer: true,
        model: true,
        assetId: true,
        asset: { select: { id: true, name: true, code: true } },
      },
    });

    // Reportes por hora (últimas 24h)
    const reportsByHour = await this.prisma.$queryRaw`
      SELECT DATE_FORMAT(lastSeenAt, '%Y-%m-%d %H:00') as hour, COUNT(*) as count
      FROM discovered_devices
      WHERE lastSeenAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY hour
      ORDER BY hour ASC
    `;

    // Conteo de agentes sin versión (legacy)
    const noVersion = await this.prisma.discoveredDevice.count({
      where: { agentVersion: null },
    });

    // Agentes que reportaron en la última hora
    const lastHour = await this.prisma.discoveredDevice.count({
      where: { lastSeenAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });

    return {
      versionDistribution: versionGroups.map((g: any) => ({
        version: g.agentVersion || 'Legacy (sin versión)',
        count: Number(g.count),
        lastSeen: g.lastSeen,
      })),
      latestReports,
      reportsByHour: Array.isArray(reportsByHour) ? reportsByHour : [],
      noVersion,
      lastHour,
      totalDevices: await this.prisma.discoveredDevice.count(),
    };
  }

  async getApiKey(): Promise<string | null> {
    try {
      const tenant = await this.prisma.tenant.findFirst({
        select: { discoveryApiKey: true },
      });
      return tenant?.discoveryApiKey || process.env.DISCOVERY_API_KEY || null;
    } catch {
      return process.env.DISCOVERY_API_KEY || null;
    }
  }

  async processAgentData(payload: any) {
    const {
      macAddress,
      hostname,
      ipAddress,
      os,
      // Fabricante
      manufacturer,
      model,
      serialNumber,
      biosVersion,
      // CPU
      cpuModel,
      cpuCores,
      // RAM
      ramTotalBytes,
      ramType,
      ramSlots,
      ramSlotsUsed,
      ramSpeed,
      // Disco
      diskTotalBytes,
      diskUsedBytes,
      diskFreeBytes,
      diskType,
      volumes,
      // Red y dominio
      domain,
      loggedUser,
      // Versión del agente
      agentVersion,
      // Tiempos
      lastBoot,
    } = payload;

    if (!macAddress || macAddress === 'UNKNOWN_MAC') {
      this.logger.warn(`Agente reportó dispositivo sin MAC válida: ${hostname}`);
      return { status: 'ignored', reason: 'No MAC address' };
    }

    // Buscar si el dispositivo ya existe
    const existing = await this.prisma.discoveredDevice.findUnique({
      where: { macAddress },
    });

    // Common data object with all fields
    const data: any = {
      macAddress,
      hostname,
      ipAddress,
      os,
      manufacturer,
      model,
      serialNumber,
      biosVersion,
      cpuModel,
      cpuCores,
      ramTotalBytes,
      ramType,
      ramSlots,
      ramSlotsUsed,
      ramSpeed,
      diskTotalBytes,
      diskUsedBytes,
      diskFreeBytes,
      diskType,
      volumes: volumes
        ? typeof volumes === 'string'
          ? volumes
          : JSON.stringify(volumes)
        : undefined,
      domain,
      loggedUser,
      agentVersion: agentVersion || undefined,
      lastBoot: lastBoot ? new Date(lastBoot) : undefined,
      lastSeenAt: new Date(),
    };

    // Clean undefined fields
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    if (!existing) {
      // Registrar nuevo dispositivo
      const newDevice = await this.prisma.discoveredDevice.create({ data });
      this.logger.log(`Nuevo dispositivo descubierto: ${hostname} (${ipAddress})`);
      return newDevice;
    }

    // Si ya existe, verificamos cambios de hardware
    const changes = [];

    if (!existing.ramTotalBytes || Number(existing.ramTotalBytes) !== Number(ramTotalBytes)) {
      changes.push({
        component: 'RAM',
        old: existing.ramTotalBytes ? existing.ramTotalBytes.toString() : '?',
        new: String(ramTotalBytes),
      });
    }
    if (!existing.diskTotalBytes || Number(existing.diskTotalBytes) !== Number(diskTotalBytes)) {
      changes.push({
        component: 'DISK',
        old: existing.diskTotalBytes ? existing.diskTotalBytes.toString() : '?',
        new: String(diskTotalBytes),
      });
    }
    if (existing.cpuModel !== cpuModel) {
      changes.push({ component: 'CPU', old: existing.cpuModel || '', new: cpuModel || '' });
    }
    if (existing.ramType !== ramType) {
      changes.push({ component: 'RAM_Type', old: existing.ramType || '', new: ramType || '' });
    }
    if (existing.diskType !== diskType) {
      changes.push({ component: 'DISK_Type', old: existing.diskType || '', new: diskType || '' });
    }

    // Actualizar el dispositivo
    const updated = await this.prisma.discoveredDevice.update({
      where: { id: existing.id },
      data,
    });

    // Registrar cambios de hardware
    if (changes.length > 0) {
      for (const change of changes) {
        await this.prisma.hardwareChange.create({
          data: {
            discoveredDeviceId: existing.id,
            component: change.component,
            oldValue: change.old,
            newValue: change.new,
          },
        });
      }
      this.logger.log(
        `Cambio de hardware detectado en ${hostname}: ${changes.map((c) => c.component).join(', ')}`,
      );
    }

    return updated;
  }

  async linkDiscoveryDevice(discoveryId: string, data: { createNew: boolean; assetData?: any }) {
    const device = await this.prisma.discoveredDevice.findUnique({ where: { id: discoveryId } });
    if (!device) throw new NotFoundException(`Dispositivo discovery ${discoveryId} no encontrado`);

    if (data.createNew) {
      const { randomUUID } = await import('crypto');

      // Validar categoryId y locationId antes de crear
      if (!data.assetData?.categoryId) {
        throw new BadRequestException('Se requiere categoryId para crear un activo desde discovery');
      }
      if (!data.assetData?.locationId) {
        throw new BadRequestException('Se requiere locationId para crear un activo desde discovery');
      }

      // Verificar que categoryId y locationId existen en la BD
      const [catExists, locExists] = await Promise.all([
        this.prisma.category.findUnique({ where: { id: data.assetData.categoryId }, select: { id: true } }),
        this.prisma.location.findUnique({ where: { id: data.assetData.locationId }, select: { id: true } }),
      ]);
      if (!catExists) throw new BadRequestException(`Categoría "${data.assetData.categoryId}" no encontrada`);
      if (!locExists) throw new BadRequestException(`Ubicación "${data.assetData.locationId}" no encontrada`);

      const qrCode = `TECMAN-${randomUUID()}`;
      // Código único con UUID para evitar colisiones
      const assetCode = data.assetData?.code || `DISC-${randomUUID().slice(0, 8).toUpperCase()}`;

      // Verificar unicidad del código
      const existingCode = await this.prisma.asset.findUnique({ where: { code: assetCode } });
      if (existingCode) {
        throw new BadRequestException(
          `El código "${assetCode}" ya está en uso. Intente de nuevo (código único generado automáticamente).`,
        );
      }

      const asset = await this.prisma.asset.create({
        data: {
          name: data.assetData?.name || device.hostname,
          code: assetCode,
          categoryId: data.assetData.categoryId,
          locationId: data.assetData.locationId,
          serialNumber: device.serialNumber || undefined,
          brand: device.manufacturer || undefined,
          model: device.model || undefined,
          qrCode,
          status: data.assetData?.status || 'ACTIVE',
        },
      });

      await this.prisma.discoveredDevice.update({
        where: { id: discoveryId },
        data: { assetId: asset.id },
      });

      await this.prisma.hojaVida.create({
        data: {
          assetId: asset.id,
          events: {
            create: {
              type: 'CREATED',
              description: `Activo creado automáticamente desde discovery: ${device.hostname}`,
              data: JSON.stringify({ source: 'discovery', discoveryId, qrCode }),
            },
          },
        },
      });

      return asset;
    }

    // ── Vincular a activo existente por número de serie ──
    const existingAsset = await this.prisma.asset.findFirst({
      where: { serialNumber: { not: null, equals: device.serialNumber || '' } },
    });

    if (!existingAsset) {
      throw new BadRequestException(
        'No se encontró un activo con ese número de serie. Use "Crear nuevo activo".',
      );
    }

    await this.prisma.discoveredDevice.update({
      where: { id: discoveryId },
      data: { assetId: existingAsset.id },
    });

    return existingAsset;
  }

  async remove(id: string) {
    const device = await this.prisma.discoveredDevice.findUnique({ where: { id } });
    if (!device) throw new NotFoundException(`Dispositivo ${id} no encontrado`);
    await this.prisma.discoveredDevice.delete({ where: { id } });
    return { deleted: true };
  }
}
