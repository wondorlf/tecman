'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  ChevronRight,
  QrCode,
  Ticket,
  HelpCircle,
  Wifi,
  Printer,
  Monitor,
  KeyRound,
  BookOpen,
  ArrowRight,
  Phone,
  Download,
  HardDrive,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SolutionBlock } from '@/components/solution-block';
import axios from 'axios';

type Message = { id: string; role: 'user' | 'bot'; content: ReactNode; time: string };

type Article = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  difficulty: string;
  category: { name: string; icon: string };
};

type Props = {
  onNavigate?: (href: string) => void;
};

function ResponseMenu({ onAction }: { onAction: (text: string) => void }) {
  return (
    <div className="mt-2 pt-2 border-t border-slate-200/60">
      <p className="text-[10px] text-slate-400 mb-1.5 font-medium">¿Qué necesitas?</p>
      <div className="flex flex-wrap gap-1.5">
        <QuickAction icon={<Ticket size={11} />} label="Crear ticket" color="emerald" onClick={() => onAction('crear ticket')} />
        <QuickAction icon={<QrCode size={11} />} label="Escanear QR" color="violet" onClick={() => onAction('escanear qr')} />
        <QuickAction icon={<HelpCircle size={11} />} label="Ver artículos" color="blue" onClick={() => onAction('ver artículos')} />
        <QuickAction icon={<Wifi size={11} />} label="Internet" color="blue" onClick={() => onAction('no tengo internet')} />
        <QuickAction icon={<Printer size={11} />} label="Impresora" color="amber" onClick={() => onAction('impresora')} />
        <QuickAction icon={<Monitor size={11} />} label="Equipo lento" color="red" onClick={() => onAction('equipo lento')} />
      </div>
    </div>
  );
}

