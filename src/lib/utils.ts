import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Product, SelectedProductOptions } from '@/types';

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

export function getItemUnitPrice(product: Product, options?: SelectedProductOptions): number {
  let price = getEffectivePrice(product);
  if (options?.baked) price += (product.bakedPrice !== undefined ? product.bakedPrice : 1);
  if (options?.tempura) price += (product.tempuraPrice !== undefined ? product.tempuraPrice : 2);
  return price;
}

/**
 * Перевіряє, чи є товар або набір акційним (зі знижкою, спеціальною ціною, або комбо-набором).
 * До таких позицій НЕ додаються інші відсоткові знижки:
 * - знижка на самовивіз (-5%)
 * - знижка на День народження (-10%)
 * - знижка на перше замовлення (-10%)
 */
export function isPromotionalProduct(product?: Product | null): boolean {
  if (!product) return false;
  if ((product.discountPercent || 0) > 0) return true;
  if ((product.comboDiscountPercent || 0) > 0) return true;
  if (product.categoryId === 'event-promos') return true;
  if (product.categoryId === 'promocje') return true;
  if (typeof product.id === 'string' && product.id.startsWith('combo-')) return true;
  if (product.badge === 'sale') return true;
  return false;
}


