import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let ticketsCurrentMonth = 0;
    let ticketsPreviousMonth = 0;
    let maintCompletedCurrentMonth = 0;
    let maintCompletedPreviousMonth = 0;
    let assetsCreatedCurrentMonth = 0;
    let assetsCreatedPreviousMonth = 0;
    let resolvedTicketsCurrentMonth = 0;
    let resolvedTicketsPreviousMonth = 0;

    try {
      [ticketsCurrentMonth, ticketsPreviousMonth, maintCompletedCurrentMonth, maintCompletedPreviousMonth, assetsCreatedCurrentMonth, assetsCreatedPreviousMonth, resolvedTicketsCurrentMonth, resolvedTicketsPreviousMonth] = await Promise.all([
        this.prisma.ticket.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
        this.prisma.ticket.count({ where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } } }),
        this.prisma.maintenance.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfCurrentMonth } } }),
        this.prisma.maintenance.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } } }),
        this.prisma.asset.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
        this.prisma.asset.count({ where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } } }),
        this.prisma.ticket.count({ where: { resolvedAt: { gte: startOfCurrentMonth } } }).catch(() => 0),
        this.prisma.ticket.count({ where: { resolvedAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } } }).catch(() => 0),
      ]);
    } catch {}

    const [assetsCount, pendingMaint, activeAlerts, usersCount, assetsByStatus, maintenanceByType] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.maintenance.count({ where: { status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] } } }),
      this.prisma.alert.count({ where: { resolved: false } }),
      this.prisma.user.count({ where: { active: true } }),
      this.prisma.asset.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.maintenance.groupBy({ by: ['type'], _count: { type: true } }),
    ]);

    return {
      assetsCount,
      pendingMaint,
      activeAlerts,
      usersCount,
      assetsByStatus,
      maintenanceByType,
      comparison: {
        ticketsCreated: { current: ticketsCurrentMonth, previous: ticketsPreviousMonth },
        maintCompleted: { current: maintCompletedCurrentMonth, previous: maintCompletedPreviousMonth },
        assetsCreated: { current: assetsCreatedCurrentMonth, previous: assetsCreatedPreviousMonth },
        ticketsResolved: { current: resolvedTicketsCurrentMonth, previous: resolvedTicketsPreviousMonth },
      },
    };
  }

  async getRecent() {
    const [recentAssets, recentMaint, recentAlerts] = await Promise.all([
      this.prisma.asset.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          category: { select: { name: true } },
        },
      }),
      this.prisma.maintenance.findMany({
        take: 5,
        where: { status: { not: 'COMPLETED' } },
        orderBy: { scheduledDate: 'asc' },
        include: {
          asset: { select: { id: true, name: true, code: true } },
          technician: { select: { id: true, name: true } },
        },
      }),
      this.prisma.alert.findMany({
        take: 5,
        where: { resolved: false },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          asset: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    return { recentAssets, recentMaint, recentAlerts };
  }

  /**
   * Genera datos para el reporte mensual con KPIs.
   * Devuelve un array de objetos plano para exportar a XLSX.
   */
  async getReportData() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // ── Obtener KPIs generales ──
    const [
      totalAssets,
      totalMaintenances,
      totalTickets,
      totalAlerts,
      assetsByStatus,
      maintenanceByType,
      maintenanceByStatus,
      ticketsByStatus,
      alertsByPriority,
      usersCount,
    ] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.maintenance.count(),
      this.prisma.ticket.count(),
      this.prisma.alert.count(),
      this.prisma.asset.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.maintenance.groupBy({ by: ['type'], _count: { type: true } }),
      this.prisma.maintenance.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.ticket.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.alert.groupBy({ by: ['priority'], _count: { priority: true } }),
      this.prisma.user.count({ where: { active: true } }),
    ]);

    // ── Datos mensuales (últimos 6 meses) ──
    const monthlyData: Array<{
      month: string;
      ticketsCreated: number;
      ticketsResolved: number;
      maintCreated: number;
      maintCompleted: number;
      assetsCreated: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthName = monthStart.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

      const [ticketsCreated, ticketsResolved, maintCreated, maintCompleted, assetsCreated] =
        await Promise.all([
          this.prisma.ticket.count({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
          }),
          this.prisma.ticket.count({
            where: { resolvedAt: { gte: monthStart, lt: monthEnd } },
          }),
          this.prisma.maintenance.count({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
          }),
          this.prisma.maintenance.count({
            where: { completedAt: { gte: monthStart, lt: monthEnd } },
          }),
          this.prisma.asset.count({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
          }),
        ]);

      monthlyData.push({
        month: monthName,
        ticketsCreated,
        ticketsResolved,
        maintCreated,
        maintCompleted,
        assetsCreated,
      });
    }

    // ── Construir rows planas para XLSX ──
    const rows: Record<string, string | number>[] = [];

    // Sección: Resumen General
    rows.push({ Indicador: 'RESUMEN GENERAL', Valor: '', Detalle: '' });
    rows.push({ Indicador: 'Total Activos', Valor: totalAssets, Detalle: '' });
    rows.push({ Indicador: 'Total Mantenimientos', Valor: totalMaintenances, Detalle: '' });
    rows.push({ Indicador: 'Total Tickets', Valor: totalTickets, Detalle: '' });
    rows.push({ Indicador: 'Total Alertas', Valor: totalAlerts, Detalle: '' });
    rows.push({ Indicador: 'Usuarios Activos', Valor: usersCount, Detalle: '' });
    rows.push({ Indicador: '', Valor: '', Detalle: '' });

    // Sección: Activos por Estado
    rows.push({ Indicador: 'ACTIVOS POR ESTADO', Valor: 'Cantidad', Detalle: '' });
    for (const s of assetsByStatus) {
      const label =
        {
          ACTIVE: 'Activo',
          MAINTENANCE: 'En mantenimiento',
          INACTIVE: 'Inactivo',
          DISPOSED: 'Dado de baja',
          RESERVED: 'Reservado',
        }[s.status] || s.status;
      rows.push({ Indicador: `  ${label}`, Valor: s._count.status, Detalle: '' });
    }
    rows.push({ Indicador: '', Valor: '', Detalle: '' });

    // Sección: Mantenimientos
    rows.push({ Indicador: 'MANTENIMIENTOS', Valor: 'Cantidad', Detalle: '' });
    for (const m of maintenanceByType) {
      const label =
        {
          PREVENTIVE: 'Preventivo',
          CORRECTIVE: 'Correctivo',
          PREDICTIVE: 'Predictivo',
        }[m.type] || m.type;
      rows.push({ Indicador: `  Tipo: ${label}`, Valor: m._count.type, Detalle: '' });
    }
    for (const m of maintenanceByStatus) {
      const label =
        {
          PENDING: 'Pendiente',
          SCHEDULED: 'Programado',
          IN_PROGRESS: 'En proceso',
          COMPLETED: 'Completado',
          CANCELLED: 'Cancelado',
        }[m.status] || m.status;
      rows.push({ Indicador: `  Estado: ${label}`, Valor: m._count.status, Detalle: '' });
    }
    rows.push({ Indicador: '', Valor: '', Detalle: '' });

    // Sección: Tickets
    rows.push({ Indicador: 'TICKETS', Valor: 'Cantidad', Detalle: '' });
    for (const t of ticketsByStatus) {
      const label =
        {
          OPEN: 'Abierto',
          IN_PROGRESS: 'En proceso',
          WAITING_ON_USER: 'Esperando usuario',
          RESOLVED: 'Resuelto',
          CLOSED: 'Cerrado',
        }[t.status] || t.status;
      rows.push({ Indicador: `  ${label}`, Valor: t._count.status, Detalle: '' });
    }
    rows.push({ Indicador: '', Valor: '', Detalle: '' });

    // Sección: Alertas por Prioridad
    rows.push({ Indicador: 'ALERTAS POR PRIORIDAD', Valor: 'Cantidad', Detalle: '' });
    for (const a of alertsByPriority) {
      const label =
        {
          LOW: 'Baja',
          MEDIUM: 'Media',
          HIGH: 'Alta',
          CRITICAL: 'Crítica',
        }[a.priority] || a.priority;
      rows.push({ Indicador: `  ${label}`, Valor: a._count.priority, Detalle: '' });
    }
    rows.push({ Indicador: '', Valor: '', Detalle: '' });

    // Sección: Tendencia Mensual (últimos 6 meses)
    rows.push({ Indicador: 'TENDENCIA MENSUAL', Valor: '', Detalle: '' });
    rows.push({
      Indicador: 'Mes',
      Valor: 'Tickets Creados',
      Detalle: 'Tickets Resueltos | Maint. Creados | Maint. Completados | Activos Creados',
    });
    for (const m of monthlyData) {
      rows.push({
        Indicador: m.month,
        Valor: m.ticketsCreated,
        Detalle: `${m.ticketsResolved} | ${m.maintCreated} | ${m.maintCompleted} | ${m.assetsCreated}`,
      });
    }

    return rows;
  }
}
