'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { StaggeredItem } from '@/components/shared/section-wrapper';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { EganLogoMark } from '@/components/shared/PublicLayout';
import {
  LayoutDashboard,
  Package,
  Wrench,
  ClipboardList,
  Bell,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Ticket,
  UserCheck,
  Calendar,
  Layers,
  Tag,
  Monitor,
  Clock,
  BookMarked,
  BookOpen,
  GitPullRequest,
  MessageSquare,
  Download,
  BarChart3,
  Printer,
  Shield,
} from 'lucide-react';

const menuGroups = [
  {
    label: 'General',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', exact: true },
      { name: 'Consolidado', icon: BarChart3, href: '/dashboard/consolidated' },
      { name: 'Mis Órdenes', icon: UserCheck, href: '/dashboard/mis-ordenes' },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { name: 'Activos', icon: Package, href: '/dashboard/assets' },
      { name: 'Stickers QR', icon: Printer, href: '/dashboard/assets/stickers' },
      { name: 'Kits', icon: Layers, href: '/dashboard/kits' },
      { name: 'Etiquetas', icon: Tag, href: '/dashboard/tags' },
      { name: 'Asignaciones', icon: UserCheck, href: '/dashboard/custodies' },
      { name: 'Reservas', icon: Calendar, href: '/dashboard/bookings' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { name: 'Mantenimiento', icon: Wrench, href: '/dashboard/maintenance' },
      { name: 'Checklists', icon: ClipboardList, href: '/dashboard/checklists' },
      { name: 'Alertas', icon: Bell, href: '/dashboard/alerts' },
    ],
  },
  {
    label: 'Soporte ITSM',
    items: [
      { name: 'Tickets', icon: Ticket, href: '/dashboard/tickets' },
      { name: 'SLAs', icon: Clock, href: '/dashboard/slas' },
      { name: 'Catálogo', icon: BookOpen, href: '/dashboard/service-catalog' },
      { name: 'Base Conocimiento', icon: BookOpen, href: '/dashboard/knowledge' },
      { name: 'RFC', icon: GitPullRequest, href: '/dashboard/change-requests' },
    ],
  },
  {
    label: 'Infraestructura',
    items: [
      { name: 'Discovery', icon: Monitor, href: '/dashboard/discovery' },
      { name: 'Descargar Agente', icon: Download, href: '/dashboard/agents' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Usuarios', icon: Users, href: '/dashboard/users' },
      { name: 'Roles', icon: Shield, href: '/dashboard/roles' },
      { name: 'Config. Sistema', icon: Settings, href: '/dashboard/tenant' },
      { name: 'Categorías', icon: ClipboardList, href: '/dashboard/settings' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const fetchTenantBranding = useCallback(() => {
    setLogoError(false);
    axios
      .get('/api/tenants/public')
      .then((r) => {
        if (r.data?.companyLogoUrl) setCompanyLogo(r.data.companyLogoUrl);
        if (r.data?.companyName) setCompanyName(r.data.companyName);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTenantBranding();

    // Re-fetch when settings are saved from another tab/page
    const handleTenantUpdate = () => fetchTenantBranding();
    window.addEventListener('tenant-updated', handleTenantUpdate);
    return () => window.removeEventListener('tenant-updated', handleTenantUpdate);
  }, [fetchTenantBranding]);

  const handleLogoError = useCallback(() => {
    setLogoError(true);
  }, []);

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-100 transition-all duration-300 flex flex-col shadow-sm',
        collapsed ? 'w-[68px]' : 'w-60',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-slate-100',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            {companyLogo && !logoError ? (
              <img
                src={companyLogo}
                alt={companyName || 'Logo'}
                className="h-8 w-auto object-contain"
                onError={handleLogoError}
              />
            ) : (
              <EganLogoMark size={32} />
            )}
            <span className="text-lg font-bold text-slate-900">{companyName || 'TecMan'}</span>
          </div>
        )}
        {collapsed &&
          (companyLogo && !logoError ? (
            <img
              src={companyLogo}
              alt={companyName || 'Logo'}
              className="h-8 w-8 object-contain rounded-lg"
              onError={handleLogoError}
            />
          ) : (
            <EganLogoMark size={28} />
          ))}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {menuGroups.map((group, gi) => (
          <div
            key={group.label}
            className="mb-4 last:mb-0 animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-backwards"
            style={{ animationDelay: `${gi * 40}ms` }}
          >
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item, ii) => {
                const active = item.exact
                  ? pathname === item.href
                  : (pathname?.startsWith(item.href) ?? false);
                return (
                  <StaggeredItem
                    key={item.href}
                    index={ii}
                    baseDelay={20}
                    stepMs={20}
                    className="animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-backwards"
                  >
                    <Link
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      <item.icon
                        size={18}
                        className={cn(active ? 'text-blue-600' : 'text-slate-400', 'shrink-0')}
                      />
                      {!collapsed && <span>{item.name}</span>}
                      {active && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </Link>
                  </StaggeredItem>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (bottom) */}
      {collapsed && (
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
