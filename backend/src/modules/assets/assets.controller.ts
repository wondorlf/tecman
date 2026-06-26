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
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hoja-vida-${asset.code}_${Date.now()}.pdf`,
    );
    doc.pipe(res);

    // ── Generar QR del activo ──
    let qrImageBuffer: Buffer | null = null;
    if (asset.qrCode) {
      try {
        qrImageBuffer = await QRCode.toBuffer(asset.qrCode, {
          width: 200,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
      } catch {
        // Ignorar si no se puede generar el QR
      }
    }

    // ── Header con logo de la empresa ──
    const companyName = tenant?.companyName || tenant?.name || 'TecMan';
    const companyLogo = tenant?.companyLogoUrl || tenant?.logoUrl || null;
    const companyDoc = tenant?.companyDocument || '';
    const companyAddr = tenant?.companyAddress || '';
    const companyPhone = tenant?.companyPhone || '';
    const companyEmail = tenant?.companyEmail || '';

    // Logo (si hay URL)
    if (companyLogo) {
      try {
        doc.image(companyLogo, 50, 50, { width: 60, height: 60 });
      } catch {
        // Ignorar si la imagen no se puede cargar
      }
    }

    // QR Code en la esquina superior derecha
    if (qrImageBuffer) {
      doc.image(qrImageBuffer, 485, 45, { width: 65, height: 65 });
    }

    // Información de la empresa a la derecha (right-aligned al margen derecho x=545)
    const rightX = qrImageBuffer ? 475 : 545;
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text(companyName, rightX, companyLogo ? 55 : 50, { align: 'right' });

    const infoLines = [
      companyDoc && `NIT: ${companyDoc}`,
      companyAddr,
      companyPhone && `Tel: ${companyPhone}`,
      companyEmail && `Email: ${companyEmail}`,
    ]
      .filter(Boolean)
      .join(' | ');

    if (infoLines) {
      doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(infoLines, { align: 'right' });
    }

    // Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Hoja de Vida', { align: 'center' });
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Activo: ${asset.name} (${asset.code})`, { align: 'center' });
    doc.moveDown(0.5);

    // ── Separador ──
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown();

    // ── Información general ──
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Información General');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#475569');

    const infoRows = [
      ['Código', asset.code],
      ['Nombre', asset.name],
      ['Estado', asset.status],
      ['Categoría', asset.category?.name || '—'],
      ['Subcategoría', asset.subcategory?.name || '—'],
      ['Marca', asset.brand || '—'],
      ['Modelo', asset.model || '—'],
      ['Serial', asset.serialNumber || '—'],
      ['Ubicación', asset.location?.name || '—'],
      ['Proveedor', asset.supplier?.name || '—'],
      [
        'Fecha Adq.',
        asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString('es-CO') : '—',
      ],
      [
        'Garantía hasta',
        asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString('es-CO') : '—',
      ],
    ];

    for (const [label, value] of infoRows) {
      doc.text(`${label}: ${value}`, { continued: false });
    }
    doc.moveDown();

    // ── Eventos (Hoja de Vida) ──
    const events = asset.hojaVida?.events || [];
    if (events.length > 0) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Línea de Tiempo');
      doc.moveDown(0.3);

      for (const ev of events) {
        const date = new Date(ev.createdAt).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#3b82f6').text(`▸ ${date}`);
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#334155')
          .text(`   ${ev.description}`, { width: 460 });
        doc.moveDown(0.3);
      }
    }

    // ── Mantenimientos ──
    const maintenances = asset.maintenances || [];
    if (maintenances.length > 0) {
      if (doc.y > 650) doc.addPage();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Mantenimientos');
      doc.moveDown(0.3);

      for (const m of maintenances) {
        if (doc.y > 700) doc.addPage();
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#334155')
          .text(
            `${m.code} · ${m.type} · ${m.status}` +
              (m.technician?.name ? ` · Técnico: ${m.technician.name}` : '') +
              (m.completedAt ? ` · ${new Date(m.completedAt).toLocaleDateString('es-CO')}` : ''),
          );
        doc.moveDown(0.2);
      }
    }

    // ── Tickets ──
    const tickets = asset.tickets || [];
    if (tickets.length > 0) {
      if (doc.y > 650) doc.addPage();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Tickets Asociados');
      doc.moveDown(0.3);

      for (const t of tickets) {
        if (doc.y > 720) doc.addPage();
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#334155')
          .text(
            `${t.code} · ${t.title} · ${t.status} · ${new Date(t.createdAt).toLocaleDateString('es-CO')}`,
          );
        doc.moveDown(0.2);
      }
    }

    // ── Footer con datos de empresa ──
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);

    // Línea 1: nombre empresa
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#64748b')
      .text(companyName, { align: 'center' });

    // Línea 2: datos de contacto
    const footerInfo = [
      companyDoc && `NIT: ${companyDoc}`,
      companyPhone && `Tel: ${companyPhone}`,
      companyEmail,
    ]
      .filter(Boolean)
      .join(' · ');
    if (footerInfo) {
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(footerInfo, { align: 'center' });
    }

    // Línea 3: fecha de generación
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text(
        `Generado el ${new Date().toLocaleString('es-CO')} · TecMan © ${new Date().getFullYear()}`,
        { align: 'center' },
      );

    doc.end();
  }
}
