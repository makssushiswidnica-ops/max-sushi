import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Product } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string = 'pl'): string {
  const currency = locale === 'uk' ? 'zł' : 'zł'; // у Польщі розрахунок у zł
  return `${amount} ${currency}`;
}

export function getEffectivePrice(product: Product): number {
  if (product.discountPercent && product.discountPercent > 0) {
    return Math.round(product.price * (1 - product.discountPercent / 100));
  }
  return product.price;
}

