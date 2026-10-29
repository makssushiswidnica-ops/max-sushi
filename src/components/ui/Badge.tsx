import React from 'react';
import { cn } from '@/lib/utils';
import { ProductBadge } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ProductBadge | 'default' | 'success';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const styles = {
    hit: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20',
    new: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20',
    spicy: 'bg-orange-500/25 text-orange-400 border border-orange-500/40',
    veg: 'bg-green-500/20 text-green-300 border border-green-500/30',
    sale: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse',
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    success: 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase backdrop-blur-md',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
