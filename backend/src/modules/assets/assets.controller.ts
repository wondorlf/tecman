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

    // ── QR Code ──
    let qrImageBuffer: Buffer | null = null;
    if (asset.qrCode) {
      try { qrImageBuffer = await QRCode.toBuffer(asset.qrCode, { width: 100, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }); } catch {}
    }

    // ── E-GAN Logo ──
    let eganLogoBuffer: Buffer | null = null;
    try {
      const fs = await import('fs');
      const path = await import('path');
      const cwd = process.cwd();
      const possiblePaths = [
        path.join(cwd, '..', 'frontend', 'public', 'images', 'egan-logo.png'),
        path.join(cwd, 'frontend', 'public', 'images', 'egan-logo.png'),
        path.join(cwd, 'public', 'images', 'egan-logo.png'),
      ];
      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          eganLogoBuffer = fs.readFileSync(logoPath);
          break;
        }
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

    const drawPageHeader = () => {
      doc.y = PAGE_TOP;
      if (eganLogoBuffer) {
        try { doc.image(eganLogoBuffer, MARGIN, PAGE_TOP, { width: 28, height: 28 }); } catch {}
      }
      const headerTextX = MARGIN + (eganLogoBuffer ? 32 : 0);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text(asset.code || '', headerTextX, PAGE_TOP + 4, { width: CONTENT_W / 2 - 30 });
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(asset.name || '', headerTextX, PAGE_TOP + 17, { width: CONTENT_W / 2 - 30 });
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(companyName, headerTextX, PAGE_TOP + 28);
      doc.rect(MARGIN, PAGE_TOP + 35, CONTENT_W, 0.5).fill('#e2e8f0');
      doc.y = PAGE_TOP + 42;
      doc.fillColor('#000000');
    };

    const sectionTitle = (title: string) => {
      checkBreak(44);
      doc.moveDown(0.5);
      const y = doc.y;
      doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3).fill('#1e293b');
      doc.roundedRect(MARGIN, y, 5, 22, 2).fill('#3b82f6');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff').text(title, MARGIN + 12, y + 6, { width: CONTENT_W - 20 });
      doc.fillColor('#000000');
      doc.y = y + 28;
    };

    const drawTable = (headers: string[], rows: string[][], colWidths: number[], opts?: { headerBg?: string; headerColor?: string; borderColor?: string }) => {
      if (rows.length === 0) return;
      const hBg = opts?.headerBg || '#1e293b';
      const hColor = opts?.headerColor || '#ffffff';
      const bColor = opts?.borderColor || '#e2e8f0';
      checkBreak(26 + rows.length * 16);

      const headerY = doc.y;
      doc.roundedRect(MARGIN + 2, headerY - 2, CONTENT_W - 4, 18, 3).fill(hBg);
      let x = MARGIN + 6;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(hColor);
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, headerY + 2, { width: colWidths[i], continued: false });
        x += colWidths[i];
      }
      doc.y = headerY + 18;

      for (let r = 0; r < rows.length; r++) {
        checkBreak(16);
        x = MARGIN + 6;
        const rowY = doc.y;
        const bgColor = r % 2 === 0 ? '#ffffff' : '#f1f5f9';
        doc.rect(MARGIN + 2, rowY - 1, CONTENT_W - 4, 14).fill(bgColor);
        doc.rect(MARGIN + 2, rowY - 1, 2, 14).fill('#3b82f6');
        doc.font('Helvetica').fillColor('#334155');
        for (let i = 0; i < rows[r].length; i++) {
          doc.fontSize(8).text(rows[r][i] || '—', x, rowY, { width: colWidths[i], continued: false });
          x += colWidths[i];
        }
        doc.y = rowY + 14;
      }
      doc.rect(MARGIN + 2, doc.y, CONTENT_W - 4, 1).fill(bColor);
      doc.y += 5;
      doc.fillColor('#000000');
    };

    const detailCard = (accentColor: string, lines: { text: string; font: string; color: string; size: number }[]) => {
      checkBreak(45);
      const startY = doc.y;
      const cardX = MARGIN + 2;
      const cardW = CONTENT_W - 4;
      let cardH = 8;
      for (const line of lines) {
        cardH += line.size + 4;
      }
      doc.roundedRect(cardX, startY, cardW, cardH, 3).fill('#f8fafc');
      doc.roundedRect(cardX, startY, 3, cardH, 2).fill(accentColor);
      doc.y = startY + 6;
      for (const line of lines) {
        doc.fontSize(line.size).font(line.font).fillColor(line.color).text(line.text, MARGIN + 10, doc.y, { width: CONTENT_W - 22 });
      }
      doc.y = startY + cardH + 4;
      doc.rect(MARGIN + 2, doc.y, CONTENT_W - 4, 0.5).fill('#e2e8f0');
      doc.y += 5;
    };

    // ══════════════════════════════════════════════════════════════════
    // PAGE 1: PORTADA + INFO GENERAL
    // ══════════════════════════════════════════════════════════════════
    newPage();

    // E-GAN logo top left
    if (eganLogoBuffer) {
      try { doc.image(eganLogoBuffer, MARGIN, PAGE_TOP, { width: 35, height: 35 }); } catch {}
    }

    // Title + name + code in header (center)
    const headerTextX = MARGIN + (eganLogoBuffer ? 42 : 0);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('HOJA DE VIDA', headerTextX, PAGE_TOP + 2, { width: CONTENT_W - (eganLogoBuffer ? 42 : 0) });
    doc.fontSize(12).font('Helvetica').fillColor('#334155').text(`${asset.name}`, headerTextX, PAGE_TOP + 20, { width: CONTENT_W - (eganLogoBuffer ? 42 : 0) });
    doc.fontSize(10).fillColor('#64748b').text(`${asset.code}`, headerTextX, PAGE_TOP + 36, { width: CONTENT_W - (eganLogoBuffer ? 42 : 0) });

    // QR Code top right
    if (qrImageBuffer) {
      doc.image(qrImageBuffer, PAGE_W - MARGIN - 50, PAGE_TOP, { width: 50, height: 50 });
    }

    doc.y = PAGE_TOP + 60;
    doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill('#e2e8f0');
    doc.y += 10;

    // ── INFORMACIÓN GENERAL ──
    sectionTitle('INFORMACIÓN GENERAL');
    const responsible = asset.custodies?.[0]?.user?.name || '—';
    const generalRows = [
      ['Código', asset.code || '—', 'Nombre', asset.name || '—'],
      ['Estado', asset.status || '—', 'Responsable/Asignado', responsible],
      ['Categoría', asset.category?.name || '—', 'Subcategoría', asset.subcategory?.name || '—'],
      ['Marca', asset.brand || '—', 'Modelo', asset.model || '—'],
      ['Serial', asset.serialNumber || '—', 'Ubicación', asset.location?.name || '—'],
      ['Proveedor', asset.supplier?.name || '—', 'Costo', asset.acquisitionCost ? `$${Number(asset.acquisitionCost).toLocaleString('es-CO')}` : '—'],
      ['Adquisición', asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString('es-CO') : '—', 'Garantía', asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString('es-CO') : '—'],
    ];
    drawTable(['Campo', 'Valor', 'Campo', 'Valor'], generalRows, [70, CONTENT_W / 2 - 75, 70, CONTENT_W / 2 - 75]);

    // ── ESPECIFICACIONES DEL EQUIPO ──
    const hw = asset.discoveredDevice;
    if (hw) {
      sectionTitle('ESPECIFICACIONES DEL EQUIPO');
      const hwRows = [
        ['Hostname', hw.hostname || '—', 'IP', hw.ipAddress || '—'],
        ['MAC', hw.macAddress || '—', 'OS', hw.os || '—'],
        ['CPU', hw.cpuModel || '—', 'RAM', hw.ramTotalBytes ? `${(Number(hw.ramTotalBytes) / 1073741824).toFixed(1)} GB` : '—'],
        ['Disco', hw.diskTotalBytes ? `${(Number(hw.diskTotalBytes) / 1073741824).toFixed(0)} GB` : '—', 'Tipo Disco', hw.diskType || '—'],
      ];
      drawTable(['Campo', 'Valor', 'Campo', 'Valor'], hwRows, [70, CONTENT_W / 2 - 75, 70, CONTENT_W / 2 - 75]);
    }

    // ══════════════════════════════════════════════════════════════════
    // RESUMEN MANTENIMIENTOS
    // ══════════════════════════════════════════════════════════════════
    const maintenances = asset.maintenances || [];
    sectionTitle(`RESUMEN MANTENIMIENTOS (${maintenances.length})`);
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
      drawTable(['Código', 'Tipo', 'Estado', 'Técnico', 'Fecha'], mRows, [65, 75, 75, 130, 100]);
    }

    // ══════════════════════════════════════════════════════════════════
    // RESUMEN TICKETS DE SOPORTE
    // ══════════════════════════════════════════════════════════════════
    const tickets = asset.tickets || [];
    sectionTitle(`RESUMEN TICKETS DE SOPORTE (${tickets.length})`);
    if (tickets.length === 0) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('  Sin tickets asociados').fillColor('#000');
    } else {
      const tRows = tickets.map((t: any) => [
        t.code || '—',
        (t.title || '—').substring(0, 30),
        t.status || '—',
        t.category || '—',
        t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-CO') : '—',
      ]);
      drawTable(['Código', 'Título', 'Estado', 'Categoría', 'Fecha'], tRows, [60, 160, 75, 90, 100]);
    }

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
      drawTable(['Nombre', 'Tipo', 'Versión', 'Fecha'], dRows, [200, 120, 50, 120]);
    }

    // ══════════════════════════════════════════════════════════════════
    // LÍNEA DE TIEMPO
    // ══════════════════════════════════════════════════════════════════
    const events = asset.hojaVida?.events || [];
    if (events.length > 0) {
      sectionTitle(`LÍNEA DE TIEMPO (${events.length} eventos)`);
      for (const ev of events) {
        checkBreak(22);
        const date = new Date(ev.createdAt);
        const dateStr = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const dotY = doc.y + 2;
        doc.circle(MARGIN + 5, dotY, 2.5).fill('#3b82f6');
        if (ev !== events[events.length - 1]) {
          doc.rect(MARGIN + 4, dotY + 4, 1, 10).fill('#e2e8f0');
        }
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#3b82f6').text(`${dateStr} ${timeStr}`, MARGIN + 12, doc.y);
        doc.fontSize(8).font('Helvetica').fillColor('#334155').text(ev.description || '—', MARGIN + 12, doc.y, { width: CONTENT_W - 16 });
        doc.y += 4;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // DETALLE MANTENIMIENTOS (orden cronológico, reciente primero)
    // ══════════════════════════════════════════════════════════════════
    const sortedMaintenances = [...maintenances].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sortedMaintenances.length > 0) {
      checkBreak(60);
      sectionTitle(`DETALLE MANTENIMIENTOS (${sortedMaintenances.length})`);

      for (const m of sortedMaintenances) {
        checkBreak(55);
        detailCard('#22c55e', [
          { text: `${m.code || '—'}  ·  ${m.type || '—'}  ·  ${m.status || '—'}`, font: 'Helvetica-Bold', color: '#166534', size: 10 },
          { text: `Técnico: ${m.technician?.name || '—'}  |  Fecha: ${m.completedAt ? new Date(m.completedAt).toLocaleDateString('es-CO') : '—'}`, font: 'Helvetica', color: '#64748b', size: 9 },
          ...(m.description ? [{ text: m.description, font: 'Helvetica', color: '#334155', size: 9 }] : []),
          ...(m.checklist ? [{ text: `Checklist: ${m.checklist.name}`, font: 'Helvetica-Bold', color: '#64748b', size: 9 }] : []),
        ]);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // DETALLE TICKETS DE SOPORTE (orden cronológico, reciente primero)
    // ══════════════════════════════════════════════════════════════════
    const sortedTickets = [...tickets].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sortedTickets.length > 0) {
      checkBreak(60);
      sectionTitle(`DETALLE TICKETS DE SOPORTE (${sortedTickets.length})`);

      for (const t of sortedTickets) {
        checkBreak(50);
        detailCard('#3b82f6', [
          { text: `${t.code || '—'}  ·  ${t.status || '—'}`, font: 'Helvetica-Bold', color: '#1e40af', size: 10 },
          { text: `${t.title || '—'}  |  Categoría: ${t.category || '—'}  |  ${t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-CO') : '—'}`, font: 'Helvetica', color: '#64748b', size: 9 },
          ...(t.description ? [{ text: t.description.substring(0, 200), font: 'Helvetica', color: '#334155', size: 9 }] : []),
        ]);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // FOOTER (en cada página)
    // ══════════════════════════════════════════════════════════════════
    const pageCount = doc.bufferedPageRange();
    const usedPages = Math.max(1, Math.ceil(doc.y / PAGE_BOTTOM) || 1);
    for (let i = 0; i < pageCount.count; i++) {
      doc.switchToPage(i);
      const footerY = 765;
      doc.rect(MARGIN, footerY, CONTENT_W, 0.5).fill('#e2e8f0');
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8');
      doc.text('E-GAN TECH', MARGIN, footerY + 3, { width: CONTENT_W / 2, align: 'left' });
      doc.text(`Hoja de Vida · ${asset.code} · ${new Date().toLocaleDateString('es-CO')}`, MARGIN + CONTENT_W / 2, footerY + 3, { width: CONTENT_W / 2, align: 'right' });
      doc.text(`Página ${i + 1} de ${pageCount.count}`, MARGIN, footerY + 10, { width: CONTENT_W, align: 'center' });
    }

    doc.end();
  }
}
