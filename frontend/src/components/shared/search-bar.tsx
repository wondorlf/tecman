'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
  id,
}: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <Input
        ref={ref}
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 rounded-xl border-slate-200 text-sm bg-white"
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            ref.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
