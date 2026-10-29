'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-[#e50914] hover:bg-[#f4222d] text-white shadow-lg shadow-[#e50914]/25 hover:shadow-[#e50914]/40 border border-transparent rounded-xl',
      secondary:
        'bg-[#1f1f28] hover:bg-[#282834] text-zinc-100 border border-white/5 rounded-xl',
      outline:
        'bg-transparent hover:bg-white/5 text-zinc-200 border border-white/15 hover:border-white/30 rounded-xl',
      ghost:
        'bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl',
      destructive:
        'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/40 rounded-xl',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2.5 h-11 gap-2',
      lg: 'text-base px-6 py-3.5 h-13 gap-2.5 font-semibold',
      icon: 'h-10 w-10 p-0 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
