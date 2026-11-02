import React from 'react';
import { cn } from '@/lib/utils';

interface CornerRibbonProps {
  productId: string;
  discountPercent?: number;
  badge?: string;
  className?: string;
}

export function CornerRibbon({
  productId,
  discountPercent,
  badge,
  className = 'w-16 h-16 sm:w-20 sm:h-20',
}: CornerRibbonProps) {
  const hasDiscount = Boolean(discountPercent && discountPercent > 0);
  const activeBadge = !hasDiscount ? badge : undefined;

  if (!hasDiscount && !activeBadge) return null;

  let label = '';
  let gradStops = { from: '#e50914', via: '#85050b', to: '#0a0a10' };
  let strokeColor = '#e50914';
  let fontSize = '11';

  if (hasDiscount) {
    label = `-${discountPercent}%`;
  } else if (activeBadge === 'veg') {
    label = 'VEGAN';
    gradStops = { from: '#059669', via: '#064e3b', to: '#0a0a10' };
    strokeColor = '#10b981';
    fontSize = '10';
  } else if (activeBadge === 'hit') {
    label = 'HIT';
  } else if (activeBadge === 'new') {
    label = 'NEW';
  } else if (activeBadge) {
    label = String(activeBadge).toUpperCase();
  }

  return (
    <svg
      viewBox="0 0 80 80"
      className={cn(
        'absolute top-0 left-0 z-20 pointer-events-none select-none filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]',
        className
      )}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-ribbon-${productId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradStops.from} />
          <stop offset="50%" stopColor={gradStops.via} />
          <stop offset="100%" stopColor={gradStops.to} />
        </linearGradient>
      </defs>
      <polygon
        points="34,0 78,0 0,78 0,34"
        fill={`url(#grad-ribbon-${productId})`}
      />
      <line
        x1="34"
        y1="0"
        x2="0"
        y2="34"
        stroke={strokeColor}
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="78"
        y1="0"
        x2="0"
        y2="78"
        stroke={strokeColor}
        strokeWidth="1.2"
        opacity="0.8"
      />
      <text
        x="28"
        y="28"
        transform="rotate(-45 28 28)"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={fontSize}
        fontWeight="900"
        letterSpacing="0.04em"
        style={{ fontFamily: 'inherit', fontWeight: 900 }}
      >
        {label}
      </text>
    </svg>
  );
}

