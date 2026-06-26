'use client';

import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface SectionWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Animation delay in ms (default: 0) */
  delay?: number;
  /** Optional className to merge */
  className?: string;
  /** HTML tag to render (default: div) */
  as?: 'div' | 'section' | 'article' | 'header' | 'aside';
}

/**
 * Wraps a section with a fade-in + slide-up animation.
 * Use for distinct visual sections of a page.
 */
export function SectionWrapper({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
  ...props
}: SectionWrapperProps) {
  return (
    <Tag
      className={cn(
        'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards',
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface StaggeredItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Zero-based index within the parent list (used to compute delay) */
  index: number;
  /** Base delay offset in ms (default: 0) */
  baseDelay?: number;
  /** Step between items in ms (default: 50) */
  stepMs?: number;
  /** Optional className to merge */
  className?: string;
}

/**
 * Animates an individual item inside a list/grid with staggered delay.
 * Use inside containers that hold multiple similar items (KPI cards, stat cards, etc.).
 *
 * @example
 * {items.map((item, i) => (
 *   <StaggeredItem key={item.id} index={i} baseDelay={100}>
 *     <Card>...</Card>
 *   </StaggeredItem>
 * ))}
 */
export function StaggeredItem({
  children,
  index,
  baseDelay = 0,
  stepMs = 50,
  className,
  ...props
}: StaggeredItemProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards',
        className,
      )}
      style={{ animationDelay: `${baseDelay + index * stepMs}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}
