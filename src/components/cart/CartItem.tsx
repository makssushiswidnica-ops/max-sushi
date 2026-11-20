'use client';

import React, { useMemo } from 'react';
import { Minus, Plus, Trash2, UtensilsCrossed, Gift } from 'lucide-react';
import { CartItem as CartItemType, ComboSubItem, getSauceChoiceLabel } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, getItemUnitPrice } from '@/lib/utils';
import { products as defaultProducts } from '@/lib/mockData';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { locale } = useI18n();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const menuProducts = useCartStore((s) => s.menuProducts);
  const eventCombosPromo = useSettingsStore((s) => s.eventCombosPromo);

  const allProducts = menuProducts && menuProducts.length > 0 ? menuProducts : defaultProducts;
  const effectiveUnit = getItemUnitPrice(item.product, item.selectedOptions);
  const isGift = Boolean(item.isGift);
  const resolvedImage =
    item.product.image || allProducts.find((p) => p.id === item.product.id)?.image;

  // Перевіряємо, чи це акційний комбо-набір (іконки та позиції в стовпчик в одному бордері)
  const resolvedComboItems: ComboSubItem[] = useMemo(() => {
    if (Array.isArray(item.product.comboItems) && item.product.comboItems.length > 0) {
      return item.product.comboItems.map((sub) => {
        const liveProd = allProducts.find((p) => p.id === sub.id);
        return {
          ...sub,
          image: sub.image || liveProd?.image || '',
          pieces: sub.pieces ?? liveProd?.pieces,
        };
      });
    }

    // Резервний розбір для наборів, доданих у кошик раніше
    if (item.product.categoryId === 'event-promos' || item.product.id?.startsWith('combo-')) {
      const descNames = (item.product.description?.pl || '').split(' + ').map((s) => s.trim()).filter(Boolean);
      if (descNames.length >= 2) {
        const matched = descNames
          .map((plName) => allProducts.find((p) => p.name.pl === plName))
          .filter((p): p is NonNullable<typeof p> => Boolean(p));
        if (matched.length >= 2) {
          return matched.map((p) => ({
            id: p.id,
            name: p.name,
            image: p.image,
            pieces: p.pieces,
            price: p.price,
          }));
        }
      }
    }

    return [];
  }, [item.product, allProducts]);

  // Рендер акційного комбо-набору: позиції з іконками в стовпчик всередині одного спільного бордера
  if (resolvedComboItems.length >= 2 && !isGift) {
    const comboOriginalPrice =
      item.product.comboOriginalPrice ||
      resolvedComboItems.reduce((acc, s) => acc + (s.price || 0), 0);
    const comboDiscountPercent =
      item.product.comboDiscountPercent ||
      (comboOriginalPrice > effectiveUnit
        ? Math.round((1 - effectiveUnit / comboOriginalPrice) * 100)
        : undefined);
    const comboEventTitle = (
      eventCombosPromo?.eventName?.[locale] ||
      eventCombosPromo?.eventName?.pl ||
      item.product.comboEventName?.[locale] ||
      item.product.comboEventName?.pl ||
      'BLACK FRIDAY'
    ).trim();

    return (
      <div className="p-3 rounded-xl border bg-[#14141a] border-white/10 hover:border-white/15 transition-colors space-y-2.5">
        {/* Стильна верхня стрічка-кепшн із назвою події з адмінки */}
        <div
          style={{
            clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
          }}
          className="w-full py-1.5 px-3 bg-gradient-to-r from-[#e50914] via-[#85050b] to-[#0a0a10] border border-[#e50914]/50 shadow-sm flex items-center justify-between gap-2 select-none"
        >
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white truncate">
            {comboEventTitle}
          </span>
          {comboDiscountPercent && comboDiscountPercent > 0 && (
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white shrink-0">
              -{comboDiscountPercent}%
            </span>
          )}
        </div>

        {/* Позиції набору в стовпчик (кожна з власною іконкою, назвою та соусом) */}
        <div className="flex flex-col divide-y divide-white/5">
          {resolvedComboItems.map((sub, idx) => (
            <div
              key={`${sub.id}-${idx}`}
              className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
            >
              {sub.image ? (
                <img
                  src={sub.image}
                  alt={sub.name[locale]}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-zinc-900 shrink-0 border border-white/5"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600 shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug truncate">
                  {sub.name[locale]}
                </h4>
                {sub.pieces && (
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {sub.pieces} {locale === 'pl' ? 'szt.' : 'шт.'}
                  </div>
                )}
                {sub.sauce && (
                  <div className="mt-1">
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {getSauceChoiceLabel(sub.sauce, locale)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Нижня панель набору в тому ж бордері: спільна акційна ціна + керування кількістю і видалення */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-[#e50914]">
              {formatPrice(effectiveUnit * item.quantity, locale)}
            </span>
            {comboOriginalPrice > effectiveUnit && (
              <span className="text-xs text-zinc-500 line-through">
                {formatPrice(comboOriginalPrice * item.quantity, locale)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => removeItem(item.product.id, item.selectedOptions)}
              aria-label="Видалити набір"
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3.5 p-3 rounded-xl border transition-colors ${
      isGift 
        ? 'bg-[#1b1717] border-red-500/30 shadow-md shadow-red-950/20' 
        : 'bg-[#14141a] border-white/5 hover:border-white/10'
    }`}>
      {/* Фото або стильна іконка для додатків / страв без фото */}
      {isGift ? (
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-red-500/40 flex items-center justify-center">
          {resolvedImage ? (
            <img
              src={resolvedImage}
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
      ) : resolvedImage ? (
        <img
          src={resolvedImage}
          alt={item.product.name[locale]}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg object-cover bg-zinc-900 shrink-0 border border-white/5"
        />
      ) : item.product.categoryId === 'dodatki' ? (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#1a1a24] border border-white/10 flex items-center justify-center text-[#e50914] shrink-0 font-bold text-xs uppercase tracking-wider">
          +
        </div>
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

        {/* Бейджі модифікаторів (печена риба / в темпурі / обраний соус) */}
        {(item.selectedOptions?.baked || item.selectedOptions?.tempura || item.selectedOptions?.sauce) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.selectedOptions?.sauce && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {getSauceChoiceLabel(item.selectedOptions.sauce, locale)}
              </span>
            )}
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
