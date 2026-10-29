'use client';

import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { locale } = useI18n();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#14141a] border border-white/5 hover:border-white/10 transition-colors">
      {/* Фото або стильна іконка для додатків */}
      {item.product.categoryId === 'dodatki' ? (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#1a1a24] border border-white/10 flex items-center justify-center text-[#e50914] shrink-0 font-bold text-xs uppercase tracking-wider">
          +
        </div>
      ) : (
        <img
          src={item.product.image}
          alt={item.product.name[locale]}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg object-cover bg-zinc-900 shrink-0"
        />
      )}

      {/* Опис та ціна */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white truncate">
          {item.product.name[locale]}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
          <span>{item.product.weight} г</span>
          {item.product.pieces && (
            <>
              <span>•</span>
              <span>{item.product.pieces} шт.</span>
            </>
          )}
        </div>
        <div className="mt-1 text-sm font-extrabold text-[#e50914]">
          {formatPrice(item.product.price * item.quantity, locale)}
        </div>
      </div>

      {/* Лічильник та видалення */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={() => removeItem(item.product.id)}
          aria-label="Видалити страву"
          className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div
          style={{
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          }}
          className="flex items-center gap-1.5 bg-[#1b1b24] border border-white/10 p-1"
        >
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            aria-label="Зменшити кількість"
            className="flex items-center justify-center w-6 h-6 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-bold text-white min-w-[18px] text-center select-none">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            aria-label="Збільшити кількість"
            className="flex items-center justify-center w-6 h-6 bg-[#e50914] text-white hover:bg-[#f4222d] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
