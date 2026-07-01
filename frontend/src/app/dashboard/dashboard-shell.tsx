'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import { Header } from '@/components/header';
import { useTicketNotifications } from '@/components/providers/websocket-provider';
import FloatingHelp from '@/components/floating-help';
import { initAuth, getUser, clearUser } from '@/lib/api';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const hasUser = !!getUser();
      if (!hasUser) {
        router.replace('/');
        return;
      }

      // Intentar refrescar access token usando cookie httpOnly
      const authOk = await initAuth();
      if (!authOk) {
        // Si el refresh falla, limpiar datos stale para evitar loop infinito
        clearUser();
        router.replace('/');
        return;
      }

      setReady(true);
    };

    checkAuth();
  }, [router]);

  // Close sidebar on route change (mobile)
  const handleSidebarNavigate = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Activate real-time ticket notifications across all dashboard pages
  useTicketNotifications();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={handleSidebarNavigate} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarOpen((p) => !p)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      <FloatingHelp />
    </div>
  );
}
