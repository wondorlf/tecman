'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authApi, setAccessToken, setUser, initAuth } from '@/lib/api';
import {
  Lock,
  Mail,
  Loader2,
  ShieldCheck,
  Headphones,
  QrCode,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import axios from 'axios';
import { PublicLayout, EganLogoMark } from '@/components/shared/PublicLayout';

function LandingContent() {
  const [mode, setMode] = useState<'home' | 'login'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    axios
      .get('/api/tenants/public')
      .then((r) => setBranding(r.data))
      .catch(() => {});

    // Verificar si hay sesión REAL (no solo stale data en localStorage)
    const checkSession = async () => {
      const user = localStorage.getItem('user');
      if (!user) return;

      // Validar que la sesión es válida intentando refrescar el token
      const authOk = await initAuth();
      if (authOk) {
        router.replace('/dashboard');
      } else {
        // Sesión expirada o inválida — limpiar datos stale
        localStorage.removeItem('user');
        // No redirigir — el usuario se queda en la landing page
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const loginEmail = email.toLowerCase() === 'egan' ? 'egan@tecman.com' : email;
    try {
      const response = await authApi.login(loginEmail, password);
      setAccessToken(response.data.access_token);
      setUser(response.data.user);
      toast({
        title: '¡Bienvenido!',
        description: `Sesión iniciada como ${response.data.user.name}`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error de acceso',
        description: error.response?.data?.message || 'Credenciales incorrectas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN VIEW ─────────────────────────────────────────────────────────────
  if (mode === 'login') {
    return (
      <PublicLayout showBack={false} maxWidth="max-w-lg">
        <div className="pt-10 pb-6">
          {/* Back button */}
          <button
            onClick={() => setMode('home')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors mb-8 group"
          >
            <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Volver
          </button>

          {/* Card */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.07)] p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h1>
              <p className="text-slate-500 text-sm mt-1">Accede al panel de gestión EGAN-TECH</p>
            </div>

            {/* E-GAN logo strip */}
            <div className="flex items-center justify-center gap-2 mb-8 pb-8 border-b border-slate-100">
              <EganLogoMark size={28} />
              <span className="text-slate-300 font-black text-sm tracking-widest uppercase">
                E-GAN · TECH
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="login-email"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Usuario o Correo
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="login-email"
                    type="text"
                    placeholder="usuario@empresa.com"
                    className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="login-password"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all text-base mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" /> Autenticando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ── HOME VIEW ──────────────────────────────────────────────────────────────
  return (
    <PublicLayout maxWidth="max-w-4xl">
      <div className="pt-14 pb-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Sistema de Gestión TI
        </div>

        {/* Logo + title */}
        <div className="flex flex-col items-center mb-4">
          <EganLogoMark size={64} />
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mt-4 leading-none text-slate-900">
            EGAN<span className="text-blue-600">-TECH</span>
          </h1>
        </div>
        <p className="text-slate-500 text-lg max-w-lg mx-auto mb-14 leading-relaxed">
          {branding?.supportPortalSubtitle ||
            'Plataforma inteligente de gestión de activos, mantenimiento y soporte técnico.'}
        </p>

        {/* 3 Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {/* Card 1: Login */}
          <button
            id="home-btn-login"
            onClick={() => setMode('login')}
            className="group bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-7 text-left transition-all duration-300 hover:shadow-[0_20px_50px_rgba(37,99,235,0.12)] shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">Iniciar Sesión</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Accede al panel de gestión, inventario y reportes del sistema.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-blue-600 text-sm font-bold group-hover:gap-3 transition-all">
              Ir al panel <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 2: Soporte */}
          <button
            id="home-btn-soporte"
            onClick={() => router.push('/soporte')}
            className="group bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-7 text-left transition-all duration-300 hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)] shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">Solicitar Soporte</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Reporta incidencias, fallas técnicas o solicita asistencia del equipo TI.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-emerald-600 text-sm font-bold group-hover:gap-3 transition-all">
              Crear ticket <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 3: QR */}
          <button
            id="home-btn-qr"
            onClick={() => router.push('/activo')}
            className="group bg-white border border-slate-200 hover:border-violet-300 rounded-3xl p-7 text-left transition-all duration-300 hover:shadow-[0_20px_50px_rgba(139,92,246,0.12)] shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">Escanear Activo</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Consulta la información de un equipo escaneando su código QR.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-violet-600 text-sm font-bold group-hover:gap-3 transition-all">
              Ver activo <ArrowRight size={14} />
            </div>
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
