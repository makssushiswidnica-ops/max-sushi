import React from 'react';
import { ProductBadge as ProductBadgeType } from '@/types';

interface ProductBadgeProps {
  badge?: ProductBadgeType | string;
  locale?: 'pl' | 'uk';
  className?: string;
}

export function ProductBadge({ badge, locale = 'pl', className = '' }: ProductBadgeProps) {
  if (!badge) return null;

  switch (badge) {
    case 'new':
      return (
        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e50914] text-white border border-red-400/50 shadow-md shadow-red-950/80 backdrop-blur-xs select-none ${className}`}>
          NEW
        </span>
      );
    case 'veg':
      return (
        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-600 text-white border border-emerald-400/50 shadow-md shadow-emerald-950/80 backdrop-blur-xs select-none ${className}`}>
          VEGAN
        </span>
      );
    case 'hit':
      return (
        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e50914] text-white border border-red-400/50 shadow-md shadow-red-950/80 backdrop-blur-xs select-none ${className}`}>
          HIT
        </span>
      );
    case 'spicy':
      return (
        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-orange-600 text-white border border-orange-400/50 shadow-md shadow-orange-950/80 backdrop-blur-xs select-none ${className}`}>
          SPICY
        </span>
      );
    case 'sale':
      return (
        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-pink-600 text-white border border-pink-400/50 shadow-md shadow-pink-950/80 backdrop-blur-xs select-none ${className}`}>
          SALE
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-white/10 text-white border border-white/20 backdrop-blur-xs select-none ${className}`}>
          {badge.toUpperCase()}
        </span>
      );
  }
}
