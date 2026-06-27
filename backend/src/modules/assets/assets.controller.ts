import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { TenantsService } from '../tenants/tenants.service.js';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo activo' })
  create(@Body() dto: CreateAssetDto) {
    return this.assetsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar activos con filtros, paginación y búsqueda' })
  findAll(@Query() query: Record<string, string>) {
    return this.assetsService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar todos los activos a XLSX' })
  async exportXlsx(@Res() res: Response) {
    const rows = await this.assetsService.exportAll();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activos');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=activos_${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar activos desde archivo XLSX' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importXlsx(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('Archivo requerido');
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    return this.assetsService.importFromRows(rows);
  }

  @Public()
  @Get('qr/:code')
  @ApiOperation({ summary: 'Buscar activo por código QR (público)' })
  findByQr(@Param('code') code: string) {
    return this.assetsService.findByQrCode(code);
  }

  @Public()
  @Get('check-code/:code')
  @ApiOperation({ summary: 'Verificar disponibilidad de un código de activo (público)' })
  async checkCode(@Param('code') code: string) {
    return this.assetsService.checkCodeAvailability(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener activo por ID' })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar activo' })
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Put(':id/attribute-values')
  @ApiOperation({ summary: 'Actualizar valores de atributos del activo' })
  updateAttributeValues(
    @Param('id') id: string,
    @Body() body: { values: { attributeId: string; value: string }[] },
  ) {
    return this.assetsService.updateAttributeValues(id, body.values);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar activo' })
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }

  @Get(':id/dependencies')
  @ApiOperation({ summary: 'Obtener dependencias del activo' })
  getDependencies(@Param('id') id: string) {
    return this.assetsService.getDependencies(id);
  }

  @Post(':id/dependencies')
  @ApiOperation({ summary: 'Agregar dependencia a un activo' })
  addDependency(
    @Param('id') id: string,
    @Body() body: { dependsOnId: string; type: string; description?: string },
  ) {
    return this.assetsService.addDependency(id, body);
  }

  @Delete(':id/dependencies/:depId')
  @ApiOperation({ summary: 'Eliminar dependencia de un activo' })
  removeDependency(@Param('id') id: string, @Param('depId') depId: string) {
    return this.assetsService.removeDependency(id, depId);
  }

  @Put(':id/link-discovery/:discoveryId')
  @ApiOperation({ summary: 'Vincular activo existente a un dispositivo discovery' })
  linkToDiscovery(@Param('id') id: string, @Param('discoveryId') discoveryId: string) {
    return this.assetsService.linkAssetToDiscovery(id, discoveryId);
  }

  @Get(':id/depreciation')
  @ApiOperation({ summary: 'Calcular depreciación del activo' })
  getDepreciation(@Param('id') id: string) {
    return this.assetsService.calculateDepreciation(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Obtener historial completo del activo (hoja de vida)' })
  getDeviceHistory(@Param('id') id: string) {
    return this.assetsService.getDeviceHistory(id);
  }

  @Get(':id/hoja-vida-pdf')
  @ApiOperation({ summary: 'Exportar Hoja de Vida del activo a PDF' })
  async exportHojaVidaPdf(@Param('id') id: string, @Res() res: Response) {
    const asset = await this.assetsService.getDeviceHistory(id);
    const tenant = await this.tenantsService.getPublicSettings();
    const doc = new PDFDocument({ margin: 50, size: 'letter', bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hoja-vida-${asset.code}_${Date.now()}.pdf`,
    );
    doc.pipe(res);

    // ── QR Code ──
    let qrImageBuffer: Buffer | null = null;
    if (asset.qrCode) {
      try {
        qrImageBuffer = await QRCode.toBuffer(asset.qrCode, { width: 180, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
      } catch {}
    }

    const companyName = tenant?.companyName || tenant?.name || 'TecMan';
    const companyLogo = tenant?.companyLogoUrl || tenant?.logoUrl || null;
    const companyDoc = tenant?.companyDocument || '';
    const companyAddr = tenant?.companyAddress || '';
    const companyPhone = tenant?.companyPhone || '';
    const companyEmail = tenant?.companyEmail || '';
    const PAGE_W = 612;
    const MARGIN = 50;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // ── Helper: section title with colored bar ──
    const sectionTitle = (icon: string, title: string) => {
      if (doc.y > 680) doc.addPage();
      doc.moveDown(0.4);
      doc.rect(MARGIN, doc.y, CONTENT_W, 22).fill('#f1f5f9');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text(`${icon}  ${title}`, MARGIN + 8, doc.y - 16, { width: CONTENT_W - 16 });
      doc.fillColor('#000000');
      doc.moveDown(0.3);
    };

    // ── Helper: key-value row ──
    const kvRow = (label: string, value: string) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text(label, MARGIN, doc.y, { continued: true, width: 120 });
      doc.font('Helvetica').fillColor('#1e293b').text(`  ${value || '—'}`);
    };

    // ── Helper: colored badge ──
    const statusColor = (s: string) => {
      const map: Record<string, string> = { ACTIVE: '#16a34a', MAINTENANCE: '#f59e0b', INACTIVE: '#ef4444', DISPOSED: '#6b7280', RESERVED: '#8b5cf6' };
      return map[s] || '#64748b';
    };

    // ══════════════════════════════════════════════════════════════════
    // HEADER
    // ══════════════════════════════════════════════════════════════════
    if (companyLogo) {
      try { doc.image(companyLogo, MARGIN, 40, { width: 50, height: 50 }); } catch {}
    }

    if (qrImageBuffer) {
      doc.image(qrImageBuffer, PAGE_W - MARGIN - 55, 35, { width: 55, height: 55 });
    }

    const titleX = companyLogo ? MARGIN + 65 : MARGIN;
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a').text('HOJA DE VIDA', titleX, 42, { width: 300 });
    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`${asset.name}  ·  ${asset.code}`, titleX, 64, { width: 300 });

    // Company info line
    const compInfo = [companyName, companyDoc && `NIT: ${companyDoc}`, companyAddr, companyPhone && `Tel: ${companyPhone}`].filter(Boolean).join('  |  ');
    if (compInfo) {
      doc.fontSize(7).fillColor('#94a3b8').text(compInfo, MARGIN, 82, { width: CONTENT_W, align: 'center' });
    }

    doc.moveDown(1);
    doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill('#e2e8f0');
    doc.moveDown(0.5);

    // ══════════════════════════════════════════════════════════════════
    // INFORMACIÓN GENERAL
    // ══════════════════════════════════════════════════════════════════
    sectionTitle('📋', 'Información General');
    const leftCol = MARGIN;
    const rightCol = MARGIN + CONTENT_W / 2 + 10;
    const startY = doc.y;

    doc.fontSize(8).font('Helvetica');
    const generalInfo = [
      ['Código', asset.code],
      ['Nombre', asset.name],
      ['Categoría', asset.category?.name || '—'],
      ['Subcategoría', asset.subcategory?.name || '—'],
      ['Proveedor', asset.supplier?.name || '—'],
      ['Serial', asset.serialNumber || '—'],
    ];
    const generalInfo2 = [
      ['Estado', asset.status],
      ['Marca', asset.brand || '—'],
      ['Modelo', asset.model || '—'],
      ['Ubicación', asset.location?.name || '—'],
      ['Costo', asset.acquisitionCost ? `$${Number(asset.acquisitionCost).toLocaleString('es-CO')}` : '—'],
    ];

    doc.y = startY;
    for (const [label, value] of generalInfo) {
      kvRow(label, value);
    }
    const leftEndY = doc.y;
    doc.y = startY;
    for (const [label, value] of generalInfo2) {
      kvRow(label, value);
    }
    doc.y = Math.max(leftEndY, doc.y) + 4;

    // Dates row
    doc.fontSize(8).font('Helvetica');
    const dates = [
      ['Adquisición', asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString('es-CO') : '—'],
      ['Garantía', asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString('es-CO') : '—'],
      ['Ciclos', String(asset.usageCycles || 0)],
      ['Horas uso', String(asset.usageHours || 0)],
    ];
    for (const [label, value] of dates) {
      kvRow(label, value);
    }
    doc.moveDown(0.3);

    // ══════════════════════════════════════════════════════════════════
    // HARDWARE (Discovery data)
    // ══════════════════════════════════════════════════════════════════
    const hw = asset.discoveredDevice;
    if (hw) {
      sectionTitle('🖥️', 'Especificaciones del Equipo');
      const hwInfo = [
        ['Hostname', hw.hostname],
        ['IP', hw.ipAddress || '—'],
        ['MAC', hw.macAddress || '—'],
        ['OS', hw.os || '—'],
      ];
      for (const [label, value] of hwInfo) {
        kvRow(label, value || '—');
      }
      doc.moveDown(0.3);
    }

    // ══════════════════════════════════════════════════════════════════
    // CUSTOM FIELDS
    // ══════════════════════════════════════════════════════════════════
    const customFields = asset.customFields || [];
    if (customFields.length > 0) {
      sectionTitle('🏷️', 'Campos Personalizados');
      for (const cf of customFields) {
        kvRow(cf.name, cf.value);
      }
      doc.moveDown(0.3);
    }

    // ══════════════════════════════════════════════════════════════════
    // MANTENIMIENTOS
    // ══════════════════════════════════════════════════════════════════
    const maintenances = asset.maintenances || [];
    sectionTitle('🔧', `Mantenimientos (${maintenances.length})`);
    if (maintenances.length === 0) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('  Sin registros de mantenimiento').fillColor('#000');
    } else {
      // Table header
      const tY = doc.y;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('Código', MARGIN, tY, { width: 80, continued: true });
      doc.text('Tipo', { width: 70, continued: true });
      doc.text('Estado', { width: 80, continued: true });
      doc.text('Técnico', { width: 120, continued: true });
      doc.text('Fecha', { width: 100 });
      doc.rect(MARGIN, doc.y, CONTENT_W, 0.5).fill('#cbd5e1');

      for (const m of maintenances) {
        if (doc.y > 720) doc.addPage();
        doc.fontSize(7).font('Helvetica').fillColor('#334155');
        const mY = doc.y + 2;
        doc.text(m.code, MARGIN, mY, { width: 80, continued: true });
        doc.text(m.type, { width: 70, continued: true });
        doc.text(m.status, { width: 80, continued: true });
        doc.text(m.technician?.name || '—', { width: 120, continued: true });
        doc.text(m.completedAt ? new Date(m.completedAt).toLocaleDateString('es-CO') : '—');
        doc.moveDown(0.15);
      }
    }
    doc.moveDown(0.3);

    // ══════════════════════════════════════════════════════════════════
    // TICKETS
    // ══════════════════════════════════════════════════════════════════
    const tickets = asset.tickets || [];
    sectionTitle('🎫', `Tickets de Soporte (${tickets.length})`);
    if (tickets.length === 0) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('  Sin tickets asociados').fillColor('#000');
    } else {
      const tY = doc.y;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('Código', MARGIN, tY, { width: 70, continued: true });
      doc.text('Título', { width: 180, continued: true });
      doc.text('Estado', { width: 80, continued: true });
      doc.text('Categoría', { width: 80, continued: true });
      doc.text('Fecha', { width: 90 });
      doc.rect(MARGIN, doc.y, CONTENT_W, 0.5).fill('#cbd5e1');

      for (const t of tickets) {
        if (doc.y > 720) doc.addPage();
        doc.fontSize(7).font('Helvetica').fillColor('#334155');
        const tY2 = doc.y + 2;
        doc.text(t.code, MARGIN, tY2, { width: 70, continued: true });
        doc.text(t.title?.substring(0, 40) || '—', { width: 180, continued: true });
        doc.text(t.status, { width: 80, continued: true });
        doc.text(t.category || '—', { width: 80, continued: true });
        doc.text(new Date(t.createdAt).toLocaleDateString('es-CO'));
        doc.moveDown(0.15);
      }
    }
    doc.moveDown(0.3);

    // ══════════════════════════════════════════════════════════════════
    // DOCUMENTOS
    // ══════════════════════════════════════════════════════════════════
    const documents = asset.documents || [];
    if (documents.length > 0) {
      sectionTitle('📁', `Documentos (${documents.length})`);
      for (const d of documents) {
        if (doc.y > 720) doc.addPage();
        doc.fontSize(8).font('Helvetica').fillColor('#334155');
        doc.text(`  ${d.name}  ·  ${d.type}  ·  v${d.version}  ·  ${new Date(d.createdAt).toLocaleDateString('es-CO')}`);
        doc.moveDown(0.1);
      }
      doc.moveDown(0.3);
    }

    // ══════════════════════════════════════════════════════════════════
    // LÍNEA DE TIEMPO
    // ══════════════════════════════════════════════════════════════════
    const events = asset.hojaVida?.events || [];
    sectionTitle('📅', `Línea de Tiempo (${events.length} eventos)`);

    if (events.length === 0) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('  Sin eventos registrados').fillColor('#000');
    } else {
      for (const ev of events) {
        if (doc.y > 700) doc.addPage();
        const date = new Date(ev.createdAt);
        const dateStr = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        // Timeline dot and line
        const dotY = doc.y + 3;
        doc.circle(MARGIN + 4, dotY, 3).fill('#3b82f6');
        if (ev !== events[events.length - 1]) {
          doc.rect(MARGIN + 3, dotY + 5, 1, 14).fill('#e2e8f0');
        }

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#3b82f6').text(`${dateStr}  ${timeStr}`, MARGIN + 14, doc.y - 2);
        doc.fontSize(8).font('Helvetica').fillColor('#334155').text(ev.description, MARGIN + 14, doc.y, { width: CONTENT_W - 30 });
        doc.moveDown(0.4);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // FOOTER (en cada página)
    // ══════════════════════════════════════════════════════════════════
    const pageCount = doc.bufferedPageRange();
    for (let i = 0; i < pageCount.count; i++) {
      doc.switchToPage(i);
      const footerY = 780;
      doc.rect(MARGIN, footerY, CONTENT_W, 0.5).fill('#e2e8f0');
      doc.fontSize(6).font('Helvetica').fillColor('#94a3b8');
      doc.text(companyName, MARGIN, footerY + 4, { width: CONTENT_W, align: 'left' });
      doc.text(`Hoja de Vida · ${asset.code} · Generado ${new Date().toLocaleDateString('es-CO')}`, MARGIN, footerY + 4, { width: CONTENT_W, align: 'right' });
      doc.text(`Página ${i + 1} de ${pageCount.count}`, MARGIN, footerY + 12, { width: CONTENT_W, align: 'center' });
    }

    doc.end();
  }
}
