'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import { Header } from '@/components/header';
import { initAuth, getAccessToken, getUser, clearUser } from '@/lib/api';

export default function DashboardGroupShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Verificar si hay sesión activa (cookie httpOnly) o token en memoria
      const hasUser = !!getUser();
      if (!hasUser) {
        router.replace('/');
        return;
      }

      // Intentar refrescar el access token usando la cookie httpOnly
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
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
