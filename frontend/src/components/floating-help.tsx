'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Ticket,
  ScanBarcode,
  Network,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Package,
  Wrench,
  Download,
  UserCheck,
  Monitor,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { knowledgeApi, discoveryApi, assetsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type Message = { id: string; role: 'user' | 'bot'; content: ReactNode; time: string };

export default function FloatingHelp() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      content: (
        <div className="space-y-2">
          <p className="text-sm text-slate-700">
            ¡Hola! Soy <strong>EganBot</strong>, tu asistente ITIL. Puedo ayudarte con soluciones de soporte, consultar activos o gestionar tickets.
          </p>
          <div className="flex flex-wrap gap-2">
            <QuickChip
              icon={<Ticket size={12} />}
              label="Nuevo ticket"
              onClick={() => handleQuick('/dashboard/tickets')}
            />
            <QuickChip
              icon={<HelpCircle size={12} />}
              label="Soluciones comunes"
              onClick={() => handleQuick('/dashboard/knowledge')}
            />
            <QuickChip
              icon={<ScanBarcode size={12} />}
              label="Escanear QR"
              onClick={() => handleQuick('/activo')}
            />
            <QuickChip
              icon={<Package size={12} />}
              label="Inventario"
              onClick={() => handleQuick('/dashboard/assets')}
            />
            <QuickChip
              icon={<Wrench size={12} />}
              label="Mis Órdenes"
              onClick={() => handleQuick('/dashboard/mis-ordenes')}
            />
            <QuickChip
              icon={<Monitor size={12} />}
              label="Discovery"
              onClick={() => handleQuick('/dashboard/discovery')}
            />
          </div>
        </div>
      ),
    },
  ]);
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleQuick = (href: string) => {
    setOpen(false);
    setTimeout(() => router.push(href), 200);
  };

  const handleSend = async (text?: string) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      content: <p className="text-sm text-slate-800">{q}</p>,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const lower = q.toLowerCase();
      let botContent: ReactNode = null;

      // ── Detectar consulta de código de ticket (TKT-XXXX) ──
      const ticketCodeMatch = q.match(/\b(TKT[-\s]?\d{3,})\b/i);
      if (ticketCodeMatch) {
        const code = ticketCodeMatch[1].replace(/[\s-]/g, '-').toUpperCase();
        try {
          const res = await axios.get(`/api/tickets/public/track/${code}`);
          const t = res.data;
          botContent = (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Ticket {t.code}: {t.title}
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
              </div>
              <p className="text-xs text-slate-500">
                Creado: {new Date(t.createdAt).toLocaleDateString('es-CO')}
                {t.assignee?.name ? ` · Asignado: ${t.assignee.name}` : ''}
              </p>
              <Button
                size="sm"
                className="h-7 rounded-lg bg-blue-600 text-white text-xs"
                onClick={() => handleQuick('/dashboard/tickets')}
              >
                Ver detalles
              </Button>
            </div>
          );
        } catch {
          botContent = (
            <p className="text-sm text-slate-600">
              No encontré el ticket <strong>{code}</strong>. ¿Quizás el código es diferente?
            </p>
          );
        }
      }
      // ── Consulta de activo por código ──
      else if (lower.includes('activo') && (lower.includes('tecman') || lower.includes('tec-') || lower.includes('disc-'))) {
        const assetCode = q.match(/\b(TECMAN[-\s]?[a-f0-9-]+|TEC-\d+|DISC-\w+)\b/i)?.[1];
        if (assetCode) {
          try {
            const res = await axios.get(`/api/assets/qr/${encodeURIComponent(assetCode)}`);
            const a = res.data;
            botContent = (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">{a.name}</p>
                <p className="text-xs text-slate-500">Código: {a.code} · {a.category?.name}</p>
                <Button
                  size="sm"
                  className="h-7 rounded-lg bg-blue-600 text-white text-xs"
                  onClick={() => handleQuick(`/activo?code=${encodeURIComponent(a.code)}`)}
                >
                  Ver ficha
                </Button>
              </div>
            );
          } catch {
            botContent = (
              <p className="text-sm text-slate-600">No encontré un activo con ese código.</p>
            );
          }
        } else {
          botContent = (
            <div className="space-y-2">
              <p className="text-sm text-slate-700">
                Puedes consultar activos por código QR o manualmente:
              </p>
              <Button
                size="sm"
                className="h-8 rounded-lg bg-blue-600 text-white"
                onClick={() => handleQuick('/activo')}
              >
                <ScanBarcode size={13} className="mr-1.5" /> Consultar activo
              </Button>
            </div>
          );
        }
      }
      // ── ITIL Nivel 1: Soluciones rápidas comunes ──
      else if (
        lower.includes('internet') || lower.includes('red') || lower.includes('wifi') ||
        lower.includes('conexion') || lower.includes('conexión') || lower.includes('网络')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Nivel 1 — Soluciones de Red</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prueba estas soluciones antes de crear un ticket:
            </p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Reinicia tu adaptador de red: Panel de control → Red → clic derecho → Desactivar/Activar</li>
              <li>Reinicia el equipo y el router/módem</li>
              <li>Libera la IP: <code className="bg-slate-100 px-1 rounded">ipconfig /release</code> y luego <code className="bg-slate-100 px-1 rounded">ipconfig /renew</code></li>
              <li>Limpia caché DNS: <code className="bg-slate-100 px-1 rounded">ipconfig /flushdns</code></li>
            </ol>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleQuick('/dashboard/tickets')}>
              <Ticket size={13} className="mr-1.5" /> Crear ticket de soporte
            </Button>
          </div>
        );
      } else if (
        lower.includes('impresora') || lower.includes('imprimir') || lower.includes('print')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Nivel 1 — Soluciones de Impresión</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Verifica que la impresora esté encendida y con papel</li>
              <li>Reinicia el spooler: <code className="bg-slate-100 px-1 rounded">net stop spooler &amp;&amp; net start spooler</code></li>
              <li>Verifica que esté seleccionada como impresora predeterminada</li>
              <li>Reinicia el equipo</li>
            </ol>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleQuick('/dashboard/tickets')}>
              <Ticket size={13} className="mr-1.5" /> Crear ticket
            </Button>
          </div>
        );
      } else if (
        lower.includes('lento') || lower.includes('lentitud') || lower.includes('rendimiento') ||
        lower.includes('traba') || lower.includes('freeze') || lower.includes('congel')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Nivel 1 — Rendimiento del Equipo</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Cierra aplicaciones que no estés usando (verifica en el Administrador de Tareas)</li>
              <li>Libera espacio en disco: elimina archivos temporales (<code className="bg-slate-100 px-1 rounded">%temp%</code>)</li>
              <li>Reinicia el equipo si no lo has hecho hoy</li>
              <li>Verifica que no haya actualizaciones de Windows pendientes de reinicio</li>
            </ol>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleQuick('/dashboard/tickets')}>
              <Ticket size={13} className="mr-1.5" /> Crear ticket
            </Button>
          </div>
        );
      } else if (
        lower.includes('correo') || lower.includes('email') || lower.includes('outlook') ||
        lower.includes('mail')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Nivel 1 — Correo Electrónico</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Verifica tu conexión a internet primero</li>
              <li>Cierra y vuelve a abrir Outlook</li>
              <li>Si está en Outlook Web, prueba con otro navegador</li>
              <li>Libera espacio en la bandeja de entrada (archivos {'>'} 20MB)</li>
              <li>Verifica credenciales con Ctrl+Alt+Supr → Cerrar sesión → Reingresar</li>
            </ol>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleQuick('/dashboard/tickets')}>
              <Ticket size={13} className="mr-1.5" /> Crear ticket
            </Button>
          </div>
        );
      } else if (
        lower.includes('pantalla') || lower.includes('monitor') || lower.includes('video') ||
        lower.includes('no prende') || lower.includes('no enciende') || lower.includes('black') ||
        lower.includes('negro')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Nivel 1 — Pantalla / Encendido</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Verifica que el cable de alimentación esté conectado</li>
              <li>Revisa que el monitor esté encendido (LED de energía)</li>
              <li>Prueba otro cable o puerto de video si es posible</li>
              <li>Si es laptop: mantén presionado el botón de encendido 10 segundos, suelta y vuelve a encender</li>
            </ol>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleQuick('/dashboard/tickets')}>
              <Ticket size={13} className="mr-1.5" /> Crear ticket Nivel 2/3
            </Button>
          </div>
        );
      } else if (
        lower.includes('acceso') || lower.includes('contraseña') || lower.includes('password') ||
        lower.includes('bloqueado') || lower.includes('login') || lower.includes('sesion') ||
        lower.includes('sesión')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Nivel 1 — Accesos y Credenciales</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Verifica que el teclado esté en el idioma correcto (ES/EN)</li>
              <li>Escribe la contraseña en un bloc de notas para verificar caracteres especiales</li>
              <li>Si el dominio no carga, desconéctate de la red WiFi y reconéctate</li>
              <li>Si estás bloqueado, espera 15 minutos o contacta al administrador</li>
            </ol>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleQuick('/dashboard/tickets')}>
              <Ticket size={13} className="mr-1.5" /> Crear ticket
            </Button>
          </div>
        );
      } else if (
        lower.includes('software') || lower.includes('programa') || lower.includes('aplicacion') ||
        lower.includes('aplicación') || lower.includes('instalar')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Nivel 1/2 — Instalación de Software</p>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
              <li>Verifica si el software está en el catálogo aprobado de la empresa</li>
              <li>Reinicia el equipo antes de intentar reinstalar</li>
              <li>Ejecuta como Administrador si requiere permisos elevados</li>
              <li>Si falla, desinstala versiones previas antes de reinstalar</li>
            </ol>
            <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white text-xs" onClick={() => handleQuick('/dashboard/tickets')}>
              <Ticket size={13} className="mr-1.5" /> Solicitar instalación
            </Button>
          </div>
        );
      } else if (
        lower.includes('ticket') ||
        lower.includes('soporte') ||
        lower.includes('ayuda') ||
        lower.includes('incidencia')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">Te ayudo a gestionar tu solicitud de soporte:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-blue-600 text-white"
                onClick={() => handleQuick('/dashboard/tickets')}
              >
                <Ticket size={13} className="mr-1.5" /> Ir a Tickets
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg"
                onClick={() => handleQuick('/soporte')}
              >
                Mesa de ayuda <ExternalLink size={12} className="ml-1.5" />
              </Button>
            </div>
          </div>
        );
      } else if (lower.includes('qr') || lower.includes('escanear') || lower.includes('activo')) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Puedes escanear un código QR para consultar o gestionar un activo:
            </p>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-blue-600 text-white"
              onClick={() => handleQuick('/activo')}
            >
              <ScanBarcode size={13} className="mr-1.5" /> Escanear QR
            </Button>
          </div>
        );
      } else if (
        lower.includes('discovery') ||
        lower.includes('descubrimiento') ||
        lower.includes('hardware') ||
        lower.includes('equipo')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              En Discovery puedes ver los equipos detectados en la red:
            </p>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-blue-600 text-white"
              onClick={() => handleQuick('/dashboard/discovery')}
            >
              <Network size={13} className="mr-1.5" /> Ver Discovery
            </Button>
          </div>
        );
      } else if (
        lower.includes('agente') ||
        lower.includes('descargar') ||
        (lower.includes('agente') && lower.includes('discovery'))
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Descarga el agente de discovery para inventariar equipos automáticamente:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-blue-600 text-white"
                onClick={() => handleQuick('/dashboard/agents')}
              >
                <Download size={13} className="mr-1.5" /> Ver opciones de descarga
              </Button>
            </div>
          </div>
        );
      } else if (
        lower.includes('inventario') ||
        lower.includes('activo') ||
        lower.includes('activos')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Puedes gestionar todos los activos del inventario:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-blue-600 text-white"
                onClick={() => handleQuick('/dashboard/assets')}
              >
                <Package size={13} className="mr-1.5" /> Ir a Inventario
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg"
                onClick={() => handleQuick('/activo')}
              >
                <ScanBarcode size={13} className="mr-1.5" /> Escanear QR
              </Button>
            </div>
          </div>
        );
      } else if (
        lower.includes('órdenes') ||
        lower.includes('mis ordenes') ||
        lower.includes('mis orden') ||
        lower.includes('técnico') ||
        lower.includes('asignado')
      ) {
        botContent = (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Revisa tus órdenes de mantenimiento y tickets asignados:
            </p>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-blue-600 text-white"
              onClick={() => handleQuick('/dashboard/mis-ordenes')}
            >
              <UserCheck size={13} className="mr-1.5" /> Mis Órdenes
            </Button>
          </div>
        );
      } else {
        // Knowledge base search
        try {
          const res = await knowledgeApi.listArticles({ search: q });
          const articles = (res.data as any[]) || [];
          if (articles.length > 0) {
            botContent = (
              <div className="space-y-2">
                <p className="text-sm text-slate-700">Encontré artículos que pueden ayudarte:</p>
                <div className="space-y-2">
                  {articles.slice(0, 3).map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => handleQuick(`/dashboard/knowledge/${a.id}`)}
                      className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                      {a.category && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.category.name}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          } else {
            botContent = (
              <div className="space-y-2">
                <p className="text-sm text-slate-700">
                  No encontré artículos exactos. ¿Quieres crear un ticket de soporte?
                </p>
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-blue-600 text-white"
                  onClick={() => handleQuick('/dashboard/tickets')}
                >
                  <Ticket size={13} className="mr-1.5" /> Crear ticket
                </Button>
              </div>
            );
          }
        } catch {
          // fallback
        }
      }

      if (!botContent) {
        botContent = (
          <p className="text-sm text-slate-700">
            No encontré información específica. Revisa la base de conocimiento o crea un ticket.
          </p>
        );
      }

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: 'bot',
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        content: botContent,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: 'bot',
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        content: (
          <p className="text-sm text-red-600">
            Hubo un problema al procesar tu consulta. Intenta nuevamente.
          </p>
        ),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="mb-3 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">EganBot</p>
                <p className="text-[10px] text-slate-500">Asistente ITIL · Soporte y Knowledge Base</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setOpen(false)}
            >
              <X size={14} />
            </Button>
          </div>

          <div className="flex-1 max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {msg.role === 'user' ? (
                      <User size={11} className="opacity-80" />
                    ) : (
                      <Bot size={11} className="text-blue-600" />
                    )}
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
                onClick={() => handleSend()}
                className="h-9 w-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}

function QuickChip({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
    >
      {icon}
      {label}
      <ChevronRight size={10} className="opacity-60" />
    </button>
  );
}
