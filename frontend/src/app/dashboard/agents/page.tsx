'use client';

import { useState, useEffect } from 'react';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Copy,
  Check,
  Monitor,
  FileCode,
  Terminal,
  ChevronDown,
  Loader2,
  Key,
  Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/lib/api';

type AgentInfo = {
  hasApiKeyConfigured: boolean;
  serverUrl: string;
  go: {
    name: string;
    description: string;
    os: string[];
    install: string;
    usage: string;
    features?: string[];
  };
  powershell: {
    name: string;
    description: string;
    os: string[];
    install: string;
    usage: string;
    features: string[];
  };
};

export default function DownloadAgentsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [showPSCode, setShowPSCode] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Construir la URL base desde la ubicacion actual del navegador
  // El fallback solo aplica en SSR (cliente no disponible)
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Cargar API Key desde la configuración del servidor
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const r = await fetch('/api/tenants/discovery-key', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          if (data.discoveryApiKey) {
            setApiKey(data.discoveryApiKey);
          }
        }
      } catch {}
    };
    fetchApiKey();
  }, []);

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents-info'],
    queryFn: async () => {
      const r = await fetch('/api/agents/info');
      if (!r.ok) throw new Error('Failed to load agents info');
      return r.json() as Promise<AgentInfo>;
    },
  });

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const {
    data: goSource,
    isLoading: sourceLoading,
    refetch: fetchSource,
  } = useQuery({
    queryKey: ['go-source'],
    queryFn: async () => {
      const r = await fetch('/api/agents/go/source');
      if (!r.ok) throw new Error('No se pudo cargar el código fuente');
      return r.text();
    },
    enabled: false, // only fetch on demand
  });

  const {
    data: psSource,
    isLoading: psSourceLoading,
    refetch: fetchPSSource,
  } = useQuery({
    queryKey: ['ps-source', apiKey],
    queryFn: async () => {
      const url = apiKey ? `/api/agents/powershell/run?apiKey=${encodeURIComponent(apiKey)}` : '/api/agents/powershell/run';
      const r = await fetch(url);
      if (!r.ok) throw new Error('No se pudo cargar el código fuente');
      return r.text();
    },
    enabled: false,
  });

  const handleToggleCode = () => {
    if (!showCode && !goSource) {
      fetchSource();
    }
    setShowCode(!showCode);
  };

  const handleTogglePSCode = () => {
    if (!showPSCode && !psSource) {
      fetchPSSource();
    }
    setShowPSCode(!showPSCode);
  };

  if (isLoading) return <LoadingSpinner label="Cargando información de agentes..." />;
  if (!agents)
    return (
      <EmptyState
        icon={Monitor}
        title="No disponible"
        subtitle="No se pudo cargar la información"
      />
    );

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Descargar Agente de Discovery"
        subtitle="Instala el agente en los equipos para inventario automático de hardware"
      />

      {/* ── API Key Configuration ── */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            <h3 className="font-semibold text-sm text-blue-900">
              Configuración de autenticación
            </h3>
            {agents.hasApiKeyConfigured ? (
              <Badge variant="secondary" className="text-[10px] bg-emerald-200 text-emerald-800 ml-1">
                Configurada
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] bg-amber-200 text-amber-800 ml-1">
                Sin configurar
              </Badge>
            )}
          </div>
          <p className="text-xs text-blue-700">
            La <strong>API Key</strong> se inyecta automáticamente en los scripts descargados.
            Los agentes la usarán para autenticarse con el servidor.
            {!agents.hasApiKeyConfigured && (
              <span className="block mt-1 text-amber-700">
                ⚠️ No hay API Key configurada. Los agentes no podrán autenticarse.
                Configúrala en{' '}
                <a href="/dashboard/settings" className="underline font-semibold">
                  Configuración del Sistema
                </a>{' '}
                o en el{' '}
                <a href="/admin" className="underline font-semibold">
                  panel /admin
                </a>.
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key de discovery..."
                className="h-9 rounded-xl text-sm font-mono bg-white"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs shrink-0"
              onClick={() => copyToClipboard(apiKey, 'api-key')}
              disabled={!apiKey}
            >
              {copied === 'api-key' ? (
                <><Check size={13} className="mr-1 text-green-600" /> Copiado</>
              ) : (
                <><Copy size={13} className="mr-1" /> Copiar</>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-blue-500">
            💡 Esta API Key se inyectará en todos los scripts que descargues a continuación.
            Si cambias la API Key, los agentes existentes dejarán de funcionar.
          </p>
        </CardContent>
      </Card>

      {/* ── Remote Execution One-Liner ── */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-sm text-emerald-900">
              Ejecucion remota (recomendado)
            </h3>
            <Badge variant="secondary" className="text-[10px] bg-emerald-200 text-emerald-800 ml-1">
              Un solo comando
            </Badge>
          </div>
          <p className="text-xs text-emerald-700">
            Abre PowerShell <strong>como Administrador</strong>, copia y pega este comando. Descarga
            y ejecuta el agente automaticamente sin necesidad de archivos.
          </p>
          <div className="bg-slate-900 rounded-xl p-3 font-mono text-xs text-emerald-300 border border-emerald-600/30 relative group">
            <code className="break-all">
              powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object
              System.Net.WebClient).DownloadString('{agents?.serverUrl || baseUrl}/api/agents/powershell/run{apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : ''}'))"
            </code>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() =>
                  copyToClipboard(
                    `powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('${agents?.serverUrl || baseUrl}/api/agents/powershell/run${apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : ''}'))"`,
                    'run-ps',
                  )
                }
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                title="Copiar comando"
              >
                {copied === 'run-ps' ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-emerald-700">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-emerald-200 flex items-center justify-center text-[9px] font-bold">
                1
              </span>
              Abre PowerShell como Administrador
            </span>
            <span className="text-emerald-300">→</span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-emerald-200 flex items-center justify-center text-[9px] font-bold">
                2
              </span>
              Copia y pega el comando
            </span>
            <span className="text-emerald-300">→</span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-emerald-200 flex items-center justify-center text-[9px] font-bold">
                3
              </span>
              ¡Listo! El agente se ejecuta
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PowerShell Card */}
        <Card className="border-slate-100 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Monitor size={18} className="text-blue-600" />
              {agents.go.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{agents.go.description}</p>

            <div className="flex flex-wrap gap-2">
              {agents.go.os.map((os) => (
                <Badge key={os} variant="secondary" className="text-xs">
                  {os}
                </Badge>
              ))}
            </div>

            {agents.go.features && (
              <ul className="space-y-1.5">
                {agents.go.features.map((f) => (
                  <li key={f} className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Instalación</p>
              <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs text-slate-700 border border-slate-100">
                {agents.go.usage}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Opciones</p>
              <Button
                size="sm"
                className="h-9 rounded-xl bg-blue-600 text-white text-xs"
                onClick={() => window.open(`/api/agents/go${apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : ''}`, '_blank')}
              >
                <Download size={13} className="mr-1.5" />
                Descargar instalador (.bat + .exe)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs"
                onClick={handleToggleCode}
              >
                {showCode ? (
                  <ChevronDown size={13} className="mr-1.5" />
                ) : (
                  <FileCode size={13} className="mr-1.5" />
                )}
                {showCode ? 'Ocultar codigo' : 'Ver codigo fuente'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PowerShell Card */}
        <Card className="border-slate-100 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Terminal size={18} className="text-emerald-600" />
              {agents.powershell.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{agents.powershell.description}</p>

            <div className="flex flex-wrap gap-2">
              {agents.powershell.os.map((os) => (
                <Badge key={os} variant="secondary" className="text-xs">
                  {os}
                </Badge>
              ))}
            </div>

            <ul className="space-y-1.5">
              {agents.powershell.features.map((f) => (
                <li key={f} className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Instalacion tradicional
              </p>
              <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs text-slate-700 border border-slate-100">
                {agents.powershell.usage}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Opciones de instalacion</p>
              
              <Button
                size="sm"
                className="h-9 rounded-xl bg-emerald-600 text-white text-xs w-full"
                onClick={() => window.open(`/api/agents/powershell/unattended.bat?apiKey=${encodeURIComponent(apiKey)}`, '_blank')}
              >
                <Download size={13} className="mr-1.5" />
                Ejecucion automatica (sin preguntas)
              </Button>
              
              <Button
                size="sm"
                className="h-9 rounded-xl bg-blue-600 text-white text-xs w-full"
                onClick={() => window.open(`/api/agents/powershell/manual.bat?apiKey=${encodeURIComponent(apiKey)}`, '_blank')}
              >
                <Download size={13} className="mr-1.5" />
                Instalacion manual (con ubicacion)
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-xs flex-1"
                  onClick={() => window.open(`/api/agents/powershell?apiKey=${encodeURIComponent(apiKey)}`, '_blank')}
                >
                  <Download size={13} className="mr-1.5" />
                  Solo script .ps1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-xs"
                  onClick={handleTogglePSCode}
                >
                  <FileCode size={13} className="mr-1.5" />
                  {showPSCode ? 'Ocultar' : 'Codigo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PS Code Preview */}
      {showPSCode && (
        <Card className="border-emerald-200 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode size={16} className="text-emerald-600" />
                tecman-discovery.ps1 — Codigo fuente PowerShell
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg text-xs"
                  onClick={() => copyToClipboard(psSource || '', 'ps-source')}
                >
                  {copied === 'ps-source' ? (
                    <>
                      <Check size={12} className="mr-1 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg text-xs"
                  onClick={() => window.open('/api/agents/powershell', '_blank')}
                >
                  <Download size={12} className="mr-1" />
                  Descargar .ps1
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {psSourceLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-slate-400" />
                <span className="ml-2 text-sm text-slate-500">Cargando codigo fuente...</span>
              </div>
            ) : psSource ? (
              <pre className="text-xs leading-relaxed overflow-x-auto p-4 bg-[#0f172a] text-slate-200 max-h-[500px] overflow-y-auto">
                <code>{psSource}</code>
              </pre>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                No se pudo cargar el codigo fuente.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Go Code Preview Section */}
      {showCode && (
        <Card className="border-slate-200 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode size={16} className="text-blue-600" />
                main.go — Código fuente del agente Go
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg text-xs"
                  onClick={() => copyToClipboard(goSource || '', 'go-source')}
                >
                  {copied === 'go-source' ? (
                    <>
                      <Check size={12} className="mr-1 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg text-xs"
                  onClick={() => window.open('/api/agents/go', '_blank')}
                >
                  <Download size={12} className="mr-1" />
                  Descargar .go
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {sourceLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-slate-400" />
                <span className="ml-2 text-sm text-slate-500">Cargando código fuente...</span>
              </div>
            ) : goSource ? (
              <pre className="text-xs leading-relaxed overflow-x-auto p-4 bg-[#0f172a] text-slate-200 max-h-[600px] overflow-y-auto">
                <code>{goSource}</code>
              </pre>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                No se pudo cargar el código fuente.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-amber-100 bg-amber-50/50 rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> El agente PowerShell es recomendado para Windows porque captura
            el número de serie del BIOS. El agente Go es multiplataforma y funciona en Windows,
            Linux y macOS.
          </p>
          <div className="text-xs text-amber-700 space-y-1">
            <p><strong>Opciones de instalacion:</strong></p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Ejecucion automatica:</strong> Descarga y ejecuta sin interaccion del usuario</li>
              <li><strong>Instalacion manual:</strong> Pregunta por la ubicacion del equipo (etiqueta)</li>
              <li><strong>Solo script .ps1:</strong> Para instalacion personalizada con parametros</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
