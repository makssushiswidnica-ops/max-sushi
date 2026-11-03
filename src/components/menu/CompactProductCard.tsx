'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, UtensilsCrossed, Gift } from 'lucide-react';
import { Product } from '@/types';
import { ProductBadge } from '@/components/menu/ProductBadge';
import { CornerRibbon } from '@/components/menu/CornerRibbon';
import { getProductZoom } from '@/lib/imageZoom';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useI18n } from '@/lib/i18nContext';
import { getEffectivePrice, cn } from '@/lib/utils';

interface CompactProductCardProps {
  product: Product;
}

export function CompactProductCard({ product }: CompactProductCardProps) {
  const { locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setSelectedProduct = useCartStore((s) => s.setSelectedProduct);
  const isMenuOpen = useCartStore((s) => s.isMenuOpen);
  const giftPromo = useSettingsStore((s) => s.giftPromo);
  const isGiftProduct = mounted && giftPromo?.enabled && giftPromo.productId === product.id;

  const cartItem = mounted ? items.find((item) => item.product.id === product.id && !item.isGift) : undefined;
  const quantity = cartItem?.quantity || 0;
  const isDodatki = product.categoryId === 'dodatki';

  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = Boolean((product.discountPercent ?? 0) > 0);

  return (
    <div
      onClick={() => {
        if (isMenuOpen) return;
        setSelectedProduct(product);
      }}
      style={{
        clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
      }}
      className="group relative p-[1px] bg-white/10 hover:bg-[#e50914]/50 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#e50914]/15 cursor-pointer select-none w-full h-full flex flex-col active:scale-[0.98]"
    >
      {/* Внутрішній фон картки з самурайськими кутами */}
      <div
        style={{
          clipPath: 'polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)',
        }}
        className="w-full h-full flex flex-col justify-between bg-[#0d0d12] group-hover:bg-[#13131c] transition-colors duration-300 overflow-hidden"
      >
        {/* Верхня частина: Квадратне фото зі збільшеним зумом ролу */}
        <div className="relative w-full aspect-square bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)] border-b border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          {/* Діагональний бейдж-стрічка знижки / новинки / хіта */}
          <CornerRibbon
            productId={product.id}
            discountPercent={product.discountPercent}
            badge={product.badge}
            className="w-13 h-13 sm:w-16 sm:h-16"
          />

          {/* Плашка ролу в подарунок (якщо діє акція) */}
          {isGiftProduct && (
            <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none py-0.5 px-1 bg-gradient-to-r from-[#e50914] via-[#85050b] to-[#0a0a10] text-white flex items-center justify-center gap-1 shadow-md select-none border-t border-[#e50914]/50">
              <Gift className="w-2.5 h-2.5 text-white shrink-0 animate-bounce" />
              <span className="text-[9px] font-black uppercase tracking-wider text-center text-white drop-shadow-sm">
                {locale === 'pl' ? 'GRATIS' : 'ПОДАРУНОК'}
              </span>
            </div>
          )}

          {/* Зображення ролу */}
          {product.image ? (
            <div className="w-full h-full flex items-center justify-center p-2 transition-transform duration-300 ease-out group-hover:scale-105">
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ transform: `scale(${Math.min(getProductZoom(product) * 1.15, 2.5)})` }}
              >
                <img
                  src={product.image}
                  alt={product.name[locale]}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.95)]"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 gap-1 select-none py-4">
              <UtensilsCrossed className="w-6 h-6 text-zinc-700 group-hover:text-[#e50914]/60 transition-colors" />
              <span className="text-[9px] font-bold tracking-wider uppercase text-zinc-500">Maks Sushi</span>
            </div>
          )}
        </div>

        {/* Середня частина: Назва та шматочки/вага */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1 text-left">
          <div>
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wide text-white group-hover:text-[#e50914] transition-colors leading-snug line-clamp-2 min-h-[2rem] flex items-start">
              {product.name[locale]}
            </h3>

            {(product.pieces || product.weight) && (
              <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 truncate mt-0.5">
                {product.pieces ? `${product.pieces} ${locale === 'pl' ? 'szt.' : 'шт.'}` : ''}
                {product.pieces && product.weight ? ' • ' : ''}
                {product.weight ? `${product.weight}${isDodatki && product.id.includes('sos') ? 'ml' : 'g'}` : ''}
              </div>
            )}
          </div>

          {/* Нижня частина: Ціна зліва + Швидка кнопка "+" / лічильник справа */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/5 mt-1">
            <div className="text-left shrink-0">
              {hasDiscount ? (
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 line-through leading-none">
                    {product.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#ff4d58] tracking-tight leading-tight mt-0.5">
                    {effectivePrice.toFixed(2).replace('.', ',')} zł
                  </span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm font-black text-white tracking-tight leading-none">
                  {product.price.toFixed(2).replace('.', ',')} zł
                </div>
              )}
            </div>

            {/* Швидка кнопка додавання в кошик без відкриття модалки */}
            <div className="shrink-0">
              {quantity === 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem(product);
                  }}
                  aria-label="Додати до кошика"
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 active:scale-90 text-white font-black shadow-md shadow-[#e50914]/30 hover:shadow-[#e50914]/50 transition-all cursor-pointer select-none"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                </button>
              ) : (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="h-7 sm:h-8 inline-flex items-center bg-[#171722] border border-[#e50914]/60 p-0.5 shadow-sm shadow-[#e50914]/20 animate-in fade-in duration-150"
                >
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    aria-label="Зменшити"
                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-zinc-300 hover:text-white bg-white/5 hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[11px] sm:text-xs font-bold text-white px-1 sm:px-1.5 font-mono min-w-[16px] text-center select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    aria-label="Збільшити"
                    className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-white bg-[#e50914] hover:bg-[#f4222d] transition-colors cursor-pointer shadow-sm shadow-[#e50914]/30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

