'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Check, UtensilsCrossed } from 'lucide-react';
import { Product } from '@/types';
import { ProductBadge } from '@/components/menu/ProductBadge';
import { getProductZoom } from '@/lib/imageZoom';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale, t } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setSelectedProduct = useCartStore((s) => s.setSelectedProduct);
  const activeCardId = useCartStore((s) => s.activeCardId);
  const setActiveCardId = useCartStore((s) => s.setActiveCardId);
  const isMenuOpen = useCartStore((s) => s.isMenuOpen);

  const cartItem = mounted ? items.find((item) => item.product.id === product.id) : undefined;
  const quantity = cartItem?.quantity || 0;
  const isEditing = activeCardId === product.id && quantity > 0;

  // Автоматичне повернення кнопки до компактного стану після 3.5 секунд бездіяльності
  useEffect(() => {
    if (!isEditing) return;
    const timer = setTimeout(() => {
      if (activeCardId === product.id) {
        setActiveCardId(null);
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [isEditing, quantity, activeCardId, product.id, setActiveCardId]);

  // Форматування ціни у формат "16,00 PLN"
  const formattedPrice = `${product.price.toFixed(2).replace('.', ',')} PLN`;
  const isDodatki = product.categoryId === 'dodatki';

  // Форматування підпису порції: для додатків cena za 30 ml / 1 szt / 15 g / 35 g
  const getSubtitle = () => {
    if (isDodatki) {
      if (product.id === 'pomocniki-do-paleczek') {
        return locale === 'pl' ? 'CENA ZA 1 SZT.' : 'ЦІНА ЗА 1 ШТ.';
      }
      if (product.id === 'wasabi-dodatkowy') {
        return locale === 'pl' ? 'CENA ZA 15 G' : 'ЦІНА ЗА 15 Г';
      }
      if (product.id === 'imbir-dodatkowy') {
        return locale === 'pl' ? 'CENA ZA 30 G' : 'ЦІНА ЗА 30 Г';
      }
      if (product.id === 'sos-sojowy-dodatkowy') {
        return locale === 'pl' ? 'CENA ZA 30 ML' : 'ЦІНА ЗА 30 МЛ';
      }
      return locale === 'pl' ? `CENA ZA ${product.weight || 35} ML` : `ЦІНА ЗА ${product.weight || 35} МЛ`;
    }
    return locale === 'pl' 
      ? `CENA ZA ${product.pieces || 8} SZT.` 
      : `ЦІНА ЗА ${product.pieces || 8} ШТ.`;
  };

  const piecesText = getSubtitle();

  return (
    <div
      ref={cardRef}
      onClick={() => {
        if (isMenuOpen) return;
        setSelectedProduct(product);
      }}
      style={{
        clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
      }}
      className="group relative p-[1px] bg-white/10 hover:bg-[#e50914]/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#e50914]/15 cursor-pointer select-none"
    >
      {/* Внутрішній блок картки з аналогічною самурайською формою */}
      <div
        style={{
          clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
        }}
        className="w-full h-full flex flex-col justify-between p-4 sm:p-5 bg-[#0d0d12] group-hover:bg-[#13131c] transition-colors duration-300"
      >
      {/* Верхня частина: Прямокутне зображення майже на всю ширину картки, назва, грамовка та склад */}
      <div className="flex flex-col text-left">
        {/* Просте прямокутне зображення страви з м'яким студійним світлом */}
        {!isDodatki ? (
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)] border border-white/10 group-hover:border-[#e50914]/50 flex items-center justify-center mb-3 transition-colors duration-300 shadow-md shadow-black/80 rounded-xl">
            {/* Маркетинговий бейдж (ВЕГАН, ХІТ тощо) */}
            {product.badge && (
              <div className="absolute top-2 left-2 z-20 pointer-events-none">
                <ProductBadge badge={product.badge} locale={locale} />
              </div>
            )}
            {product.image ? (
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ transform: `scale(${getProductZoom(product)})` }}
              >
                <img
                  src={product.image}
                  alt={`${product.name[locale]} — ${locale === 'pl' ? 'Maks Sushi Świdnica dostawa' : 'Maks Sushi Свідниця доставка'}`}
                  title={`${product.name[locale]} — ${product.price} zł`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 gap-1.5 select-none py-4">
                <UtensilsCrossed className="w-8 h-8 text-zinc-700 group-hover:text-[#e50914]/60 transition-colors" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Maks Sushi</span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full aspect-[16/9] bg-[#181824] border border-white/10 flex items-center justify-center text-[#e50914] font-black text-2xl mb-3 shadow-inner">
            {product.badge && (
              <div className="absolute top-2 left-2 z-20 pointer-events-none">
                <ProductBadge badge={product.badge} locale={locale} />
              </div>
            )}
            +
          </div>
        )}

        {/* Назва ролу або додатку */}
        <h3 className="text-base sm:text-lg font-black tracking-wide text-white group-hover:text-[#e50914] transition-colors leading-tight mb-1.5 line-clamp-1">
          {product.name[locale]}
        </h3>

        {/* Характеристики (шматочки / вага) */}
        <div className="flex items-center justify-start gap-2 text-xs font-semibold text-zinc-400 mb-2">
          {product.pieces && (
            <span>{product.pieces} {locale === 'pl' ? 'szt.' : 'шт.'}</span>
          )}
          {product.pieces && product.weight && <span>•</span>}
          {product.weight && (
            <span>{product.weight} {isDodatki && product.id.includes('sos') ? 'ml' : 'g'}</span>
          )}
        </div>

        {/* Склад ролу через крапочки або комки */}
        <p className="text-[11px] sm:text-xs text-zinc-400/90 font-normal leading-relaxed line-clamp-2 mb-2">
          {product.ingredients[locale].join(' • ')}
        </p>
      </div>

      {/* Нижня частина: Ціна зліва, Кнопка до кошика справа (по краях) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2"
      >
        <div className="text-left shrink-0">
          <div className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">
            {formattedPrice}
          </div>
        </div>

        {/* Фіксована висота h-9 (36px), кнопка притиснута до правого краю зі скошеними кутами */}
        <div className="h-9 flex items-center justify-end shrink-0">
          {quantity === 0 ? (
            /* Якщо товар не в кошику — стильна кнопка "+ Do koszyka" зі скошеними самурайськими кутами */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addItem(product);
                setActiveCardId(product.id);
              }}
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
              className="h-9 flex items-center justify-center gap-1.5 px-3.5 sm:px-4.5 bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 text-white text-xs sm:text-sm font-black shadow-md shadow-[#e50914]/30 hover:shadow-[#e50914]/50 active:scale-95 transition-all cursor-pointer whitespace-nowrap select-none"
            >
              <Plus className="w-4 h-4" />
              <span>{t.product.addToCart}</span>
            </button>
          ) : isEditing ? (
            /* Режим швидкої зміни кількості зі скошеними кутами */
            <div
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
              className="h-9 inline-flex items-center gap-1 bg-[#171722] border border-[#e50914]/50 p-0.5 shadow-sm shadow-[#e50914]/20 animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = quantity - 1;
                  updateQuantity(product.id, next);
                  if (next <= 0) setActiveCardId(null);
                }}
                aria-label="Зменшити"
                className="flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-white px-2 min-w-[28px] text-center select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, quantity + 1);
                }}
                aria-label="Збільшити"
                className="flex items-center justify-center w-7 h-7 bg-[#e50914] hover:bg-[#f4222d] text-white transition-colors cursor-pointer shadow-sm shadow-[#e50914]/30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Коли фокус перейшов на інший рол — кнопка "W koszyku (N)" зі скошеними кутами */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCardId(product.id);
              }}
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
              className="h-9 flex items-center justify-center gap-1.5 px-3.5 bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-300 text-xs font-black shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 animate-in fade-in duration-150 select-none"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{locale === 'pl' ? `W koszyku (${quantity})` : `У кошику (${quantity})`}</span>
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
