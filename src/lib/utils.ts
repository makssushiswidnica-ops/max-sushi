import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string = 'pl'): string {
  const currency = locale === 'uk' ? 'zł' : 'zł'; // у Польщі розрахунок у zł
  return `${amount} ${currency}`;
}
