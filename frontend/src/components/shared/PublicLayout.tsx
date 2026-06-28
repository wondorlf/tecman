'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  maxWidth?: string;
}

/**
 * Shared LIGHT public layout used across landing, login, soporte and activo pages.
 * Reference design: soporte/page.tsx — white background, dot grid, E-GAN branding.
 */
export function PublicLayout({
  children,
  showBack = false,
  backHref = '/',
  backLabel = 'Inicio',
  maxWidth = 'max-w-2xl',
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-white relative overflow-x-hidden font-sans">
      {/* ── Dot grid background (same as soporte) ──────────────────────── */}
      <div
        className="absolute inset-0 z-0 opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Soft color accent blobs (hidden on mobile to prevent overflow) ── */}
      <div className="hidden sm:block absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-50 blur-[100px] pointer-events-none" />
      <div className="hidden sm:block absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-50 blur-[100px] pointer-events-none" />

      {/* ── Decorative wrapper: hidden on mobile to prevent horizontal overflow ── */}
      <div className="hidden sm:block" aria-hidden="true">
        {/* Minimalist SVG network art (top-left corner, E-GAN inspired) */}
        <svg
          className="absolute top-0 left-0 pointer-events-none select-none"
          width="340"
          height="280"
          viewBox="0 0 340 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.07 }}
        >
          <circle cx="60" cy="140" r="5" fill="#16a34a" />
          <circle cx="120" cy="80" r="4" fill="#16a34a" />
          <circle cx="180" cy="120" r="7" fill="#16a34a" />
          <circle cx="240" cy="70" r="4" fill="#16a34a" />
          <circle cx="280" cy="140" r="4" fill="#16a34a" />
          <circle cx="200" cy="190" r="4" fill="#16a34a" />
          <circle cx="130" cy="200" r="3.5" fill="#16a34a" />
          <line x1="60" y1="140" x2="180" y2="120" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="120" y1="80" x2="180" y2="120" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="180" y1="120" x2="240" y2="70" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="180" y1="120" x2="280" y2="140" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="180" y1="120" x2="200" y2="190" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="180" y1="120" x2="130" y2="200" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="240" y1="70" x2="280" y2="140" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="200" y1="190" x2="130" y2="200" stroke="#16a34a" strokeWidth="1.5" />
          <line x1="240" y1="70" x2="310" y2="20" stroke="#16a34a" strokeWidth="2.5" />
          <polygon points="310,20 298,28 306,36" fill="#16a34a" />
        </svg>

        {/* Minimalist code brackets – bottom-right decorative */}
        <svg
          className="absolute bottom-8 right-8 pointer-events-none select-none"
          width="120"
          height="80"
          viewBox="0 0 120 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.06 }}
        >
          <text x="0" y="68" fontSize="72" fontWeight="900" fill="#1e3a8a" fontFamily="monospace">
            {'{}'}
          </text>
        </svg>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex items-center justify-between max-w-2xl mx-auto w-full max-w-full">
        {showBack ? (
          <Link
            href={backHref}
            className="flex items-center gap-1.5 sm:gap-2 text-slate-400 hover:text-slate-700 text-xs sm:text-sm font-medium transition-colors group shrink-0"
          >
            <ArrowLeft size={14} className="sm:size-[15px] group-hover:-translate-x-0.5 transition-transform" />
            {backLabel}
          </Link>
        ) : (
          <div />
        )}

        {/* E-GAN Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <EganLogoMark size={28} />
          <div className="leading-none">
            <p className="text-slate-800 font-black text-[10px] sm:text-sm tracking-[0.18em] uppercase">E-GAN</p>
            <p className="text-slate-400 text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.25em] mt-0.5">
              TECH
            </p>
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className={`relative z-10 ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 w-full max-w-full overflow-x-hidden`}>{children}</main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 pb-4 sm:pb-6 text-center text-slate-400 text-[10px] sm:text-xs font-medium px-4">
        &copy; 2026 E-GAN by Jorge Montiel &middot; Sistema ITIL
      </footer>
    </div>
  );
}

/* ── E-GAN logo mark (PNG from /public/images) ─────────────────────────────── */
export function EganLogoMark({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/images/egan-logo.png"
      alt="E-GAN Logo"
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );
}
