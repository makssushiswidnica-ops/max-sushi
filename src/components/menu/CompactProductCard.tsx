'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, UtensilsCrossed } from 'lucide-react';
import { Product } from '@/types';
import { CornerRibbon } from '@/components/menu/CornerRibbon';
import { getProductZoom } from '@/lib/imageZoom';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useI18n } from '@/lib/i18nContext';
import { getEffectivePrice } from '@/lib/utils';

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
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
      }}
      className="group relative p-[1px] bg-white/10 hover:bg-[#e50914]/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#e50914]/15 cursor-pointer select-none w-full h-full flex flex-col active:scale-[0.98]"
    >
      {/* Внутрішній фон картки з самурайськими кутами */}
      <div
        style={{
          clipPath: 'polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)',
        }}
        className="w-full h-full flex flex-col justify-between bg-[#0d0d12] group-hover:bg-[#13131c] transition-colors duration-300 overflow-hidden"
      >
        {/* Верхня частина: Фото ролу з назвою внизу та характеристиками у правому кутку */}
        <div className="relative w-full aspect-[4/3] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)] border-b border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          {/* Лівий верхній кут: Діагональний самурайський бейдж-стрічка знижки / новинки / хіта / GRATIS */}
          <CornerRibbon
            productId={product.id}
            discountPercent={product.discountPercent}
            badge={product.badge}
            isGift={isGiftProduct}
            className="w-11 h-11 sm:w-13 sm:h-13"
          />

          {/* Правий верхній кут: Кількість штук та вага БЕЗ рамки */}
          {(product.pieces || product.weight) && (
            <div className="absolute top-1.5 right-1.5 z-20 pointer-events-none px-1.5 py-0.5 rounded bg-black/50 text-[8.5px] sm:text-[9px] font-bold text-zinc-300 select-none tracking-tight">
              {product.pieces ? `${product.pieces} ${locale === 'pl' ? 'szt.' : 'шт.'}` : ''}
              {product.pieces && product.weight ? ' • ' : ''}
              {product.weight ? `${product.weight}${isDodatki && product.id.includes('sos') ? 'ml' : 'g'}` : ''}
            </div>
          )}

          {/* Зображення ролу: наближений фокус ролу по центру */}
          {product.image ? (
            <div className="w-full h-full flex items-center justify-center pb-3.5 pt-0.5 px-1.5 transition-transform duration-300 ease-out group-hover:scale-105">
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ transform: `scale(${Math.min(getProductZoom(product) * 1.12, 1.9)})` }}
              >
                <img
                  src={product.image}
                  alt={product.name[locale]}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 gap-1 select-none pb-3.5 pt-1">
              <UtensilsCrossed className="w-5 h-5 text-zinc-700 group-hover:text-[#e50914]/60 transition-colors" />
              <span className="text-[8.5px] font-bold tracking-wider uppercase text-zinc-500">Maks Sushi</span>
            </div>
          )}

          {/* Плавний темний градієнт поверх низу фотографії з назвою страви */}
          <div className="absolute inset-x-0 bottom-0 z-20 pt-4 pb-1 px-2 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/80 to-transparent text-left pointer-events-none">
            <h3 className="text-[10.5px] sm:text-xs font-black uppercase tracking-tight text-white group-hover:text-[#ff4d58] transition-colors leading-tight line-clamp-1 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {product.name[locale]}
            </h3>
          </div>
        </div>

        {/* Нижня компактна панель: фіксована висота, ідеальне горизонтальне вирівнювання цін та кнопок */}
        <div className="h-9 sm:h-10 px-2 sm:px-2.5 flex items-center justify-between gap-1 bg-[#0d0d12] border-t border-white/5 shrink-0">
          <div className="text-left shrink-0 flex items-center">
            {hasDiscount ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-black text-[#ff4d58] tracking-tight leading-none">
                  {effectivePrice.toFixed(2).replace('.', ',')} zł
                </span>
                <span className="text-[9px] sm:text-[9.5px] text-zinc-400 font-semibold line-through leading-none opacity-90">
                  {product.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ) : (
              <div className="text-[11px] sm:text-xs font-black text-white tracking-tight leading-none">
                {product.price.toFixed(2).replace('.', ',')} zł
              </div>
            )}
          </div>

          {/* Швидка кнопка додавання в кошик без відкриття модалки: строго відцентрована по висоті */}
          <div className="shrink-0 flex items-center justify-end">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(product);
                }}
                aria-label="Додати до кошика"
                style={{
                  clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                }}
                className="w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 active:scale-90 text-white font-black shadow-sm shadow-[#e50914]/30 hover:shadow-[#e50914]/50 transition-all cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                }}
                className="h-6 sm:h-6.5 inline-flex items-center bg-[#171722] border border-[#e50914]/60 p-0.5 shadow-sm shadow-[#e50914]/20 animate-in fade-in duration-150"
              >
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  aria-label="Зменшити"
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center text-zinc-300 hover:text-white bg-white/5 hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-[10px] sm:text-[10.5px] font-bold text-white px-1 font-mono min-w-[14px] text-center select-none leading-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  aria-label="Збільшити"
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center text-white bg-[#e50914] hover:bg-[#f4222d] transition-colors cursor-pointer shadow-sm shadow-[#e50914]/30"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
