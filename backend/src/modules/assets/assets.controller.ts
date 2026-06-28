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
    const doc = new PDFDocument({ margin: 40, size: 'letter', bufferPages: true, autoFirstPage: false });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hoja-vida-${asset.code}_${Date.now()}.pdf`,
    );
    doc.pipe(res);

    // ── Constants ──
    const PAGE_W = 612;
    const MARGIN = 40;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const PAGE_TOP = 40;
    const PAGE_BOTTOM = 750;
    const companyName = tenant?.companyName || tenant?.name || 'TecMan';
    const companyLogo = tenant?.companyLogoUrl || tenant?.logoUrl || null;
    const companyDoc = tenant?.companyDocument || '';
    const companyAddr = tenant?.companyAddress || '';
    const companyPhone = tenant?.companyPhone || '';

    // ── QR Code ──
    let qrImageBuffer: Buffer | null = null;
    if (asset.qrCode) {
      try { qrImageBuffer = await QRCode.toBuffer(asset.qrCode, { width: 120, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }); } catch {}
    }

    // ── E-GAN Logo ──
    let eganLogoBuffer: Buffer | null = null;
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'images', 'egan-logo.png');
      if (fs.existsSync(logoPath)) {
        eganLogoBuffer = fs.readFileSync(logoPath);
      }
    } catch {}

    // ── Helpers ──
    const newPage = () => {
      doc.addPage();
      doc.y = PAGE_TOP;
    };

    const checkBreak = (needed: number = 50) => {
      if (doc.y + needed > PAGE_BOTTOM) newPage();
    };

    const drawHeader = () => {
      doc.y = PAGE_TOP;
      if (eganLogoBuffer) {
        try { doc.image(eganLogoBuffer, MARGIN, PAGE_TOP, { width: 32, height: 32 }); } catch {}
      }
      if (companyLogo) {
        try { doc.image(companyLogo, MARGIN + (eganLogoBuffer ? 40 : 0), PAGE_TOP, { width: 32, height: 32 }); } catch {}
      }
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('HOJA DE VIDA', MARGIN, PAGE_TOP + 36, { width: CONTENT_W });
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`${asset.name}  ·  ${asset.code}`, MARGIN, PAGE_TOP + 54, { width: CONTENT_W });
      doc.y = PAGE_TOP + 70;
      doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill('#e2e8f0');
      doc.y += 8;
    };

    const sectionTitle = (title: string) => {
      checkBreak(40);
      doc.moveDown(0.3);
      const y = doc.y;
      doc.roundedRect(MARGIN, y, CONTENT_W, 18, 3).fill('#f1f5f9');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b').text(title, MARGIN + 8, y + 4, { width: CONTENT_W - 16 });
      doc.fillColor('#000000');
      doc.y = y + 22;
    };

    const kvRow = (label: string, value: string) => {
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748b').text(label + ':', MARGIN + 5, doc.y, { width: 90, continued: false });
      doc.font('Helvetica').fillColor('#1e293b').text(` ${value || '—'}`, MARGIN + 95, doc.y - 9, { width: CONTENT_W - 100 });
    };

    const drawTable = (headers: string[], rows: string[][], colWidths: number[]) => {
      if (rows.length === 0) return;
      checkBreak(20 + rows.length * 12);

      // Header background
      const headerY = doc.y;
      doc.rect(MARGIN + 2, headerY - 2, CONTENT_W - 4, 14).fill('#e2e8f0');

      let x = MARGIN + 5;
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#475569');
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, headerY, { width: colWidths[i], continued: false });
        x += colWidths[i];
      }
      doc.y = headerY + 14;

      // Rows
      doc.font('Helvetica').fillColor('#334155');
      for (const row of rows) {
        checkBreak(12);
        x = MARGIN + 5;
        const rowY = doc.y;
        doc.rect(MARGIN + 2, rowY - 1, CONTENT_W - 4, 11).fill(doc.y % 24 < 12 ? '#ffffff' : '#f8fafc');
        for (let i = 0; i < row.length; i++) {
          doc.fontSize(6).fillColor('#334155').text(row[i] || '—', x, rowY, { width: colWidths[i], continued: false });
          x += colWidths[i];
        }
        doc.y = rowY + 11;
      }
      doc.fillColor('#000000');
    };

    // ══════════════════════════════════════════════════════════════════
    // PAGE 1: HEADER + INFO GENERAL
    // ══════════════════════════════════════════════════════════════════
    newPage();
    drawHeader();

    // QR Code
    if (qrImageBuffer) {
      doc.image(qrImageBuffer, PAGE_W - MARGIN - 50, PAGE_TOP, { width: 50, height: 50 });
    }

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
    drawTable(['Campo', 'Valor'], generalRows, [100, CONTENT_W - 105]);

    // Hardware
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
      drawTable(['Campo', 'Valor'], hwRows, [100, CONTENT_W - 105]);
    }

    // ══════════════════════════════════════════════════════════════════
    // MANTENIMIENTOS DETALLADOS (orden cronológico)
    // ══════════════════════════════════════════════════════════════════
    const maintenances = (asset.maintenances || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (maintenances.length > 0) {
      newPage();
      drawHeader();
      sectionTitle(`MANTENIMIENTOS (${maintenances.length})`);

      for (const m of maintenances) {
        checkBreak(80);
        const mY = doc.y;

        // Maintenance card
        doc.roundedRect(MARGIN + 2, mY, CONTENT_W - 4, 4, 2).fill('#f0fdf4');
        doc.y = mY + 6;

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#166534').text(`${m.code || '—'}  ·  ${m.type || '—'}  ·  ${m.status || '—'}`, MARGIN + 8, doc.y);
        doc.fontSize(6).font('Helvetica').fillColor('#64748b').text(`Técnico: ${m.technician?.name || '—'}  |  Fecha: ${m.completedAt ? new Date(m.completedAt).toLocaleDateString('es-CO') : '—'}`, MARGIN + 8, doc.y);

        if (m.description) {
          doc.fontSize(6).fillColor('#334155').text(m.description, MARGIN + 8, doc.y, { width: CONTENT_W - 20 });
        }

        // Checklist
        if (m.checklist) {
          doc.fontSize(6).font('Helvetica-Bold').fillColor('#64748b').text(`Checklist: ${m.checklist.name}`, MARGIN + 8, doc.y);
        }

        doc.y += 6;
        doc.rect(MARGIN + 2, doc.y, CONTENT_W - 4, 0.5).fill('#e2e8f0');
        doc.y += 4;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // TICKETS DETALLADOS (orden cronológico)
    // ══════════════════════════════════════════════════════════════════
    const tickets = (asset.tickets || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (tickets.length > 0) {
      checkBreak(100);
      sectionTitle(`TICKETS DE SOPORTE (${tickets.length})`);

      for (const t of tickets) {
        checkBreak(60);
        const tY = doc.y;

        doc.roundedRect(MARGIN + 2, tY, CONTENT_W - 4, 4, 2).fill('#eff6ff');
        doc.y = tY + 6;

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e40af').text(`${t.code || '—'}  ·  ${t.status || '—'}`, MARGIN + 8, doc.y);
        doc.fontSize(6).font('Helvetica').fillColor('#64748b').text(`${t.title || '—'}  |  Categoría: ${t.category || '—'}  |  ${t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-CO') : '—'}`, MARGIN + 8, doc.y);

        if (t.description) {
          doc.fontSize(6).fillColor('#334155').text(t.description.substring(0, 200), MARGIN + 8, doc.y, { width: CONTENT_W - 20 });
        }

        doc.y += 6;
        doc.rect(MARGIN + 2, doc.y, CONTENT_W - 4, 0.5).fill('#e2e8f0');
        doc.y += 4;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // DOCUMENTOS
    // ══════════════════════════════════════════════════════════════════
    const documents = asset.documents || [];
    if (documents.length > 0) {
      checkBreak(40);
      sectionTitle(`DOCUMENTOS (${documents.length})`);
      const dRows = documents.map((d: any) => [
        d.name || '—',
        d.type || '—',
        `v${d.version || 1}`,
        d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-CO') : '—',
      ]);
      drawTable(['Nombre', 'Tipo', 'Versión', 'Fecha'], dRows, [200, 120, 50, 120]);
    }

    // ══════════════════════════════════════════════════════════════════
    // LÍNEA DE TIEMPO
    // ══════════════════════════════════════════════════════════════════
    const events = asset.hojaVida?.events || [];
    if (events.length > 0) {
      checkBreak(40);
      sectionTitle(`LÍNEA DE TIEMPO (${events.length} eventos)`);

      for (const ev of events) {
        checkBreak(25);
        const date = new Date(ev.createdAt);
        const dateStr = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        const dotY = doc.y + 3;
        doc.circle(MARGIN + 6, dotY, 2.5).fill('#3b82f6');
        if (ev !== events[events.length - 1]) {
          doc.rect(MARGIN + 5, dotY + 4, 1, 10).fill('#e2e8f0');
        }

        doc.fontSize(6).font('Helvetica-Bold').fillColor('#3b82f6').text(`${dateStr}  ${timeStr}`, MARGIN + 14, doc.y);
        doc.fontSize(6).font('Helvetica').fillColor('#334155').text(ev.description || '—', MARGIN + 14, doc.y, { width: CONTENT_W - 20 });
        doc.y += 4;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // FOOTER (en cada página)
    // ══════════════════════════════════════════════════════════════════
    const pageCount = doc.bufferedPageRange();
    for (let i = 0; i < pageCount.count; i++) {
      doc.switchToPage(i);
      const footerY = 765;
      doc.rect(MARGIN, footerY, CONTENT_W, 0.5).fill('#e2e8f0');
      doc.fontSize(5).font('Helvetica').fillColor('#94a3b8');
      doc.text(companyName, MARGIN, footerY + 3, { width: CONTENT_W / 2, align: 'left' });
      doc.text(`Hoja de Vida · ${asset.code} · ${new Date().toLocaleDateString('es-CO')}`, MARGIN + CONTENT_W / 2, footerY + 3, { width: CONTENT_W / 2, align: 'right' });
      doc.text(`${i + 1} / ${pageCount.count}`, MARGIN, footerY + 9, { width: CONTENT_W, align: 'center' });
    }

    doc.end();
  }
}
