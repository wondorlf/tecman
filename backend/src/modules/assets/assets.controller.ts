import { Controller, Get, Post, Body, Param, Delete, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssetsService } from './assets.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
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

  @Get()
  @ApiOperation({ summary: 'List assets with filters' })
  findAll(@Query() query: Record<string, string>) {
    return this.assetsService.findAll(query);
  }

  @Public()
  @Get('qr/:code')
  @ApiOperation({ summary: 'Lookup asset by QR code (public)' })
  findByQr(@Param('code') code: string) {
    return this.assetsService.findByQrCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create asset' })
  create(@Body() data: any) {
    return this.assetsService.create(data);
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
    const PAGE_W = 612;
    const MARGIN = 50;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const PAGE_BOTTOM = 750;

    // ── Helper: check page break ──
    const checkPageBreak = (neededSpace: number = 60) => {
      if (doc.y + neededSpace > PAGE_BOTTOM) {
        doc.addPage();
      }
    };

    // ── Helper: section title with colored bar ──
    const sectionTitle = (title: string) => {
      checkPageBreak(40);
      doc.moveDown(0.5);
      const y = doc.y;
      doc.rect(MARGIN, y, CONTENT_W, 20).fill('#f1f5f9');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(title, MARGIN + 8, y + 5, { width: CONTENT_W - 16 });
      doc.fillColor('#000000');
      doc.y = y + 24;
    };

    // ── Helper: key-value row ──
    const kvRow = (label: string, value: string) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text(label + ':', MARGIN + 5, doc.y, { width: 100, continued: false });
      doc.font('Helvetica').fillColor('#1e293b').text(` ${value || '—'}`, MARGIN + 105, doc.y - 10, { width: CONTENT_W - 110 });
    };

    // ── Helper: draw table ──
    const drawTable = (headers: string[], rows: string[][], colWidths: number[]) => {
      if (rows.length === 0) return;

      // Header
      checkPageBreak(30);
      let x = MARGIN + 5;
      const headerY = doc.y;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569');
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, headerY, { width: colWidths[i], continued: false });
        x += colWidths[i];
      }
      doc.y = headerY + 12;
      doc.rect(MARGIN + 5, doc.y, CONTENT_W - 10, 0.5).fill('#cbd5e1');
      doc.y += 4;

      // Rows
      doc.font('Helvetica').fillColor('#334155');
      for (const row of rows) {
        checkPageBreak(14);
        x = MARGIN + 5;
        const rowY = doc.y;
        for (let i = 0; i < row.length; i++) {
          doc.fontSize(7).text(row[i] || '—', x, rowY, { width: colWidths[i], continued: false });
          x += colWidths[i];
        }
        doc.y = rowY + 11;
      }
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

    doc.y = 100;
    doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill('#e2e8f0');
    doc.y += 8;

    // ══════════════════════════════════════════════════════════════════
    // INFORMACIÓN GENERAL
    // ══════════════════════════════════════════════════════════════════
    sectionTitle('INFORMACIÓN GENERAL');

    const generalRows = [
      ['Código', asset.code || '—'],
      ['Nombre', asset.name || '—'],
      ['Estado', asset.status || '—'],
      ['Categoría', asset.category?.name || '—'],
      ['Subcategoría', asset.subcategory?.name || '—'],
      ['Marca', asset.brand || '—'],
      ['Modelo', asset.model || '—'],
      ['Serial', asset.serialNumber || '—'],
      ['Ubicación', asset.location?.name || '—'],
      ['Proveedor', asset.supplier?.name || '—'],
      ['Costo', asset.acquisitionCost ? `$${Number(asset.acquisitionCost).toLocaleString('es-CO')}` : '—'],
      ['Adquisición', asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString('es-CO') : '—'],
      ['Garantía', asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString('es-CO') : '—'],
    ];

    drawTable(['Campo', 'Valor'], generalRows, [120, CONTENT_W - 125]);
    doc.y += 5;

    // ══════════════════════════════════════════════════════════════════
    // HARDWARE (Discovery data)
    // ══════════════════════════════════════════════════════════════════
    const hw = asset.discoveredDevice;
    if (hw) {
      sectionTitle('ESPECIFICACIONES DEL EQUIPO');
      const hwRows = [
        ['Hostname', hw.hostname || '—'],
        ['IP', hw.ipAddress || '—'],
        ['MAC', hw.macAddress || '—'],
        ['OS', hw.os || '—'],
        ['CPU', hw.cpuModel || '—'],
        ['RAM', hw.ramTotalBytes ? `${(Number(hw.ramTotalBytes) / 1073741824).toFixed(1)} GB` : '—'],
        ['Disco', hw.diskTotalBytes ? `${(Number(hw.diskTotalBytes) / 1073741824).toFixed(0)} GB` : '—'],
        ['Tipo Disco', hw.diskType || '—'],
      ];
      drawTable(['Campo', 'Valor'], hwRows, [120, CONTENT_W - 125]);
      doc.y += 5;
    }

    // ══════════════════════════════════════════════════════════════════
    // MANTENIMIENTOS
    // ══════════════════════════════════════════════════════════════════
    const maintenances = asset.maintenances || [];
    sectionTitle(`MANTENIMIENTOS (${maintenances.length})`);
    if (maintenances.length === 0) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('  Sin registros de mantenimiento').fillColor('#000');
    } else {
      const mRows = maintenances.map((m: any) => [
        m.code || '—',
        m.type || '—',
        m.status || '—',
        m.technician?.name || '—',
        m.completedAt ? new Date(m.completedAt).toLocaleDateString('es-CO') : '—',
      ]);
      drawTable(['Código', 'Tipo', 'Estado', 'Técnico', 'Fecha'], mRows, [70, 80, 80, 130, 100]);
    }
    doc.y += 5;

    // ══════════════════════════════════════════════════════════════════
    // TICKETS
    // ══════════════════════════════════════════════════════════════════
    const tickets = asset.tickets || [];
    sectionTitle(`TICKETS DE SOPORTE (${tickets.length})`);
    if (tickets.length === 0) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('  Sin tickets asociados').fillColor('#000');
    } else {
      const tRows = tickets.map((t: any) => [
        t.code || '—',
        (t.title || '—').substring(0, 35),
        t.status || '—',
        t.category || '—',
        t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-CO') : '—',
      ]);
      drawTable(['Código', 'Título', 'Estado', 'Categoría', 'Fecha'], tRows, [65, 170, 80, 90, 100]);
    }
    doc.y += 5;

    // ══════════════════════════════════════════════════════════════════
    // DOCUMENTOS
    // ══════════════════════════════════════════════════════════════════
    const documents = asset.documents || [];
    if (documents.length > 0) {
      sectionTitle(`DOCUMENTOS (${documents.length})`);
      const dRows = documents.map((d: any) => [
        d.name || '—',
        d.type || '—',
        `v${d.version || 1}`,
        d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-CO') : '—',
      ]);
      drawTable(['Nombre', 'Tipo', 'Versión', 'Fecha'], dRows, [200, 120, 60, 120]);
      doc.y += 5;
    }

    // ══════════════════════════════════════════════════════════════════
    // LÍNEA DE TIEMPO
    // ══════════════════════════════════════════════════════════════════
    const events = asset.hojaVida?.events || [];
    sectionTitle(`LÍNEA DE TIEMPO (${events.length} eventos)`);

    if (events.length === 0) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('  Sin eventos registrados').fillColor('#000');
    } else {
      for (const ev of events) {
        checkPageBreak(30);
        const date = new Date(ev.createdAt);
        const dateStr = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        // Timeline dot
        const dotY = doc.y + 3;
        doc.circle(MARGIN + 4, dotY, 3).fill('#3b82f6');
        if (ev !== events[events.length - 1]) {
          doc.rect(MARGIN + 3, dotY + 5, 1, 12).fill('#e2e8f0');
        }

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#3b82f6').text(`${dateStr}  ${timeStr}`, MARGIN + 14, doc.y - 2);
        doc.fontSize(8).font('Helvetica').fillColor('#334155').text(ev.description || '—', MARGIN + 14, doc.y, { width: CONTENT_W - 30 });
        doc.y += 4;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // FOOTER (en cada página)
    // ══════════════════════════════════════════════════════════════════
    const pageCount = doc.bufferedPageRange();
    for (let i = 0; i < pageCount.count; i++) {
      doc.switchToPage(i);
      const footerY = 760;
      doc.rect(MARGIN, footerY, CONTENT_W, 0.5).fill('#e2e8f0');
      doc.fontSize(6).font('Helvetica').fillColor('#94a3b8');
      doc.text(companyName, MARGIN, footerY + 4, { width: CONTENT_W / 2, align: 'left' });
      doc.text(`Hoja de Vida · ${asset.code}`, MARGIN + CONTENT_W / 2, footerY + 4, { width: CONTENT_W / 2, align: 'right' });
      doc.text(`Página ${i + 1} de ${pageCount.count}`, MARGIN, footerY + 12, { width: CONTENT_W, align: 'center' });
    }

    doc.end();
  }
}
