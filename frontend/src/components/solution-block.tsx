'use client';

import { useState, type ReactNode } from 'react';
import { Download, CheckCircle2, XCircle, Ticket, ArrowRight, Phone, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

type SolutionBlockProps = {
  title: string;
  color: string;
  icon?: ReactNode;
  steps?: string[];
  codeSnippets?: { label: string; code: string }[];
  downloadUrl?: string;
  downloadLabel?: string;
  solutionId: string;
  onTicket?: () => void;
  onMenu?: () => void;
};

export function SolutionBlock({
  title,
  color,
  steps,
  codeSnippets,
  downloadUrl,
  downloadLabel,
  solutionId,
  onTicket,
  onMenu,
}: SolutionBlockProps) {
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const trackFeedback = async (resolved: boolean) => {
    try {
      await axios.post('/api/analytics/feedback', {
        solutionId,
        resolved,
        timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  const handleYes = () => {
    setFeedback('yes');
    trackFeedback(true);
  };

  const handleNo = () => {
    setFeedback('no');
    trackFeedback(false);
  };

  const colorMap: Record<string, { bg: string; border: string; text: string; btn: string; btnHover: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', btn: 'bg-blue-600', btnHover: 'hover:bg-blue-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', btn: 'bg-amber-600', btnHover: 'hover:bg-amber-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', btn: 'bg-red-600', btnHover: 'hover:bg-red-700' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', btn: 'bg-indigo-600', btnHover: 'hover:bg-indigo-700' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', btn: 'bg-violet-600', btnHover: 'hover:bg-violet-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', btn: 'bg-slate-600', btnHover: 'hover:bg-slate-700' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', btn: 'bg-emerald-600', btnHover: 'hover:bg-emerald-700' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', btn: 'bg-cyan-600', btnHover: 'hover:bg-cyan-700' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="space-y-3">
      <p className={`text-sm font-semibold ${c.text}`}>{title}</p>

      {steps && steps.length > 0 && (
        <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
          {steps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>
      )}

      {codeSnippets && codeSnippets.length > 0 && (
        <div className="space-y-1">
          {codeSnippets.map((snip, i) => (
            <div key={i}>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">{snip.label}</p>
              <code className="block bg-slate-100 text-slate-700 text-[11px] px-2 py-1 rounded-lg font-mono break-all">{snip.code}</code>
            </div>
          ))}
        </div>
      )}

      {downloadUrl && (
        <div className={`${c.bg} border ${c.border} rounded-xl p-3 space-y-2`}>
          <p className={`text-xs font-bold ${c.text}`}>Paso 1: Descargar el archivo</p>
          <a
            href={downloadUrl}
            download
            className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl ${c.btn} text-white text-sm font-bold hover:${c.btnHover} transition-all shadow-md active:scale-[0.98]`}
          >
            <Download size={16} />
            {downloadLabel || 'Descargar solución (.bat)'}
          </a>
          <p className="text-[10px] text-slate-500 text-center">
            <strong>Paso 2:</strong> Haz clic derecho → <strong>Ejecutar como Administrador</strong>
          </p>
        </div>
      )}

      {!feedback && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500 font-semibold mb-2">¿Se solucionó tu problema?</p>
          <div className="flex gap-2">
            <button
              onClick={handleYes}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 size={14} /> Sí, se solucionó
            </button>
            <button
              onClick={handleNo}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
            >
              <XCircle size={14} /> No, persiste
            </button>
          </div>
        </div>
      )}

      {feedback === 'yes' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
          <CheckCircle2 size={28} className="text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-emerald-700">¡Nos alegra haber sido de ayuda!</p>
          <p className="text-xs text-emerald-600">Que tengas un excelente día. 😊</p>
          {onMenu && (
            <button
              onClick={onMenu}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors mt-2"
            >
              <Home size={12} /> Volver al menú
            </button>
          )}
        </div>
      )}

      {feedback === 'no' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-xs text-red-600 font-semibold">Lamentamos que no se haya solucionado.</p>
          <div className="flex flex-col gap-2">
            {onTicket && (
              <button
                onClick={onTicket}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
              >
                <Ticket size={14} /> Solicitar ticket de soporte
              </button>
            )}
            {onMenu && (
              <button
                onClick={onMenu}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <Home size={14} /> Volver al menú principal
              </button>
            )}
          </div>
          <p className="text-[10px] text-red-400 text-center">Un técnico se pondrá en contacto contigo pronto.</p>
        </div>
      )}
    </div>
  );
}
