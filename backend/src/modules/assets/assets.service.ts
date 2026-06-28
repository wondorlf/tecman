import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, string> & PaginationDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.locationId) where.locationId = query.locationId;

    // Filtro para activos vinculados a discovery
    if (query.discoveryLinked === 'true') {
      where.discoveredDevice = { isNot: null };
    } else if (query.discoveryLinked === 'false') {
      where.discoveredDevice = { is: null };
    }

    // Búsqueda full-text
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { code: { contains: query.search } },
        { brand: { contains: query.search } },
        { model: { contains: query.search } },
        { serialNumber: { contains: query.search } },
        { description: { contains: query.search } },
        { qrCode: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          subcategory: { select: { id: true, name: true } },
          location: { select: { id: true, name: true, floor: true, room: true } },
          supplier: { select: { id: true, name: true } },
          discoveredDevice: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        location: true,
        supplier: true,
        hojaVida: {
          include: { events: { orderBy: { createdAt: 'desc' } } },
        },
        discoveredDevice: {
          select: {
            id: true,
            hostname: true,
            macAddress: true,
            ipAddress: true,
            os: true,
            lastSeenAt: true,
          },
        },
      },
    });
    if (!asset) throw new NotFoundException(`Activo ${id} no encontrado`);
    return asset;
  }

  /** Converts a bare YYYY-MM-DD string to a full ISO-8601 Date (midnight UTC). */
  private toDateTime(value: string | undefined | null): Date | undefined {
    if (!value) return undefined;
    // If it's already a full ISO string, just parse it
    if (value.includes('T')) return new Date(value);
    // Bare date → append time so Prisma accepts it
    return new Date(`${value}T00:00:00.000Z`);
  }

  private sanitizeDates(data: any): any {
    const clean = { ...data };
    if ('acquisitionDate' in clean) clean.acquisitionDate = this.toDateTime(clean.acquisitionDate);
    if ('warrantyExpiry' in clean) clean.warrantyExpiry = this.toDateTime(clean.warrantyExpiry);
    return clean;
  }

  /**
   * Verifica que un código de activo no esté ya en uso.
   * @param code - Código a verificar
   * @param excludeId - ID a excluir de la verificación (útil en updates)
   * @throws ConflictException si el código ya existe
   */
  private async checkCodeUniqueness(code: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.asset.findUnique({ where: { code } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`El código "${code}" ya está asignado al activo "${existing.name}" (${existing.code})`);
    }
  }

  async checkCodeAvailability(code: string): Promise<{ available: boolean; assetName?: string }> {
    const existing = await this.prisma.asset.findUnique({ where: { code } });
    if (existing) {
      return { available: false, assetName: existing.name };
    }
    return { available: true };
  }

  async findByQrCode(code: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { OR: [{ qrCode: code }, { code }, { serialNumber: code }] },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        subcategory: { select: { id: true, name: true } },
        location: { select: { id: true, name: true, floor: true, room: true } },
        supplier: { select: { id: true, name: true } },
        attributeValues: {
          include: { attribute: { select: { name: true, unit: true, type: true } } },
        },
        documents: {
          where: { isPublic: true },
          select: { id: true, name: true, type: true, filename: true, mimeType: true, size: true, description: true, path: true },
          orderBy: { createdAt: 'desc' },
        },
        // Incluir datos del discovery vinculado (para mostrar cambios HW)
        discoveredDevice: {
          select: {
            id: true,
            hostname: true,
            macAddress: true,
            ipAddress: true,
            os: true,
            manufacturer: true,
            model: true,
            serialNumber: true,
            cpuModel: true,
            cpuCores: true,
            ramTotalBytes: true,
            diskTotalBytes: true,
            lastSeenAt: true,
            changes: {
              orderBy: { detectedAt: 'desc' },
              take: 5,
              select: { id: true, component: true, oldValue: true, newValue: true, detectedAt: true },
            },
          },
        },
      },
    });
    if (!asset) throw new NotFoundException(`Activo con código "${code}" no encontrado`);
    return asset;
  }

  async create(data: any) {
    // Validar que el código no esté duplicado
    await this.checkCodeUniqueness(data.code);

    // Genera un identificador único como contenido del QR
    const qrCode = `TECMAN-${randomUUID()}`;
    const { attributeValues, ...rest } = data;
    const cleanData = this.sanitizeDates(rest);

    const asset = await this.prisma.asset.create({
      data: {
        ...cleanData,
        qrCode,
        attributeValues:
          attributeValues && attributeValues.length > 0
            ? {
                create: attributeValues.map(
                  (av: { attributeId: string; value: string | number | boolean }) => ({
                    attributeId: av.attributeId,
                    value: String(av.value),
                  }),
                ),
              }
            : undefined,
      },
    });

    // Crea la hoja de vida con el evento inicial
    await this.prisma.hojaVida.create({
      data: {
        assetId: asset.id,
        events: {
          create: {
            type: 'CREATED',
            description: `Activo "${asset.name}" registrado en el sistema`,
            data: JSON.stringify({
              code: asset.code,
              status: asset.status,
              qrCode,
            }),
          },
        },
      },
    });

    return asset;
  }

  async update(id: string, data: any) {
    const existing = await this.findOne(id);

    // Validar que el código no esté duplicado (si está cambiando)
    if (data.code && data.code !== existing.code) {
      await this.checkCodeUniqueness(data.code, id);
    }

    // Registra cambio de estado en la hoja de vida
    if (data.status && data.status !== existing.status) {
      const hojaVida = await this.prisma.hojaVida.findUnique({
        where: { assetId: id },
      });
      if (hojaVida) {
        await this.prisma.hojaVidaEvent.create({
          data: {
            hojaVidaId: hojaVida.id,
            type: 'STATUS_CHANGE',
            description: `Estado cambiado: ${existing.status} → ${data.status}`,
            data: JSON.stringify({ from: existing.status, to: data.status }),
          },
        });
      }
    }

    // Registra cambio de ubicación en la hoja de vida
    if (data.locationId && data.locationId !== existing.locationId) {
      const hojaVida = await this.prisma.hojaVida.findUnique({
        where: { assetId: id },
      });
      if (hojaVida) {
        const [oldLoc, newLoc] = await Promise.all([
          this.prisma.location.findUnique({ where: { id: existing.locationId } }),
          this.prisma.location.findUnique({ where: { id: data.locationId } }),
        ]);
        await this.prisma.hojaVidaEvent.create({
          data: {
            hojaVidaId: hojaVida.id,
            type: 'LOCATION_CHANGE',
            description: `Ubicación cambiada: ${oldLoc?.name ?? '—'} → ${newLoc?.name ?? '—'}`,
            data: JSON.stringify({ from: existing.locationId, to: data.locationId }),
          },
        });
      }
    }

    const { attributeValues, ...rest } = data;
    const cleanData = this.sanitizeDates(rest);

    if (attributeValues) {
      // Elimina los valores anteriores de atributos para este activo
      await this.prisma.assetAttributeValue.deleteMany({
        where: { assetId: id },
      });

      return this.prisma.asset.update({
        where: { id },
        data: {
          ...cleanData,
          attributeValues:
            attributeValues.length > 0
              ? {
                  create: attributeValues.map((av: any) => ({
                    attributeId: av.attributeId,
                    value: String(av.value),
                  })),
                }
              : undefined,
        },
      });
    }

    return this.prisma.asset.update({ where: { id }, data: cleanData });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.asset.delete({ where: { id } });
    } catch (e) {
      const prismaErr = e as { code?: string; message?: string };
      if (prismaErr.code === 'P2003') {
        throw new BadRequestException(
          'No se puede eliminar: el activo tiene registros asociados (mantenimientos, tickets, etc.). Elimine primero las dependencias o use baja por custodia.',
        );
      }
      throw e;
    }
  }

  async updateAttributeValues(assetId: string, values: { attributeId: string; value: string }[]) {
    for (const v of values) {
      const existing = await this.prisma.assetAttributeValue.findUnique({
        where: { assetId_attributeId: { assetId, attributeId: v.attributeId } },
      });
      if (existing) {
        await this.prisma.assetAttributeValue.update({
          where: { id: existing.id },
          data: { value: v.value },
        });
      } else {
        await this.prisma.assetAttributeValue.create({
          data: { assetId, attributeId: v.attributeId, value: v.value },
        });
      }
    }
    return this.findOne(assetId);
  }

  async linkDiscoveryDevice(discoveryId: string, data: { createNew: boolean; assetData?: any }) {
    const device = await this.prisma.discoveredDevice.findUnique({ where: { id: discoveryId } });
    if (!device) throw new NotFoundException(`Dispositivo discovery ${discoveryId} no encontrado`);

    if (data.createNew) {
      const qrCode = `TECMAN-${randomUUID()}`;
      const assetCode = data.assetData?.code || `DISC-${randomUUID().slice(0, 8).toUpperCase()}`;
      await this.checkCodeUniqueness(assetCode);
      const asset = await this.prisma.asset.create({
        data: {
          name: data.assetData?.name || device.hostname,
          code: assetCode,
          categoryId: data.assetData?.categoryId || '',
          locationId: data.assetData?.locationId || '',
          serialNumber: device.serialNumber || undefined,
          brand: device.manufacturer || undefined,
          model: device.model || undefined,
          qrCode,
          status: data.assetData?.status || 'ACTIVE',
          attributeValues: device.serialNumber
            ? {
                create: [{ attributeId: null, value: device.serialNumber }],
              }
            : undefined,
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

  async linkAssetToDiscovery(assetId: string, discoveryId: string) {
    const [asset, device] = await Promise.all([
      this.prisma.asset.findUnique({ where: { id: assetId } }),
      this.prisma.discoveredDevice.findUnique({ where: { id: discoveryId } }),
    ]);
    if (!asset) throw new NotFoundException(`Activo ${assetId} no encontrado`);
    if (!device) throw new NotFoundException(`Dispositivo discovery ${discoveryId} no encontrado`);

    // Verificar que el device no esté ya vinculado a otro activo
    if (device.assetId && device.assetId !== assetId) {
      throw new BadRequestException('Este dispositivo discovery ya está vinculado a otro activo');
    }

    await this.prisma.discoveredDevice.update({
      where: { id: discoveryId },
      data: { assetId },
    });

    return { message: 'Activado vinculado exitosamente', assetId, discoveryId };
  }

  async calculateDepreciation(id: string) {
    const asset = await this.findOne(id);

    if (!asset.acquisitionCost || !asset.acquisitionDate || !asset.expectedLifeCycle) {
      return {
        message: 'Faltan datos financieros: costo, fecha de adquisición o vida útil.',
        currentValue: asset.acquisitionCost ?? 0,
        originalCost: asset.acquisitionCost ?? 0,
        monthsElapsed: 0,
        totalDepreciated: 0,
        monthlyDepreciation: 0,
        isFullyDepreciated: false,
      };
    }

    const cost = parseFloat(asset.acquisitionCost.toString());
    const monthsLife = asset.expectedLifeCycle;
    const monthlyDepreciation = cost / monthsLife;

    const acquisitionDate = new Date(asset.acquisitionDate);
    const today = new Date();
    let monthsElapsed =
      (today.getFullYear() - acquisitionDate.getFullYear()) * 12 +
      (today.getMonth() - acquisitionDate.getMonth());
    monthsElapsed = Math.max(0, monthsElapsed);

    const totalDepreciated = Math.min(cost, monthlyDepreciation * monthsElapsed);
    const currentValue = Math.max(0, cost - totalDepreciated);

    return {
      originalCost: cost,
      monthlyDepreciation,
      monthsElapsed,
      totalDepreciated,
      currentValue,
      isFullyDepreciated: currentValue <= 0,
    };
  }

  async getDeviceHistory(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        location: true,
        supplier: true,
        hojaVida: {
          include: { events: { orderBy: { createdAt: 'desc' } } },
        },
        discoveredDevice: {
          select: {
            id: true,
            hostname: true,
            macAddress: true,
            ipAddress: true,
            os: true,
            lastSeenAt: true,
          },
        },
        maintenances: {
          orderBy: { createdAt: 'desc' },
          include: {
            technician: { select: { id: true, name: true } },
            checklist: { select: { id: true, name: true } },
            evidence: true,
          },
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
            messages: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        customFields: true,
        attributeValues: {
          include: { attribute: { select: { id: true, name: true, type: true, unit: true, options: true } } },
        },
        custodies: {
          where: { returnedAt: null },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          take: 1,
        },
        dependenciesFrom: {
          include: {
            dependsOn: { select: { id: true, name: true, code: true } },
          },
        },
        dependenciesTo: {
          include: {
            asset: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!asset) throw new NotFoundException(`Activo ${id} no encontrado`);
    return asset;
  }

  // ── Dependencias entre activos ─────────────────────────────────────────────
  async addDependency(
    assetId: string,
    data: { dependsOnId: string; type: string; description?: string },
  ) {
    const [asset, dependsOn] = await Promise.all([
      this.prisma.asset.findUnique({ where: { id: assetId } }),
      this.prisma.asset.findUnique({ where: { id: data.dependsOnId } }),
    ]);
    if (!asset) throw new NotFoundException(`Activo ${assetId} no encontrado`);
    if (!dependsOn) throw new NotFoundException(`Activo ${data.dependsOnId} no encontrado`);
    if (assetId === data.dependsOnId) {
      throw new BadRequestException('Un activo no puede depender de sí mismo');
    }

    const dependency = await this.prisma.assetDependency.create({
      data: {
        assetId,
        dependsOnId: data.dependsOnId,
        type: data.type,
        description: data.description,
      },
      include: {
        dependsOn: { select: { id: true, name: true, code: true } },
      },
    });

    // Registrar en hoja de vida
    const hv = await this.prisma.hojaVida.findUnique({ where: { assetId } });
    if (hv) {
      await this.prisma.hojaVidaEvent.create({
        data: {
          hojaVidaId: hv.id,
          type: 'CUSTOM',
          description: `Dependencia agregada: ${asset.name} depende de ${dependsOn.name} (${data.type})`,
          data: JSON.stringify(data),
        },
      });
    }

    return dependency;
  }

  async removeDependency(assetId: string, dependencyId: string) {
    const dep = await this.prisma.assetDependency.findUnique({ where: { id: dependencyId } });
    if (!dep || dep.assetId !== assetId) {
      throw new NotFoundException('Dependencia no encontrada');
    }
    await this.prisma.assetDependency.delete({ where: { id: dependencyId } });
    return { message: 'Dependencia eliminada' };
  }

  async getDependencies(assetId: string) {
    const [dependsOn, dependedBy] = await Promise.all([
      this.prisma.assetDependency.findMany({
        where: { assetId },
        include: {
          dependsOn: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.assetDependency.findMany({
        where: { dependsOnId: assetId },
        include: {
          asset: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);
    return { dependsOn, dependedBy };
  }

  // ── Importación masiva desde XLSX ─────────────────────────────────────────
  async importFromRows(rows: any[]) {
    const results = { created: 0, errors: [] as string[] };

    // Obtener categorías y ubicaciones existentes para mapear por nombre
    const [categories, locations] = await Promise.all([
      this.prisma.category.findMany({ select: { id: true, name: true } }),
      this.prisma.location.findMany({ select: { id: true, name: true } }),
    ]);
    const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const locMap = new Map(locations.map((l) => [l.name.toLowerCase(), l.id]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const code = String(row.codigo || row.code || '').trim();
        const name = String(row.nombre || row.name || '').trim();
        const categoryName = String(row.categoria || row.category || '')
          .trim()
          .toLowerCase();
        const locationName = String(row.ubicacion || row.location || '')
          .trim()
          .toLowerCase();

        if (!code || !name) {
          results.errors.push(`Fila ${i + 2}: código y nombre son obligatorios`);
          continue;
        }

        const categoryId = catMap.get(categoryName);
        if (!categoryId) {
          results.errors.push(
            `Fila ${i + 2}: categoría "${row.categoria || row.category}" no encontrada`,
          );
          continue;
        }

        const locationId = locMap.get(locationName);
        if (!locationId) {
          results.errors.push(
            `Fila ${i + 2}: ubicación "${row.ubicacion || row.location}" no encontrada`,
          );
          continue;
        }

        // Verifica si ya existe
        const exists = await this.prisma.asset.findUnique({ where: { code } });
        if (exists) {
          results.errors.push(`Fila ${i + 2}: código "${code}" ya existe`);
          continue;
        }

        await this.create({
          code,
          name,
          categoryId,
          locationId,
          brand: row.marca || row.brand || undefined,
          model: row.modelo || row.model || undefined,
          serialNumber: row.serial || row.serialNumber || undefined,
          description: row.descripcion || row.description || undefined,
          notes: row.notas || row.notes || undefined,
        });
        results.created++;
      } catch (e: any) {
        results.errors.push(`Fila ${i + 2}: ${e.message}`);
      }
    }

    return results;
  }

  // ── Exportar todos los activos para XLSX ──────────────────────────────────
  async exportAll() {
    const assets = await this.prisma.asset.findMany({
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        location: { select: { name: true, floor: true, room: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { code: 'asc' },
    });

    return assets.map((a) => ({
      Código: a.code,
      Nombre: a.name,
      Descripción: a.description ?? '',
      Categoría: a.category.name,
      Subcategoría: a.subcategory?.name ?? '',
      Marca: a.brand ?? '',
      Modelo: a.model ?? '',
      Serial: a.serialNumber ?? '',
      Ubicación: a.location.name,
      Piso: a.location.floor ?? '',
      Sala: a.location.room ?? '',
      Estado: a.status,
      'Fecha Adquisición': a.acquisitionDate
        ? new Date(a.acquisitionDate).toISOString().split('T')[0]
        : '',
      'Costo Adquisición': a.acquisitionCost ? Number(a.acquisitionCost) : '',
      'Vencimiento Garantía': a.warrantyExpiry
        ? new Date(a.warrantyExpiry).toISOString().split('T')[0]
        : '',
      'Vida Útil (meses)': a.expectedLifeCycle ?? '',
      Proveedor: a.supplier?.name ?? '',
      Notas: a.notes ?? '',
      QR: a.qrCode,
    }));
  }
}
