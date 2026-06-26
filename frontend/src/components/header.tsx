'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authApi, alertsApi, clearUser, setAccessToken } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import { useState } from 'react';

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/mis-ordenes': 'Mis Órdenes',
  '/dashboard/assets': 'Activos',
  '/dashboard/maintenance': 'Mantenimiento',
  '/dashboard/checklists': 'Checklists',
  '/dashboard/alerts': 'Alertas',
  '/dashboard/tickets': 'Tickets',
  '/dashboard/users': 'Usuarios',
  '/dashboard/settings': 'Configuración',
  '/dashboard/discovery': 'Discovery',
  '/dashboard/agents': 'Agentes',
  '/dashboard/knowledge': 'Conocimiento',
  '/dashboard/kits': 'Kits',
  '/dashboard/tags': 'Etiquetas',
  '/dashboard/custodies': 'Asignaciones',
  '/dashboard/bookings': 'Reservas',
  '/dashboard/slas': 'SLAs',
  '/dashboard/service-catalog': 'Catálogo',
  '/dashboard/change-requests': 'RFC',
  '/dashboard/tenant': 'Config. Sistema',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [showUser, setShowUser] = useState(false);

  const title = (pathname && BREADCRUMB_MAP[pathname]) || 'TecMan';

  const user = (() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const { data: alerts } = useQuery({
    queryKey: ['alerts-unresolved'],
    queryFn: async () => {
      const res = await alertsApi.list({ resolved: 'false' });
      return res.data as any[];
    },
    refetchInterval: 60000,
  });

  const unresolved = alerts?.length ?? 0;

  const handleLogout = () => {
    // Intentar cerrar sesión en backend — limpia la cookie httpOnly
    authApi.logout().catch(() => {});
    setAccessToken(null);
    clearUser();
    disconnectSocket();
    router.push('/');
  };

  return (
    <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Alerts bell */}
        <button
          onClick={() => router.push('/dashboard/alerts')}
          className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Bell size={18} />
          {unresolved > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
              {unresolved > 9 ? '9+' : unresolved}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={14} className="text-blue-600" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-slate-800 leading-none">
                {user?.name || 'Usuario'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{user?.role?.name || ''}</div>
            </div>
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-800">{user?.name}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
