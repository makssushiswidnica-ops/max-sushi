import React from 'react';
import { cn } from '@/lib/utils';

interface CornerRibbonProps {
  productId: string;
  discountPercent?: number;
  badge?: string;
  isGift?: boolean | null;
  className?: string;
}

export function CornerRibbon({
  productId,
  discountPercent,
  badge,
  isGift,
  className = 'w-16 h-16 sm:w-20 sm:h-20',
}: CornerRibbonProps) {
  const reactId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `grad-ribbon-${productId}-${reactId}`;

  const hasDiscount = Boolean(discountPercent && discountPercent > 0);
  const activeBadge = !isGift && !hasDiscount ? badge : undefined;

  if (!isGift && !hasDiscount && !activeBadge) return null;

  let label = '';
  // Соковитий червоний градієнт за замовчуванням (як на скріншоті)
  let gradStops = { from: '#e50914', via: '#a80710', to: '#5c0207' };
  let strokeColor = '#ff3340';
  let fontSize = '11';

  if (isGift) {
    label = 'GRATIS';
    fontSize = '9.5';
    gradStops = { from: '#e50914', via: '#a80710', to: '#5c0207' };
    strokeColor = '#ff4d58';
  } else if (hasDiscount) {
    label = `-${discountPercent}%`;
    gradStops = { from: '#e50914', via: '#a80710', to: '#5c0207' };
    strokeColor = '#ff3340';
  } else if (activeBadge === 'veg') {
    label = 'VEGAN';
    // Насичений смарагдовий градієнт для веганських ролів (як на скріншоті)
    gradStops = { from: '#059669', via: '#047857', to: '#064e3b' };
    strokeColor = '#34d399';
    fontSize = '10';
  } else if (activeBadge === 'hit') {
    label = 'HIT';
    gradStops = { from: '#f59e0b', via: '#d97706', to: '#78350f' };
    strokeColor = '#fbbf24';
  } else if (activeBadge === 'new') {
    label = 'NEW';
    gradStops = { from: '#3b82f6', via: '#2563eb', to: '#1e3a8a' };
    strokeColor = '#60a5fa';
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
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradStops.from} />
          <stop offset="50%" stopColor={gradStops.via} />
          <stop offset="100%" stopColor={gradStops.to} />
        </linearGradient>
      </defs>
      <polygon
        points="34,0 78,0 0,78 0,34"
        fill={`url(#${gradId})`}
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