export default function PublicChatbot({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<Article | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const buildWelcome = (): Message => ({
    id: 'welcome',
    role: 'bot',
    time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          ¡Hola! Soy <strong>EganBot</strong>, tu asistente de soporte. Puedo ayudarte con:
        </p>
        <div className="space-y-1.5">
          <QuickAction
            icon={<Ticket size={13} />}
            label="Crear un ticket de soporte"
            color="emerald"
            onClick={() => handleBotQuery('como crear ticket')}
          />
          <QuickAction
            icon={<QrCode size={13} />}
            label="Escanear código QR de un activo"
            color="violet"
            onClick={() => handleBotQuery('como escanear qr')}
          />
          <QuickAction
            icon={<Wifi size={13} />}
            label="No tengo internet"
            color="blue"
            onClick={() => handleBotQuery('no tengo internet')}
          />
          <QuickAction
            icon={<Printer size={13} />}
            label="La impresora no imprime"
            color="amber"
            onClick={() => handleBotQuery('impresora no imprime')}
          />
          <QuickAction
            icon={<HardDrive size={13} />}
            label="Equipo lento"
            color="red"
            onClick={() => handleBotQuery('equipo lento')}
          />
          <QuickAction
            icon={<Monitor size={13} />}
            label="Soporte remoto"
            color="indigo"
            onClick={() => handleBotQuery('soporte remoto')}
          />
          <QuickAction
            icon={<Globe size={13} />}
            label="Outlook no funciona"
            color="cyan"
            onClick={() => handleBotQuery('outlook no funciona')}
          />
          <QuickAction
            icon={<Monitor size={13} />}
            label="Mi equipo está lento"
            color="red"
            onClick={() => handleBotQuery('equipo lento')}
          />
          <QuickAction
            icon={<KeyRound size={13} />}
            label="Olvidé mi contraseña"
            color="slate"
            onClick={() => handleBotQuery('olvide mi contraseña')}
          />
          <QuickAction
            icon={<BookOpen size={13} />}
            label="Ver artículos de ayuda"
            color="indigo"
            onClick={() => handleBotQuery('ver artículos de ayuda')}
          />
          <QuickAction
            icon={<HelpCircle size={13} />}
            label="Seguimiento de ticket"
            color="cyan"
            onClick={() => handleBotQuery('seguimiento de ticket')}
          />
        </div>
      </div>
    ),
  });

  const [messages, setMessages] = useState<Message[]>([buildWelcome()]);
  const router = typeof window !== 'undefined' ? window.location : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, expandedArticle]);

  const now = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const addBotMessage = (content: ReactNode, includeMenu = true) => {
    const wrapped = includeMenu ? (
      <div>
        {content}
        <ResponseMenu onAction={handleQuickAction} />
      </div>
    ) : content;
    setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: 'bot', time: now(), content: wrapped }]);
  };

  const handleQuickAction = (text: string) => {
    if (text === 'menu') {
      setMessages([buildWelcome()]);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', time: now(), content: <p className="text-sm">{text}</p> },
    ]);
    handleBotQuery(text);
  };

  const handleBotQuery = async (query?: string) => {
    const q = (query || input).trim();
    if (!q) return;
    if (!query) setInput('');

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', time: now(), content: <p className="text-sm">{q}</p> },
    ]);
    setLoading(true);

    try {
      const lower = q.toLowerCase();

      // ── Seguimiento de ticket ──
      const ticketMatch = q.match(/TKT[-\s]?\d{3,}/i);
      if (ticketMatch || lower.includes('seguimiento') || lower.includes('tracking')) {
        if (ticketMatch) {
          const code = ticketMatch[0].replace(/[\s-]/g, '-').toUpperCase();
          try {
            const res = await axios.get(`/api/tickets/public/track/${code}`);
            const t = res.data;
            addBotMessage(
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Ticket {t.code}</p>
                <p className="text-xs text-slate-600">{t.title}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                    t.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>{t.status}</span>
                  {t.assignee && <span className="text-xs text-slate-500">→ {t.assignee.name}</span>}
                </div>
                <Button size="sm" className="h-7 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleNavigate('/soporte')}>
                  Ir a seguimiento
                </Button>
              </div>
            );
          } catch {
            addBotMessage(
              <p className="text-sm text-slate-600">No encontré el ticket <strong>{code}</strong>. Verifica el código e intenta de nuevo.</p>
            );
          }
        } else {
          addBotMessage(
            <div className="space-y-2">
              <p className="text-sm text-slate-700">Para dar seguimiento a tu ticket necesitas el código que recibiste (formato <code className="bg-slate-100 px-1 rounded">TKT-XXXX</code>).</p>
              <p className="text-xs text-slate-500">Escribe el código o haz clic en "Seguimiento" en la pestaña superior.</p>
            </div>
          );
        }
        setLoading(false);
        return;
      }

      // ── Crear ticket ──
      if (lower.includes('crear ticket') || lower.includes('nuevo ticket') || lower.includes('reportar') || lower.includes('solicitar soporte') || lower.includes('generar ticket')) {
        addBotMessage(
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-700">Crear ticket de soporte</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Completa tus datos (nombre, celular, cargo)</li>
              <li>Selecciona la categoría del problema</li>
              <li>Describe la falla con el mayor detalle posible</li>
              <li>Opcionalmente adjunta una foto del problema</li>
            </ol>
            <p className="text-xs text-slate-500">Recibirás un código <code className="bg-slate-100 px-1 rounded">TKT-XXXX</code> para dar seguimiento.</p>
            <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-white text-xs" onClick={() => {
              document.getElementById('support-name')?.scrollIntoView({ behavior: 'smooth' });
              setOpen(false);
            }}>
              <ArrowRight size={12} className="mr-1" /> Ir al formulario
            </Button>
          </div>
        );
        setLoading(false);
        return;
      }

      // ── Escanear QR ──
      if (lower.includes('escanear') || lower.includes('qr') || lower.includes('código qr')) {
        addBotMessage(
          <div className="space-y-2">
            <p className="text-sm font-semibold text-violet-700">Cómo escanear un activo</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Busca la etiqueta QR en el equipo (generalmente en la parte posterior o lateral)</li>
              <li>Abre la cámara de tu celular</li>
              <li>Apunta al código QR — se abrirá automáticamente la información del activo</li>
              <li>También puedes ir a <strong>/activo</strong> y digitar el código manualmente</li>
            </ol>
            <p className="text-xs text-slate-500">El código empieza con <code className="bg-slate-100 px-1 rounded">TEC-</code> o <code className="bg-slate-100 px-1 rounded">TECMAN</code></p>
            <Button size="sm" className="h-8 rounded-lg bg-violet-600 text-white text-xs" onClick={() => handleNavigate('/activo')}>
              <QrCode size={12} className="mr-1" /> Ir a /activo
            </Button>
          </div>
        );
        setLoading(false);
        return;
      }

      // ── Soluciones comunes de Nivel 1 ──
      if (lower.includes('internet') || lower.includes('red') || lower.includes('wifi') || lower.includes('conexion') || lower.includes('conexión')) {
        addBotMessage(
          <SolutionBlock
            title="Nivel 1 — Soluciones de Red"
            color="blue"
            solutionId="network-dns"
            steps={[
              'Reinicia tu adaptador de red (Panel de control → Red → clic derecho → Desactivar/Activar)',
              'Reinicia el equipo y el router/módem',
              'Libia la IP: ejecuta <code className="bg-slate-100 px-1 rounded">ipconfig /release</code> y luego <code className="bg-slate-100 px-1 rounded">ipconfig /renew</code>',
              'Limpia DNS: ejecuta <code className="bg-slate-100 px-1 rounded">ipconfig /flushdns</code>',
            ]}
            downloadUrl="/api/fix-scripts/fix-network-dns.bat"
            downloadLabel="Descargar solución de red (.bat)"
            onTicket={() => handleQuickAction('crear ticket')}
            onMenu={() => handleQuickAction('menu')}
          />
        );
        setLoading(false);
        return;
      }

      if (lower.includes('impresora') || lower.includes('imprimir') || lower.includes('print')) {
        addBotMessage(
          <SolutionBlock
            title="Nivel 1 — Soluciones de Impresión"
            color="amber"
            solutionId="printer-spooler"
            steps={[
              'Verifica que la impresora esté encendida y con papel',
              'Reinicia el spooler de impresión',
              'Verifica que sea impresora predeterminada',
              'Reinicia el equipo si persiste',
            ]}
            downloadUrl="/api/fix-scripts/fix-printer.bat"
            downloadLabel="Descargar solución de impresora (.bat)"
            onTicket={() => handleQuickAction('crear ticket')}
            onMenu={() => handleQuickAction('menu')}
          />
        );
        setLoading(false);
        return;
      }

      if (lower.includes('lento') || lower.includes('lentitud') || lower.includes('traba') || lower.includes('rendimiento')) {
        addBotMessage(
          <SolutionBlock
            title="Nivel 1 — Rendimiento del Equipo"
            color="red"
            solutionId="slow-pc"
            steps={[
              'Cierra aplicaciones que no estés usando (Administrador de Tareas: Ctrl+Shift+Esc)',
              'Libera espacio: elimina archivos temporales',
              'Reinicia el equipo si no lo has hecho hoy',
              'Verifica actualizaciones de Windows pendientes',
            ]}
            downloadUrl="/api/fix-scripts/fix-slow-pc.bat"
            downloadLabel="Descargar solución de rendimiento (.bat)"
            onTicket={() => handleQuickAction('crear ticket')}
            onMenu={() => handleQuickAction('menu')}
          />
        );
        setLoading(false);
        return;
      }

      if (lower.includes('contraseña') || lower.includes('password') || lower.includes('bloqueado') || lower.includes('olvide') || lower.includes('acceso') || lower.includes('login')) {
        addBotMessage(
          <SolutionBlock
            title="Nivel 1 — Accesos y Credenciales"
            color="slate"
            solutionId="access-password"
            steps={[
              'Verifica que el teclado esté en el idioma correcto (ES/EN)',
              'Escribe la contraseña en un bloc de notas para verificar caracteres especiales',
              'Si estás bloqueado, espera 15 minutos e intenta de nuevo',
              'Si el dominio no carga, reconéctate a la red WiFi',
            ]}
            onTicket={() => handleQuickAction('crear ticket')}
            onMenu={() => handleQuickAction('menu')}
          />
        );
        setLoading(false);
        return;
      }

      if (lower.includes('correo') || lower.includes('email') || lower.includes('outlook') || lower.includes('mail')) {
        addBotMessage(
          <SolutionBlock
            title="Nivel 1 — Correo Electrónico"
            color="indigo"
            solutionId="outlook-email"
            steps={[
              'Verifica tu conexión a internet',
              'Cierra y vuelve a abrir Outlook',
              'Si está en Web, prueba con otro navegador',
              'Verifica credenciales: Ctrl+Alt+Supr → Cerrar sesión → Reingresar',
            ]}
            downloadUrl="/api/fix-scripts/fix-outlook.bat"
            downloadLabel="Descargar solución de Outlook (.bat)"
            onTicket={() => handleQuickAction('crear ticket')}
            onMenu={() => handleQuickAction('menu')}
          />
        );
        setLoading(false);
        return;
      }

      // ── Soporte remoto ──
      if (lower.includes('soporte remoto') || lower.includes('anydesk') || lower.includes('rustdesk') || lower.includes('acceso remoto') || lower.includes('ayuda remota')) {
        addBotMessage(
          <div className="space-y-2">
            <p className="text-sm font-semibold text-indigo-700">Soporte Remoto</p>
            <p className="text-xs text-slate-600">Descarga e instala un programa de acceso remoto para recibir asistencia:</p>
            <div className="flex flex-wrap gap-2">
              <a href="/api/fix-scripts/install-anydesk.bat" download className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                <Download size={11} /> Instalar AnyDesk (.bat)
              </a>
              <a href="/api/fix-scripts/install-rustdesk.bat" download className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-medium text-violet-700 hover:bg-violet-100 transition-colors">
                <Download size={11} /> Instalar RustDesk (.bat)
              </a>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Descarga el .bat, haz clic derecho → Ejecutar como Administrador. Comparte el código de acceso con soporte.</p>
          </div>
        );
        setLoading(false);
        return;
      }

      // ── Ver artículos de ayuda ──
      if (lower.includes('artículo') || lower.includes('articulo') || lower.includes('ayuda') || lower.includes('guía') || lower.includes('guia') || lower.includes('solución') || lower.includes('solucion') || lower.includes('conocimiento')) {
        try {
          const res = await axios.get('/api/knowledge/articles');
          const articles: Article[] = (res.data as any).data || res.data || [];
          if (articles.length > 0) {
            addBotMessage(
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Artículos de ayuda disponibles:</p>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {articles.slice(0, 8).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setExpandedArticle(a)}
                      className="w-full text-left rounded-xl border border-slate-200 bg-white p-2.5 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{a.category?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{a.title}</p>
                          <p className="text-[10px] text-slate-400">{a.category?.name} · {a.difficulty === 'BASICO' ? '🟢 Básico' : a.difficulty === 'INTERMEDIO' ? '🟡 Intermedio' : '🔴 Avanzado'}</p>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          } else {
            addBotMessage(
              <p className="text-sm text-slate-600">No hay artículos disponibles en este momento. Puedes crear un ticket de soporte.</p>
            );
          }
        } catch {
          addBotMessage(
            <p className="text-sm text-slate-600">No pude cargar la base de conocimiento. Intenta de nuevo o crea un ticket.</p>
          );
        }
        setLoading(false);
        return;
      }

      // ── Fallback: buscar en knowledge base ──
      try {
        const res = await axios.get(`/api/knowledge/articles?search=${encodeURIComponent(q)}`);
        const articles: Article[] = (res.data as any).data || res.data || [];
        if (articles.length > 0) {
          addBotMessage(
            <div className="space-y-2">
              <p className="text-sm text-slate-700">Encontré artículos que pueden ayudarte:</p>
              <div className="space-y-1.5">
                {articles.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setExpandedArticle(a)}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white p-2.5 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-xs font-semibold text-slate-800">{a.category?.icon} {a.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.excerpt?.slice(0, 80)}...</p>
                  </button>
                ))}
              </div>
            </div>
          );
        } else {
          addBotMessage(
            <div className="space-y-2">
              <p className="text-sm text-slate-600">No encontré un artículo exacto para "<strong>{q}</strong>".</p>
              <p className="text-xs text-slate-500">¿Qué opción se parece más a tu problema?</p>
              <div className="flex flex-wrap gap-1.5">
                <QuickAction icon={<Wifi size={11} />} label="Internet/Red" color="blue" onClick={() => handleQuickAction('no tengo internet')} />
                <QuickAction icon={<Printer size={11} />} label="Impresora" color="amber" onClick={() => handleQuickAction('impresora no imprime')} />
                <QuickAction icon={<Monitor size={11} />} label="Equipo lento" color="red" onClick={() => handleQuickAction('equipo lento')} />
                <QuickAction icon={<KeyRound size={11} />} label="Contraseña" color="slate" onClick={() => handleQuickAction('contraseña')} />
              </div>
              <Button size="sm" className="h-7 rounded-lg bg-emerald-600 text-white text-[11px]" onClick={() => handleQuickAction('crear ticket')}>
                <Ticket size={11} className="mr-1" /> Crear ticket directamente
              </Button>
            </div>
          );
        }
      } catch {
        addBotMessage(
          <div className="space-y-2">
            <p className="text-sm text-slate-600">No pude procesar tu consulta. Elige una opción:</p>
            <div className="flex flex-wrap gap-1.5">
              <QuickAction icon={<Ticket size={11} />} label="Crear ticket" color="emerald" onClick={() => handleQuickAction('crear ticket')} />
              <QuickAction icon={<QrCode size={11} />} label="Escanear QR" color="violet" onClick={() => handleQuickAction('escanear qr')} />
              <QuickAction icon={<HelpCircle size={11} />} label="Ver ayuda" color="blue" onClick={() => handleQuickAction('ver artículos')} />
            </div>
          </div>
        );
      }
    } catch {
      addBotMessage(
        <p className="text-sm text-red-600">Hubo un problema. Intenta nuevamente.</p>
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBotQuery();
    }
  };

  return (
    <>
      {/* Article expanded overlay */}
      {expandedArticle && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={() => setExpandedArticle(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{expandedArticle.category?.icon}</span>
                <h3 className="text-sm font-bold text-slate-900">{expandedArticle.title}</h3>
              </div>
              <button onClick={() => setExpandedArticle(null)} className="p-1 rounded-lg hover:bg-slate-100"><X size={14} /></button>
            </div>
            <div className="text-xs text-slate-500 flex gap-2">
              <span className="px-2 py-0.5 bg-slate-100 rounded-full">{expandedArticle.category?.name}</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded-full">{expandedArticle.difficulty === 'BASICO' ? '🟢 Básico' : expandedArticle.difficulty === 'INTERMEDIO' ? '🟡 Intermedio' : '🔴 Avanzado'}</span>
            </div>
            <div className="prose prose-xs max-w-none text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {expandedArticle.content}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setExpandedArticle(null)}>Cerrar</Button>
              <Button size="sm" className="h-8 rounded-lg bg-emerald-600 text-white text-xs" onClick={() => {
                setExpandedArticle(null);
                handleQuickAction('crear ticket');
              }}>
                <Ticket size={11} className="mr-1" /> ¿No fue útil? Crear ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot FAB + Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        {open ? (
          <div className="mb-3 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">EganBot</p>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En línea
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setOpen(false)}>
                <X size={14} />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 max-h-[380px] overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-3 py-2 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {msg.role === 'user' ? <User size={11} className="opacity-80" /> : <Bot size={11} className="text-emerald-600" />}
                      <span className="text-[10px] opacity-70">{msg.time}</span>
                    </div>
                    <div className="text-[13px] leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 bg-white px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Escribe tu consulta..."
                  className="h-9 rounded-xl border-slate-200 text-sm"
                />
                <Button
                  size="icon"
                  disabled={!input.trim() || loading}
                  onClick={() => handleBotQuery()}
                  className="h-9 w-9 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                >
                  <Send size={14} />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Phone size={9} className="text-slate-400" />
                <span className="text-[9px] text-slate-400">Soporte TI · E-GAN</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setMessages([buildWelcome()]);
              setExpandedArticle(null);
              setOpen(true);
            }}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <MessageSquare size={24} />
          </button>
        )}
      </div>
    </>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const colors: Record<string, string> = {
    blue: 'hover:border-blue-300 hover:text-blue-700',
    emerald: 'hover:border-emerald-300 hover:text-emerald-700',
    violet: 'hover:border-violet-300 hover:text-violet-700',
    amber: 'hover:border-amber-300 hover:text-amber-700',
    red: 'hover:border-red-300 hover:text-red-700',
    slate: 'hover:border-slate-400 hover:text-slate-700',
    indigo: 'hover:border-indigo-300 hover:text-indigo-700',
    cyan: 'hover:border-cyan-300 hover:text-cyan-700',
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition-colors ${colors[color] || colors.blue}`}
    >
      {icon}
      {label}
      <ChevronRight size={10} className="opacity-60" />
    </button>
  );
}
