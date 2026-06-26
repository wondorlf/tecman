'use client';

import { cn } from '@/lib/utils';
import {
  AssetStatus,
  MaintenanceStatus,
  Priority,
  TicketStatus,
  ASSET_STATUS_LABELS,
  MAINTENANCE_STATUS_LABELS,
  PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@/lib/types';

const statusConfig: Record<string, { label: string; className: string }> = {
  // Asset
  ACTIVE: { label: ASSET_STATUS_LABELS.ACTIVE, className: 'bg-emerald-100 text-emerald-700' },
  MAINTENANCE: { label: ASSET_STATUS_LABELS.MAINTENANCE, className: 'bg-amber-100 text-amber-700' },
  INACTIVE: { label: ASSET_STATUS_LABELS.INACTIVE, className: 'bg-slate-100 text-slate-500' },
  DISPOSED: { label: ASSET_STATUS_LABELS.DISPOSED, className: 'bg-red-100 text-red-600' },
  RESERVED: { label: ASSET_STATUS_LABELS.RESERVED, className: 'bg-indigo-100 text-indigo-700' },
  // Maintenance
  PENDING: { label: MAINTENANCE_STATUS_LABELS.PENDING, className: 'bg-slate-100 text-slate-600' },
  SCHEDULED: { label: MAINTENANCE_STATUS_LABELS.SCHEDULED, className: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: {
    label: MAINTENANCE_STATUS_LABELS.IN_PROGRESS,
    className: 'bg-amber-100 text-amber-700',
  },
  COMPLETED: {
    label: MAINTENANCE_STATUS_LABELS.COMPLETED,
    className: 'bg-emerald-100 text-emerald-700',
  },
  CANCELLED: { label: MAINTENANCE_STATUS_LABELS.CANCELLED, className: 'bg-red-100 text-red-600' },
  // Priority
  LOW: { label: PRIORITY_LABELS.LOW, className: 'bg-slate-100 text-slate-500' },
  MEDIUM: { label: PRIORITY_LABELS.MEDIUM, className: 'bg-amber-100 text-amber-700' },
  HIGH: { label: PRIORITY_LABELS.HIGH, className: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: PRIORITY_LABELS.CRITICAL, className: 'bg-red-100 text-red-700 font-bold' },
  // Ticket
  OPEN: { label: TICKET_STATUS_LABELS.OPEN, className: 'bg-blue-100 text-blue-700' },
  WAITING_ON_USER: {
    label: TICKET_STATUS_LABELS.WAITING_ON_USER,
    className: 'bg-purple-100 text-purple-700',
  },
  RESOLVED: { label: TICKET_STATUS_LABELS.RESOLVED, className: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: TICKET_STATUS_LABELS.CLOSED, className: 'bg-slate-100 text-slate-500' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
