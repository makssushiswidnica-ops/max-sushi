'use client';

import React from 'react';
import { Minus, Plus, Trash2, UtensilsCrossed, Gift } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, getItemUnitPrice } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { locale } = useI18n();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const effectiveUnit = getItemUnitPrice(item.product, item.selectedOptions);
  const isGift = Boolean(item.isGift);

  return (
    <div className={`flex items-center gap-3.5 p-3 rounded-xl border transition-colors ${
      isGift 
        ? 'bg-[#1b1717] border-red-500/30 shadow-md shadow-red-950/20' 
        : 'bg-[#14141a] border-white/5 hover:border-white/10'
    }`}>
      {/* Фото або стильна іконка для додатків / страв без фото */}
      {isGift ? (
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-red-500/40 flex items-center justify-center">
          {item.product.image ? (
            <img
              src={item.product.image}
              alt={item.product.name[locale]}
              className="w-full h-full object-cover"
            />
          ) : (
            <Gift className="w-7 h-7 text-[#e50914]" />
          )}
          <span className="absolute bottom-0 inset-x-0 bg-[#e50914] text-white text-[9px] font-black uppercase text-center py-0.5 tracking-wider">
            GRATIS
          </span>
        </div>
      ) : item.product.categoryId === 'dodatki' ? (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#1a1a24] border border-white/10 flex items-center justify-center text-[#e50914] shrink-0 font-bold text-xs uppercase tracking-wider">
          +
        </div>
      ) : item.product.image ? (
        <img
          src={item.product.image}
          alt={item.product.name[locale]}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg object-cover bg-zinc-900 shrink-0"
        />
      ) : (
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600 shrink-0">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
      )}

      {/* Опис та ціна */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white truncate">
          {item.product.name[locale]}
        </h4>
        {item.product.pieces && (
          <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
            <span>{item.product.pieces} {locale === 'pl' ? 'szt.' : 'шт.'}</span>
          </div>
        )}

        {/* Бейджі модифікаторів (печена риба / в темпурі) */}
        {(item.selectedOptions?.baked || item.selectedOptions?.tempura) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.selectedOptions?.baked && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {locale === 'pl'
                  ? `Pieczona ryba (+${item.product.bakedPrice ?? (item.product as any)?.nutrition?.bakedPrice ?? 1} zł)`
                  : `Печена риба (+${item.product.bakedPrice ?? (item.product as any)?.nutrition?.bakedPrice ?? 1} zł)`}
              </span>
            )}
            {item.selectedOptions?.tempura && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-[#ff4d58] border border-red-500/30">
                {locale === 'pl'
                  ? `W tempurze (+${item.product.tempuraPrice ?? (item.product as any)?.nutrition?.tempuraPrice ?? 2} zł)`
                  : `У темпурі (+${item.product.tempuraPrice ?? (item.product as any)?.nutrition?.tempuraPrice ?? 2} zł)`}
              </span>
            )}
          </div>
        )}

        <div className="mt-1 flex items-baseline gap-2">
          {isGift ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-emerald-400">0 zł</span>
              <span className="text-xs text-zinc-500 line-through">
                {formatPrice(item.product.price, locale)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-[#e50914]">
                {formatPrice(effectiveUnit * item.quantity, locale)}
              </span>
              {(item.product.discountPercent ?? 0) > 0 && (
                <span className="text-xs text-zinc-500 line-through">
                  {formatPrice(item.product.price * item.quantity, locale)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Лічильник або статус подарунка */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        {!isGift && (
          <button
            onClick={() => removeItem(item.product.id, item.selectedOptions)}
            aria-label="Видалити страву"
            className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {isGift ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#1b1b24] text-zinc-300 border border-white/10 select-none">
            1 {locale === 'pl' ? 'szt.' : 'шт.'}
          </span>
        ) : (
          <div
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
            className="flex items-center gap-1.5 bg-[#1b1b24] border border-white/10 p-1"
          >
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedOptions)}
              aria-label="Зменшити кількість"
              className="flex items-center justify-center w-6 h-6 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold text-white min-w-[18px] text-center select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedOptions)}
              aria-label="Збільшити кількість"
              className="flex items-center justify-center w-6 h-6 bg-[#e50914] text-white hover:bg-[#f4222d] transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
