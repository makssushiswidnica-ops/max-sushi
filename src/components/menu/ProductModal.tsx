'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, getEffectivePrice, cn } from '@/lib/utils';
import { fetchMenuData } from '@/lib/menuService';
import {
  Plus,
  Minus,
  ShoppingBag,
  Scale,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Gift,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { ProductBadge } from '@/components/menu/ProductBadge';
import { CornerRibbon } from '@/components/menu/CornerRibbon';
import { getProductZoom } from '@/lib/imageZoom';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ALLERGENS, AllergenKey } from '@/types';
import { DEFAULT_PRODUCT_ALLERGENS } from '@/lib/allergenData';

export function ProductModal() {
  const { locale, t } = useI18n();
  const selectedProduct = useCartStore((s) => s.selectedProduct);
  const setSelectedProduct = useCartStore((s) => s.setSelectedProduct);
  const menuProducts = useCartStore((s) => s.menuProducts);
  const setMenuProducts = useCartStore((s) => s.setMenuProducts);
  const menuCategories = useCartStore((s) => s.menuCategories);
  const setMenuCategories = useCartStore((s) => s.setMenuCategories);
  const addItem = useCartStore((s) => s.addItem);
  const giftPromo = useSettingsStore((s) => s.giftPromo);
  const isGiftProduct = giftPromo?.enabled && selectedProduct && giftPromo.productId === selectedProduct.id;

  const [modalQuantity, setModalQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBakedSelected, setIsBakedSelected] = useState(false);
  const [isTempuraSelected, setIsTempuraSelected] = useState(false);
  const [isAllergensOpen, setIsAllergensOpen] = useState(false);

  // Скидання вибору модифікаторів та алергенів при зміні страви
  useEffect(() => {
    setIsBakedSelected(false);
    setIsTempuraSelected(false);
    setIsAllergensOpen(false);
  }, [selectedProduct?.id]);

  // Тач-координати для свайпів
  const cardTouchStartX = useRef<number | null>(null);
  const cardTouchStartY = useRef<number | null>(null);
  const photoTouchStartX = useRef<number | null>(null);

  // Синхронізація актуальних страв та категорій напряму з бази даних Supabase
  useEffect(() => {
    if (menuProducts.length === 0) {
      fetchMenuData().then((data) => {
        if (data.products?.length > 0) {
          setMenuProducts(data.products.filter((p) => p.isAvailable !== false));
        }
        if (data.categories?.length > 0) {
          setMenuCategories(data.categories);
        }
      });
    }
  }, [menuProducts.length, setMenuProducts, setMenuCategories]);

  // Список доступних страв з БД для гортання
  const activeProducts = menuProducts;

  // Поточний індекс товару в списку бази даних
  const currentIndex = selectedProduct
    ? activeProducts.findIndex((p) => p.id === selectedProduct.id)
    : -1;

  // Масив зображень для обраного ролу виключно з БД
  const productImages: string[] = selectedProduct
    ? (selectedProduct.images && selectedProduct.images.filter(Boolean).length > 0
        ? selectedProduct.images.filter(Boolean)
        : (selectedProduct.image ? [selectedProduct.image] : []))
    : [];

  const hasMultipleImages = productImages.length > 1;

  // Перемикання на попередню картку з бази даних
  const handlePrevCard = useCallback(() => {
    if (activeProducts.length === 0) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : activeProducts.length - 1;
    setSelectedProduct(activeProducts[prevIndex]);
    setModalQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
  }, [currentIndex, activeProducts, setSelectedProduct]);

  // Перемикання на наступну картку з бази даних
  const handleNextCard = useCallback(() => {
    if (activeProducts.length === 0) return;
    const nextIndex = currentIndex < activeProducts.length - 1 ? currentIndex + 1 : 0;
    setSelectedProduct(activeProducts[nextIndex]);
    setModalQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
  }, [currentIndex, activeProducts, setSelectedProduct]);

  // Закриття модалки з синхронізацією категорії з поточної відкритої страви
  const handleClose = useCallback(() => {
    if (selectedProduct?.categoryId) {
      window.dispatchEvent(
        new CustomEvent('sync-category-from-modal', {
          detail: {
            categoryId: selectedProduct.categoryId,
            productId: selectedProduct.id,
          },
        })
      );
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('maks_active_category', selectedProduct.categoryId);
      }
    }
    setSelectedProduct(null);
    setModalQuantity(1);
    setCurrentImageIndex(0);
    setIsAdded(false);
  }, [selectedProduct, setSelectedProduct]);

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

  // Розрахунок вартості з урахуванням обраних модифікаторів
  const bakedPrice = selectedProduct.bakedPrice ?? (selectedProduct.nutrition as any)?.bakedPrice ?? 1;
  const tempuraPrice = selectedProduct.tempuraPrice ?? (selectedProduct.nutrition as any)?.tempuraPrice ?? 2;
  const optionExtraPrice = (isBakedSelected ? bakedPrice : 0) + (isTempuraSelected ? tempuraPrice : 0);
  const modalUnitPrice = getEffectivePrice(selectedProduct) + optionExtraPrice;
  const modalTotalPrice = modalUnitPrice * modalQuantity;

  // Алергени страви (з моделі або офіційної карти ресторану)
  const productAllergens: AllergenKey[] =
    selectedProduct.allergens ||
    (selectedProduct.nutrition as any)?.allergens ||
    DEFAULT_PRODUCT_ALLERGENS[selectedProduct.id] ||
    [];

  // Додавання до кошика (не закриваємо модалку, залишаємо користувача в картці)
  const handleAddToCart = () => {
    addItem(selectedProduct, modalQuantity, {
      baked: isBakedSelected,
      tempura: isTempuraSelected,
    });
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 select-none overflow-hidden">
      {/* Затемнений бекдроп */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Головний контейнер модалки з десктопними стрілками перемикання */}
      <div className="relative z-10 w-full h-[100dvh] sm:h-[min(590px,calc(100dvh-1.5rem))] max-h-[100dvh] sm:max-w-3xl my-auto flex items-center justify-center">
        {/* Кнопка "Попередній рол" для десктопу (зліва від модалки) */}
        <button
          onClick={handlePrevCard}
          aria-label="Попередній рол"
          title="Попередній рол (←)"
          className="hidden sm:flex absolute -left-14 xl:-left-16 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-zinc-900/90 hover:bg-[#e50914] text-white/80 hover:text-white border border-white/10 hover:border-[#e50914] shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-20"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Тіло модальної картки: на телефоні на весь екран (100dvh) без стрибків, на десктопі до 590px або висота екрану в landscape */}
        <div
          onTouchStart={handleCardTouchStart}
          onTouchEnd={handleCardTouchEnd}
          className="relative w-full h-full sm:h-[min(590px,calc(100dvh-1.5rem))] max-h-[100dvh] flex flex-col bg-[#111116] border-0 sm:border sm:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden text-white animate-in zoom-in-95 duration-200 rounded-none"
        >
          {/* Десктопна верхня панель (навігація + хлібні крихти + закриття). На мобільному прихована для економії місця */}
          <div className="hidden sm:flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#16161e] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 bg-black/40 px-2.5 py-0.5">
                {currentIndex + 1} / {activeProducts.length || 1}
              </span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {menuCategories.find((c) => c.id === selectedProduct.categoryId)?.name[locale] || 'Maks Sushi'}
              </span>
            </div>

            {/* Десктопна кнопка закриття (хрестик) */}
            <button
              onClick={handleClose}
              aria-label="Закрити"
              className="inline-flex h-8 w-8 items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Мобільна верхня панель тільки для додатків без фото з урахуванням Safari Notch */}
          {selectedProduct.categoryId === 'dodatki' && (
            <div className="sm:hidden flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b border-white/5 bg-[#16161e] shrink-0">
              <div className="flex items-center gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                <button onClick={handlePrevCard} className="text-zinc-300 hover:text-white active:scale-90 p-1 cursor-pointer">
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="text-xs font-mono font-black text-white">
                  {currentIndex + 1} / {activeProducts.length || 1}
                </span>
                <button onClick={handleNextCard} className="text-zinc-300 hover:text-white active:scale-90 p-1 cursor-pointer">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-zinc-300 active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Внутрішній вміст: на мобільному фото зверху, опис по центру, кнопки знизу. На десктопі 2 рівні колонки */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col sm:flex-row sm:p-5 gap-0 sm:gap-6 items-stretch scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Колонка з фотографією: на мобільному зверху з плаваючими лічильником у верхньому лівому куті без фону і хрестиком справа. На десктопі строго 50% з overflow-hidden */}
            {selectedProduct.categoryId !== 'dodatki' && (
              <div
                onTouchStart={handlePhotoTouchStart}
                onTouchEnd={handlePhotoTouchEnd}
                className="relative w-full sm:w-1/2 sm:max-w-[calc(50%-0.75rem)] sm:flex-1 sm:min-w-0 h-[38dvh] max-h-[330px] min-h-[230px] sm:max-h-none sm:min-h-0 sm:h-full pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 px-3 sm:p-6 sm:pt-6 flex items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)] border-b sm:border-b-0 sm:border border-white/10 rounded-none overflow-hidden shrink-0 shadow-md shadow-black/80"
              >
                {/* Мобільна плаваюча кнопка закриття (хрестик) поверх фото під статус-баром */}
                <button
                  onClick={handleClose}
                  aria-label="Закрити"
                  className="sm:hidden absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 z-30 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 active:scale-90 transition-all cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Єдиний кутовий самурайський бейдж-стрічка з відкритим кутом і пріоритетом знижки / подарунка */}
                <CornerRibbon
                  productId={selectedProduct.id}
                  discountPercent={selectedProduct.discountPercent}
                  badge={selectedProduct.badge}
                  isGift={Boolean(isGiftProduct)}
                  className="w-18 h-18 sm:w-22 sm:h-22"
                />

                {/* Мобільний плаваючий лічильник позицій унизу зображення по центру */}
                <div
                  className={cn(
                    'sm:hidden absolute left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 select-none shadow-lg shadow-black/80',
                    hasMultipleImages
                      ? (isGiftProduct ? 'bottom-14' : 'bottom-8')
                      : (isGiftProduct ? 'bottom-10' : 'bottom-3')
                  )}
                >
                  <button
                    onClick={handlePrevCard}
                    className="text-zinc-300 hover:text-white active:scale-90 p-0.5 cursor-pointer transition-colors"
                    aria-label="Попередній"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <span className="text-xs font-mono font-black text-white tracking-wider px-1">
                    {currentIndex + 1} / {activeProducts.length || 1}
                  </span>
                  <button
                    onClick={handleNextCard}
                    className="text-zinc-300 hover:text-white active:scale-90 p-0.5 cursor-pointer transition-colors"
                    aria-label="Наступний"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Плашка подарунка на всю ширину внизу зображення (червоно-чорний градієнт) */}
                {isGiftProduct && (
                  <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none py-2 px-3 bg-gradient-to-r from-[#e50914] via-[#85050b] to-[#0a0a10] text-white flex items-center justify-center gap-2 shadow-lg shadow-black/90 select-none border-t border-[#e50914]/50">
                    <Gift className="w-4 h-4 text-white shrink-0 animate-bounce" />
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-center text-white drop-shadow-md">
                      {locale === 'pl' 
                        ? `Za darmo od ${giftPromo.minAmount} zł` 
                        : `Безкоштовно від ${giftPromo.minAmount} zł`}
                    </span>
                  </div>
                )}

                {/* Фото ролу з об'ємною тінню та збільшеним масштабом зблизька */}
                {productImages.length > 0 && productImages[currentImageIndex] ? (
                  <div
                    className="w-full h-full flex items-center justify-center animate-in fade-in duration-200 p-1 sm:p-3"
                    style={{
                      transform: `scale(${Math.min(getProductZoom(selectedProduct) * 1.35, 3.2)})`,
                    }}
                  >
                    <img
                      key={productImages[currentImageIndex]}
                      src={productImages[currentImageIndex]}
                      alt={`${selectedProduct.name[locale]} — ${locale === 'pl' ? 'Maks Sushi Świdnica sushi na dowóz' : 'Maks Sushi Свідниця суші з доставкою'}`}
                      title={`${selectedProduct.name[locale]} — Maks Sushi`}
                      decoding="async"
                      className="w-full h-full max-h-full max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-600 gap-2 select-none">
                    <UtensilsCrossed className="w-10 h-10 text-zinc-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Maks Sushi</span>
                  </div>
                )}

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

            {/* Колонка опису: комфортне повітря між блоками, на мобільному плавно заповнює екран */}
            <div className={`w-full ${selectedProduct.categoryId === 'dodatki' ? 'max-w-md mx-auto p-4' : 'sm:w-1/2 sm:max-w-[calc(50%-0.75rem)] sm:flex-1 sm:min-w-0 p-4 sm:p-0'} flex flex-col justify-between overflow-hidden`}>
              <div className="space-y-3 sm:space-y-4 overflow-y-auto overflow-x-hidden pr-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Назва ролу капсом та бейдж */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white leading-tight">
                    {selectedProduct.name[locale]}
                  </h2>
                  {selectedProduct.badge && selectedProduct.categoryId === 'dodatki' && (
                    <ProductBadge badge={selectedProduct.badge} locale={locale} />
                  )}
                </div>

                {/* Блок інгредієнтів у стовпчик капсом (без обрізання тексту) */}
                {selectedProduct.ingredients?.[locale]?.length > 0 && (
                  <div className="pt-2.5 border-t border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                      {t.product.ingredients}:
                    </span>
                    <div className={`grid grid-cols-1 ${selectedProduct.ingredients[locale].length > 5 ? 'sm:grid-cols-2' : ''} gap-x-4 gap-y-1.5 text-xs text-zinc-300 font-semibold uppercase tracking-wider`}>
                      {selectedProduct.ingredients[locale].map((ingredient, idx) => (
                        <span key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] shrink-0 mt-1" />
                          <span className="leading-snug break-words">{ingredient}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Блок алергенів (Варіант 1: компактний акордеон) */}
                {productAllergens.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsAllergensOpen((prev) => !prev)}
                      className="flex items-center justify-between w-full py-1 text-left cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {locale === 'pl' ? `Alergeny (${productAllergens.length})` : `Алергени (${productAllergens.length})`}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 text-zinc-500 transition-transform duration-200',
                          isAllergensOpen && 'rotate-180 text-white'
                        )}
                      />
                    </button>

                    {isAllergensOpen && (
                      <div className="flex flex-wrap gap-1.5 pt-2 pb-0.5 animate-in fade-in duration-150">
                        {productAllergens.map((key) => {
                          const def = ALLERGENS.find((a) => a.key === key);
                          if (!def) return null;
                          return (
                            <span
                              key={key}
                              title={def.name[locale]}
                              className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10"
                            >
                              {def.short[locale]}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Блок вибору додаткових модифікаторів: печена риба / рол у темпурі */}
                {(selectedProduct.canBeBaked || selectedProduct.canBeTempura) && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider block">
                      {locale === 'pl' ? 'Opcje do wyboru:' : 'Додаткові опції:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProduct.canBeBaked && (
                        <button
                          type="button"
                          onClick={() => setIsBakedSelected((prev) => !prev)}
                          style={{
                            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                          }}
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-none border transition-all cursor-pointer text-left select-none',
                            isBakedSelected
                              ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm shadow-amber-500/20'
                              : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/10'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'w-4 h-4 rounded-xs border flex items-center justify-center transition-colors shrink-0',
                              isBakedSelected ? 'bg-amber-500 border-amber-400 text-black' : 'border-white/30 bg-transparent'
                            )}>
                              {isBakedSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs font-bold leading-tight">
                              {locale === 'pl' ? 'Pieczona ryba' : 'Печена риба'}
                            </span>
                          </div>
                          <span className="text-xs font-black text-amber-400 shrink-0 ml-1">+{bakedPrice} zł</span>
                        </button>
                      )}

                      {selectedProduct.canBeTempura && (
                        <button
                          type="button"
                          onClick={() => setIsTempuraSelected((prev) => !prev)}
                          style={{
                            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                          }}
                          className={cn(
                            'flex items-center justify-between p-2.5 rounded-none border transition-all cursor-pointer text-left select-none',
                            isTempuraSelected
                              ? 'bg-[#e50914]/15 border-[#e50914]/60 text-white shadow-sm shadow-red-500/20'
                              : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/10'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'w-4 h-4 rounded-xs border flex items-center justify-center transition-colors shrink-0',
                              isTempuraSelected ? 'bg-[#e50914] border-red-400 text-white' : 'border-white/30 bg-transparent'
                            )}>
                              {isTempuraSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-xs font-bold leading-tight">
                              {locale === 'pl' ? 'W tempurze' : 'У темпурі'}
                            </span>
                          </div>
                          <span className="text-xs font-black text-[#ff4d58] shrink-0 ml-1">+{tempuraPrice} zł</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* На десктопі: ціна, грамовка/штуки та кнопка замовлення закріплені внизу правої колонки */}
              <div className="hidden sm:flex flex-col gap-2.5 pt-3 mt-3 border-t border-white/10 shrink-0">
                {/* Рядок 1: Ціна виділена червоним шрифтом + Шматочки та вага */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black text-[#e50914] tracking-tight">
                      {formatPrice(modalTotalPrice, locale)}
                    </span>
                    {(selectedProduct.discountPercent ?? 0) > 0 && (
                      <span className="text-xs sm:text-sm text-zinc-500 line-through">
                        {formatPrice((selectedProduct.price + optionExtraPrice) * modalQuantity, locale)}
                      </span>
                    )}
                    {modalQuantity > 1 && (
                      <span className="text-[11px] text-zinc-500 font-medium font-mono">
                        ({formatPrice(modalUnitPrice, locale)} / {locale === 'pl' ? 'szt.' : 'шт.'})
                      </span>
                    )}
                  </div>

                  {(selectedProduct.weight || selectedProduct.pieces) && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold shrink-0">
                      {selectedProduct.pieces && (
                        <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 text-white">
                          {selectedProduct.pieces} {locale === 'pl' ? 'szt.' : 'шт.'}
                        </span>
                      )}
                      {selectedProduct.weight && (
                        <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 text-white">
                          {selectedProduct.weight} {selectedProduct.categoryId === 'dodatki' && selectedProduct.id.includes('sos') ? 'ml' : 'g'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Рядок 2: Лічильник кількості + Кнопка замовлення */}
                <div className="flex items-center gap-3 w-full">
                  {/* Лічильник кількості */}
                  <div
                    style={{
                      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                    }}
                    className="flex items-center gap-1 bg-[#1a1a24] border border-white/10 p-1 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      disabled={isAdded}
                      aria-label="Зменшити"
                      className="flex items-center justify-center w-8 h-8 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-white px-1.5 min-w-[22px] text-center select-none font-mono">
                      {modalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      disabled={isAdded}
                      aria-label="Збільшити"
                      className="flex items-center justify-center w-8 h-8 bg-[#e50914] hover:bg-[#f4222d] text-white transition-colors cursor-pointer shadow-sm shadow-[#e50914]/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Головна кнопка додавання */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAdded}
                    style={{
                      clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                    }}
                    className={`flex-1 h-11 flex items-center justify-center gap-2 px-4 font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer select-none ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30'
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
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>{t.product.addToCart}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* На мобільному: закріплений футер внизу екрана з урахуванням Safari Home Bar (safe-area-inset-bottom) */}
          <div className="sm:hidden shrink-0 bg-[#16161e] border-t border-white/10 px-4 pt-3 pb-[calc(0.85rem+env(safe-area-inset-bottom,0px))] z-20 flex flex-col gap-2.5">
            {/* Рядок 1: Ціна виділена червоним зліва + Шматочки та вага справа */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-[#e50914] tracking-tight">
                  {formatPrice(modalTotalPrice, locale)}
                </span>
                {(selectedProduct.discountPercent ?? 0) > 0 && (
                  <span className="text-xs text-zinc-500 line-through">
                    {formatPrice((selectedProduct.price + optionExtraPrice) * modalQuantity, locale)}
                  </span>
                )}
                {modalQuantity > 1 && (
                  <span className="text-[11px] text-zinc-500 font-medium font-mono">
                    ({formatPrice(modalUnitPrice, locale)} / {locale === 'pl' ? 'szt.' : 'шт.'})
                  </span>
                )}
              </div>

              {(selectedProduct.weight || selectedProduct.pieces) && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold shrink-0">
                  {selectedProduct.pieces && (
                    <span className="bg-white/5 border border-white/10 px-2 py-0.5 text-white">
                      {selectedProduct.pieces} {locale === 'pl' ? 'szt.' : 'шт.'}
                    </span>
                  )}
                  {selectedProduct.weight && (
                    <span className="bg-white/5 border border-white/10 px-2 py-0.5 text-white">
                      {selectedProduct.weight} {selectedProduct.categoryId === 'dodatki' && selectedProduct.id.includes('sos') ? 'ml' : 'g'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Рядок 2: Лічильник кількості + Кнопка замовлення */}
            <div className="flex items-center gap-2.5 w-full">
              {/* Лічильник кількості */}
              <div
                style={{
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                }}
                className="flex items-center gap-1 bg-[#1a1a24] border border-white/10 p-1 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  disabled={isAdded}
                  aria-label="Зменшити"
                  className="flex items-center justify-center w-8 h-8 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-white px-1 min-w-[20px] text-center select-none font-mono">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  disabled={isAdded}
                  aria-label="Збільшити"
                  className="flex items-center justify-center w-8 h-8 bg-[#e50914] hover:bg-[#f4222d] text-white transition-colors cursor-pointer shadow-sm shadow-[#e50914]/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Головна кнопка додавання */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdded}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className={`flex-1 h-11 flex items-center justify-center gap-2 px-4 font-black text-xs shadow-lg transition-all cursor-pointer select-none ${
                  isAdded
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 text-white shadow-[#e50914]/30 active:scale-[0.98]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3] animate-in zoom-in" />
                    <span>{locale === 'pl' ? 'Dodano!' : 'Додано!'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>{t.product.addToCart}</span>
                  </>
                )}
              </button>
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
