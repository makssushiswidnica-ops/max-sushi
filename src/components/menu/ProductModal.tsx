'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice } from '@/lib/utils';
import { categories, products } from '@/lib/mockData';
import {
  Plus,
  Minus,
  ShoppingBag,
  Scale,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function ProductModal() {
  const { locale, t } = useI18n();
  const selectedProduct = useCartStore((s) => s.selectedProduct);
  const setSelectedProduct = useCartStore((s) => s.setSelectedProduct);
  const addItem = useCartStore((s) => s.addItem);

  const [modalQuantity, setModalQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Тач-координати для свайпів
  const cardTouchStartX = useRef<number | null>(null);
  const cardTouchStartY = useRef<number | null>(null);
  const photoTouchStartX = useRef<number | null>(null);

  // Поточний індекс товару в списку
  const currentIndex = selectedProduct
    ? products.findIndex((p) => p.id === selectedProduct.id)
    : -1;

  // Масив зображень для обраного ролу (підтримка як одного фото, так і повноцінної галереї)
  const productImages: string[] = selectedProduct
    ? (selectedProduct.images && selectedProduct.images.length > 0
        ? selectedProduct.images
        : [selectedProduct.image])
    : [];

  const hasMultipleImages = productImages.length > 1;

  // Перемикання на попередню картку
  const handlePrevCard = useCallback(() => {
    if (products.length === 0) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : products.length - 1;
    setSelectedProduct(products[prevIndex]);
    setModalQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
  }, [currentIndex, setSelectedProduct]);

  // Перемикання на наступну картку
  const handleNextCard = useCallback(() => {
    if (products.length === 0) return;
    const nextIndex = currentIndex < products.length - 1 ? currentIndex + 1 : 0;
    setSelectedProduct(products[nextIndex]);
    setModalQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
  }, [currentIndex, setSelectedProduct]);

  // Закриття модалки
  const handleClose = useCallback(() => {
    setSelectedProduct(null);
    setModalQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
  }, [setSelectedProduct]);

  // Обробка клавіатури: Escape для закриття, стрілки вліво/вправо для гортання карток
  useEffect(() => {
    if (!selectedProduct) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard();
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProduct, handleClose, handlePrevCard, handleNextCard]);

  // Скидання індексу фото при зміні товару
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct?.id]);

  if (!selectedProduct) return null;

  // Додавання до кошика
  const handleAddToCart = () => {
    addItem(selectedProduct, modalQuantity);
    setIsAdded(true);
    setTimeout(() => {
      handleClose();
    }, 600);
  };

  // Свайп по галереї фотографій ролу
  const handlePhotoTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    e.stopPropagation();
    photoTouchStartX.current = e.touches[0].clientX;
  };

  const handlePhotoTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultipleImages || photoTouchStartX.current === null) return;
    e.stopPropagation();
    const touchEndX = e.changedTouches[0].clientX;
    const diff = photoTouchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Свайп вліво по фото -> наступна фотографія ролу
        setCurrentImageIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
      } else {
        // Свайп вправо по фото -> попередня фотографія ролу
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
      }
    }
    photoTouchStartX.current = null;
  };

  // Свайп по картці (гортання ролів)
  const handleCardTouchStart = (e: React.TouchEvent) => {
    cardTouchStartX.current = e.touches[0].clientX;
    cardTouchStartY.current = e.touches[0].clientY;
  };

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (cardTouchStartX.current === null || cardTouchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = cardTouchStartX.current - touchEndX;
    const diffY = cardTouchStartY.current - touchEndY;

    // Переконуємось, що це горизонтальний свайп, а не вертикальний рух
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        handleNextCard();
      } else {
        handlePrevCard();
      }
    }
    cardTouchStartX.current = null;
    cardTouchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden">
      {/* Затемнений бекдроп */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Головний контейнер модалки з десктопними стрілками перемикання */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-2xl my-auto flex items-center justify-center">
        {/* Кнопка "Попередній рол" для десктопу (зліва від модалки) */}
        <button
          onClick={handlePrevCard}
          aria-label="Попередній рол"
          title="Попередній рол (←)"
          className="hidden sm:flex absolute -left-14 xl:-left-16 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-zinc-900/90 hover:bg-[#e50914] text-white/80 hover:text-white border border-white/10 hover:border-[#e50914] shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-20"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Тіло модальної картки: прямі прямокутні кути без заокруглень */}
        <div
          onTouchStart={handleCardTouchStart}
          onTouchEnd={handleCardTouchEnd}
          className="relative w-full bg-[#111116] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden text-white animate-in zoom-in-95 duration-200"
        >
          {/* Верхня панель (для мобільного: кнопки навігації + індикатор + закриття) */}
          <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-white/5 bg-[#16161e]">
            {/* Мобільні кнопки гортання карток та індикатор */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrevCard}
                className="sm:hidden flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-white/15 text-zinc-300 active:scale-90 transition-all cursor-pointer"
                aria-label="Попередній"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 bg-black/40 px-2 py-0.5 border border-white/5">
                {currentIndex + 1} / {products.length}
              </span>

              <button
                onClick={handleNextCard}
                className="sm:hidden flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-white/15 text-zinc-300 active:scale-90 transition-all cursor-pointer"
                aria-label="Наступний"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="hidden sm:inline-block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {categories.find((c) => c.id === selectedProduct.categoryId)?.name[locale] || 'Maks Sushi'}
              </span>
            </div>

            {/* Кнопка закриття (хрестик) */}
            <button
              onClick={handleClose}
              aria-label="Закрити"
              className="inline-flex h-8 w-8 items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Внутрішній вміст: 2 колонки для ролів, 1 центрована елегантна колонка для додатків */}
          <div className={`p-3.5 sm:p-5 flex flex-col ${selectedProduct.categoryId === 'dodatki' ? 'max-w-md mx-auto w-full' : 'sm:flex-row'} gap-4 sm:gap-6 items-center sm:items-start`}>
            {/* Ліва колонка: Фотографія ролу (прихована для додатків) - прямокутник з чистим чорним фоном */}
            {selectedProduct.categoryId !== 'dodatki' && (
              <div
                onTouchStart={handlePhotoTouchStart}
                onTouchEnd={handlePhotoTouchEnd}
                className="relative w-full sm:w-1/2 aspect-[4/3] flex items-center justify-center bg-black border border-white/10 p-4 overflow-hidden flex-shrink-0 shadow-md shadow-black/80"
              >
              {/* Фото ролу з об'ємною тінню */}
              <img
                key={productImages[currentImageIndex]}
                src={productImages[currentImageIndex]}
                alt={selectedProduct.name[locale]}
                className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)] animate-in fade-in duration-200"
              />

              {/* Стрілочки галереї на десктопі (тільки якщо у ролу > 1 фото) */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev > 0 ? prev - 1 : productImages.length - 1
                      );
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-[#e50914] text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                    aria-label="Попереднє фото"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev < productImages.length - 1 ? prev + 1 : 0
                      );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-[#e50914] text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                    aria-label="Наступне фото"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Крапочки пагінації фотографій ролу */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                    {productImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? 'bg-[#e50914] w-3'
                            : 'bg-zinc-500 hover:bg-zinc-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              </div>
            )}

            {/* Колонка: Інформація, Інгредієнти, Кількість/Вага, Ціна та Замовлення */}
            <div className={`w-full ${selectedProduct.categoryId === 'dodatki' ? 'w-full' : 'sm:w-1/2'} flex flex-col gap-3 sm:gap-3.5`}>
              <div>
                {/* Назва ролу капсом */}
                <h2 className="text-base sm:text-xl font-black uppercase tracking-wide text-white leading-tight">
                  {selectedProduct.name[locale]}
                </h2>

                {/* Короткий опис (якщо є) */}
                {selectedProduct.description && (
                  <p className="mt-1 text-xs text-zinc-400 leading-snug line-clamp-2">
                    {selectedProduct.description[locale]}
                  </p>
                )}

                {/* Блок інгредієнтів у стовпчик капсом */}
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    {t.product.ingredients}:
                  </span>
                  <div className="flex flex-col gap-0.5 text-[11px] sm:text-xs text-zinc-300 font-semibold uppercase tracking-wider">
                    {selectedProduct.ingredients[locale].map((ingredient, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#e50914]" />
                        <span>{ingredient}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Кількість шматочків та вага: акуратно винесені під складники без рамки */}
                {(selectedProduct.weight || selectedProduct.pieces) && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-3 text-xs text-zinc-400 font-medium">
                    {selectedProduct.pieces && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-zinc-500">{t.product.pieces}:</span>
                        <strong className="text-white font-bold">{selectedProduct.pieces} {locale === 'pl' ? 'szt.' : 'шт.'}</strong>
                      </span>
                    )}
                    {selectedProduct.pieces && selectedProduct.weight && (
                      <span className="text-zinc-600">•</span>
                    )}
                    {selectedProduct.weight && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-zinc-500">{t.product.weight}:</span>
                        <strong className="text-white font-bold">{selectedProduct.weight} {selectedProduct.categoryId === 'dodatki' && selectedProduct.id.includes('sos') ? 'ml' : 'g'}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Нижня частина: вибір кількості та кнопка замовлення з ціною */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-2.5 sm:gap-3">
                {/* Лічильник кількості у формі клинка */}
                <div
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="flex items-center gap-1.5 bg-[#1a1a24] border border-white/10 p-1"
                >
                  <button
                    type="button"
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    disabled={isAdded}
                    aria-label="Зменшити"
                    className="flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-white px-1.5 min-w-[20px] text-center select-none">
                    {modalQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    disabled={isAdded}
                    aria-label="Збільшити"
                    className="flex items-center justify-center w-7 h-7 bg-[#e50914] hover:bg-[#f4222d] text-white transition-colors cursor-pointer shadow-sm shadow-[#e50914]/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Головна кнопка додавання у формі клинка */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdded}
                  style={{
                    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-3 sm:px-4 font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer whitespace-nowrap select-none ${
                    isAdded
                      ? 'bg-emerald-600 text-white shadow-emerald-500/30 scale-[1.02]'
                      : 'bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 text-white shadow-[#e50914]/30 hover:shadow-[#e50914]/50 active:scale-[0.98]'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3] animate-in zoom-in" />
                      <span>{locale === 'pl' ? 'Dodano!' : 'Додано!'}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t.product.addToCart}</span>
                      <span className="text-white/60">•</span>
                      <span>
                        {formatPrice(selectedProduct.price * modalQuantity, locale)}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка "Наступний рол" для десктопу (справа від модалки) */}
        <button
          onClick={handleNextCard}
          aria-label="Наступний рол"
          title="Наступний рол (→)"
          className="hidden sm:flex absolute -right-14 xl:-right-16 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-zinc-900/90 hover:bg-[#e50914] text-white/80 hover:text-white border border-white/10 hover:border-[#e50914] shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-20"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
