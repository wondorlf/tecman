'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  X,
  Ticket,
  Wrench,
  QrCode,
  Search,
  AlertTriangle,
  Loader2,
  ExternalLink,
  CheckCircle,
  Download,
  Printer,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE: {
    label: 'Activo',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  MAINTENANCE: {
    label: 'Mantenimiento',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
  },
  INACTIVE: { label: 'Inactivo', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
  DISPOSED: { label: 'Dado de baja', color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  RESERVED: { label: 'Reservado', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
};

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const { toast } = useToast();

  // ── Buscar activo por código QR ─────────────────────────────────────────────
  const lookupAsset = async (code: string) => {
    setLoading(true);
    setError(null);
    setAsset(null);
    try {
      const res = await axios.get(`/api/assets/qr/${encodeURIComponent(code)}`);
      setAsset(res.data);
      toast({
        title: '✅ QR detectado',
        description: `Activo encontrado: ${res.data.name}`,
      });
      // Generar QR image
      if (res.data.qrCode) {
        try {
          const url = await QRCode.toDataURL(res.data.qrCode, { width: 300, margin: 2 });
          setQrDataUrl(url);
        } catch {}
      }
    } catch {
      setError(`No se encontró ningún activo con el código "${code}".`);
    } finally {
      setLoading(false);
    }
  };

  // ── Escáner QR en vivo con html5-qrcode ─────────────────────────────────────
  const startLiveScan = async () => {
    setError(null);
    setScannerReady(false);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-live-scanner-region');
      scannerRef.current = scanner;
      setQrDataUrl(null);

      // Iniciar escáner ANTES de cambiar estado para evitar race condition
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          // QR detectado — detener escáner y buscar activo
          playBeep();
          scanner
            .stop()
            .then(() => {
              setScanning(false);
              setScannerReady(false);
              lookupAsset(decodedText);
            })
            .catch(() => {});
        },
        () => {
          // Ignorar frames sin QR
        },
      );

      // Actualizar estado DESPUÉS de que el escáner esté corriendo
      setScanning(true);
      setScannerReady(true);
    } catch (e: any) {
      setError('No se pudo acceder a la cámara. Usa la búsqueda manual.');
      setScanning(false);
    }
  };

  const stopLiveScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setScannerReady(false);
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ── Búsqueda manual ─────────────────────────────────────────────────────────
  const handleManualSearch = () => {
    const code = manualCode.trim();
    if (!code) return;
    setQrDataUrl(null);
    lookupAsset(code);
  };

  // ── Beep ────────────────────────────────────────────────────────────────────
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const status = asset ? STATUS_CONFIG[asset.status] || STATUS_CONFIG['ACTIVE'] : null;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 w-full max-w-full">
        {/* Header */}
        <div className="text-center space-y-1.5 sm:space-y-2 px-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Escáner de Activos</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Escanea un código QR o ingresa el código manualmente para consultar el activo
          </p>
        </div>

        {/* Scanner Card */}
        <Card className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border-slate-100 shadow-sm w-full max-w-full">
          {!scanning && !asset ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Vista previa cámara */}
              <div
                id="qr-live-scanner-region"
                ref={scannerContainerRef}
                className="aspect-video bg-slate-100 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-2 sm:gap-3 border-2 border-dashed border-slate-200 overflow-hidden"
              >
                <QrCode size={36} className="sm:size-12 text-slate-300" />
                <p className="text-xs sm:text-sm text-slate-400">Escáner listo</p>
              </div>

              <Button
                onClick={startLiveScan}
                className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm font-medium"
              >
                <Camera size={15} className="sm:size-4 mr-1.5 sm:mr-2" />
                Activar escáner
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">o ingresa manualmente</span>
                </div>
              </div>

              {/* Manual input */}
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search
                    size={15}
                    className="sm:size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    placeholder="Código (TECMAN-xxxx o TEC-001)"
                    className="w-full h-10 sm:h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <Button
                  onClick={handleManualSearch}
                  disabled={!manualCode.trim() || loading}
                  className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm hover:bg-slate-800 disabled:opacity-50 shrink-0"
                >
                  {loading ? <Loader2 className="animate-spin" size={15} /> : 'Buscar'}
                </Button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle size={14} className="sm:size-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-xs text-amber-700 break-words">{error}</p>
                </div>
              )}
            </div>
          ) : scanning ? (
            <div className="space-y-2.5 sm:space-y-3">
              <div
                id="qr-live-scanner-region"
                className="w-full aspect-square max-h-[260px] sm:max-h-[300px] mx-auto rounded-xl overflow-hidden bg-slate-900"
              />
              <p className="text-[11px] sm:text-xs text-center text-emerald-600 font-medium animate-pulse">
                {scannerReady ? 'Escaneando... apunta la cámara al código QR' : 'Iniciando cámara...'}
              </p>
              <Button
                onClick={stopLiveScan}
                variant="outline"
                className="w-full h-9 sm:h-10 rounded-xl text-xs sm:text-sm"
              >
                <X size={13} className="sm:size-[14px] mr-1 sm:mr-1.5" />
                Detener escáner
              </Button>
            </div>
          ) : null}
        </Card>

        {asset && !scanning && (
          <Card className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300 w-full max-w-full overflow-x-hidden">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="sm:size-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words">{asset.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${status?.bg} ${status?.color}`}
                  >
                    <span className={"w-1.5 h-1.5 rounded-full " + status?.dot} />
                    {status?.label}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 truncate">{asset.code}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {[
                ['Categoría', asset.category?.name],
                ['Ubicación', asset.location?.name],
                ['Marca', asset.brand],
                ['Modelo', asset.model],
                ['Serial', asset.serialNumber],
                ['Proveedor', asset.supplier?.name],
              ].map(
                ([label, value]) =>
                  value && (
                    <div key={label as string}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-slate-700 break-words">{value}</p>
                    </div>
                  ),
              )}
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 mb-3 sm:mb-4">
                <img
                  src={qrDataUrl}
                  alt="QR del activo"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <p className="text-xs font-semibold text-slate-700 mb-1 text-center sm:text-left">
                    Código QR del activo
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 truncate mb-2 text-center sm:text-left">
                    {asset.qrCode}
                  </p>
                  <div className="flex gap-1.5 justify-center sm:justify-start">
                    <a
                      href={qrDataUrl}
                      download={`${asset.code || 'activo'}-qr.png`}
                      className="inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Download size={11} />
                      Descargar
                    </a>
                    <button
                      onClick={() => {
                        const w = window.open('');
                        if (w) {
                          w.document.write(`
                            <html>
                              <head>
                                <title>Sticker QR - ${asset.name}</title>
                                <style>
                                  @page { margin: 0; }
                                  body { display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; background:white; }
                                </style>
                              </head>
                              <body>
                                <div style="text-align:center;">
                                  <img src="${qrDataUrl}" style="width:300px;height:300px;" />
                                  <p style="margin-top:12px;font-size:14px;color:#333;">${asset.name}</p>
                                  <p style="font-size:11px;color:#999;">${asset.code}</p>
                                </div>
                              </body>
                            </html>
                          `);
                          w.document.close();
                          w.print();
                        }
                      }}
                      className="inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-slate-700 text-white text-[10px] font-semibold hover:bg-slate-800 transition-colors"
                    >
                      <Printer size={11} />
                      Imprimir sticker
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-1.5 sm:gap-2">
              <Button
                onClick={() => router.push(`/dashboard/assets/${asset.id}`)}
                className="w-full sm:flex-1 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-blue-600 text-white text-[10px] sm:text-sm font-semibold hover:bg-blue-700"
              >
                <ExternalLink size={12} className="sm:size-[14px] mr-1 sm:mr-1.5" />
                <span className="truncate">Ver detalle</span>
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/tickets?assetCode=${encodeURIComponent(asset.code)}`)}
                className="w-full sm:flex-1 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-600 text-white text-[10px] sm:text-sm font-semibold hover:bg-emerald-700"
              >
                <Ticket size={12} className="sm:size-[14px] mr-1 sm:mr-1.5" />
                <span className="truncate">Reportar</span>
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/maintenance?assetCode=${encodeURIComponent(asset.code)}`)}
                className="w-full sm:flex-1 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-amber-600 text-white text-[10px] sm:text-sm font-semibold hover:bg-amber-700"
              >
                <Wrench size={12} className="sm:size-[14px] mr-1 sm:mr-1.5" />
                <span className="truncate">Mantenimiento</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAsset(null);
                  setQrDataUrl(null);
                  setManualCode('');
                  setError(null);
                }}
                className="w-full sm:flex-1 h-8 sm:h-9 rounded-lg sm:rounded-xl text-[10px] sm:text-sm"
              >
                <span className="truncate">Nueva búsqueda</span>
              </Button>
            </div>
          </Card>
        )}

        {!asset && (
          <>
          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/dashboard/tickets')}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Ticket size={16} className="sm:size-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Reportar problema</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Crear ticket de soporte</p>
                </div>
              </div>
            </Card>
            <Card
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/dashboard/discovery')}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <QrCode size={16} className="sm:size-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Ver Discovery</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Dispositivos detectados</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Guía rápida */}
          <Card className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border-slate-100 bg-blue-50/50">
            <h3 className="text-[11px] sm:text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">¿Cómo funciona?</h3>
            <ol className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-slate-600">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] sm:text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                Escanea el código QR del equipo o ingresa su código
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] sm:text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                Revisa la ficha técnica del activo
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] sm:text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                Crea un ticket de soporte o solicita mantenimiento directamente
              </li>
            </ol>
          </Card>
          </>
        )}
      </div>
    </div>
  );
}
