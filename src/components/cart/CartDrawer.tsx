'use client';

import React, { useRef } from 'react';
import { ShoppingBag, ArrowRight, Trash2, Utensils, CheckCircle2, AlertCircle, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { CartItem } from '@/components/cart/CartItem';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';
import { brandTheme } from '@/config/theme';
import { formatPrice, cn } from '@/lib/utils';
import { products as defaultProducts } from '@/lib/mockData';

export function CartDrawer() {
  const { locale, t } = useI18n();
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const personsCount = useCartStore((s) => s.personsCount);
  const setPersonsCount = useCartStore((s) => s.setPersonsCount);
  const setIsCheckoutOpen = useCartStore((s) => s.setIsCheckoutOpen);
  const menuProducts = useCartStore((s) => s.menuProducts);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // Отримуємо соуси та додатки з категорії dodatki
  const allProducts = menuProducts && menuProducts.length > 0 ? menuProducts : defaultProducts;
  const sauceAddons = React.useMemo(() => {
    return allProducts.filter(
      (p) => p.categoryId === 'dodatki' && p.isAvailable !== false
    );
  }, [allProducts]);

  const subtotal = useCartStore((s) => s.getSubtotal)();
  const deliveryFee = useCartStore((s) => s.getDeliveryFee)();
  const total = useCartStore((s) => s.getTotal)();
  const remainingForFree = useCartStore((s) => s.getRemainingForFreeDelivery)();
  const freeThreshold = brandTheme.delivery.freeDeliveryThreshold;

  const freeDeliveryProgress = Math.min(100, (subtotal / freeThreshold) * 100);

  const handleProceedToCheckout = () => {
    setOpen(false);
    setIsCheckoutOpen(true);
  };

  // Рефи та методи для плавного скролу/перетягування каруселі додатків на компʼютері
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    if (!carouselRef.current) return;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeftPos.current = carouselRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    carouselRef.current.scrollLeft = scrollLeftPos.current - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (carouselRef.current && e.deltaY !== 0) {
      // Дозволяємо прокрутку коліщатком мишки на комп'ютері
      carouselRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 240;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#e50914]" />
          <span>{t.cart.title}</span>
          {items.length > 0 && (
            <span className="text-xs font-semibold text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full">
              {items.reduce((acc, curr) => acc + curr.quantity, 0)}
            </span>
          )}
        </div>
      }
    >
      {items.length === 0 ? (
        /* Порожній стан кошика */
        <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#1b1b24] border border-white/5 text-zinc-500 mb-6">
            <ShoppingBag className="w-10 h-10 stroke-1 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t.cart.emptyTitle}</h3>
          <p className="text-sm text-zinc-400 max-w-xs mb-8">
            {t.cart.emptySubtitle}
          </p>
          <button
            onClick={() => setOpen(false)}
            style={{
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
            className="px-6 py-3 bg-[#e50914] hover:bg-[#f4222d] text-white font-bold text-sm shadow-lg shadow-[#e50914]/30 hover:shadow-[#e50914]/50 active:scale-95 transition-all cursor-pointer"
          >
            {t.cart.browseMenu}
          </button>
        </div>
      ) : (
        /* Кошик із товарами */
        <div className="flex flex-col h-full justify-between -m-5 sm:-m-6">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Прогрес-бар безкоштовної доставки */}
            <div className="p-3.5 rounded-xl bg-[#171722] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                {remainingForFree > 0 ? (
                  <span className="text-zinc-300">
                    {t.cart.awayFromFreeDelivery.replace('{{amount}}', remainingForFree.toString())}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    {t.cart.qualifiesForFreeDelivery}
                  </span>
                )}
                <span className="font-bold text-white">
                  {freeThreshold} zł
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-[#e50914] transition-all duration-300 rounded-full"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>

            {/* Список страв */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Ваші страви
                </span>
                <button
                  onClick={() => {
                    if (confirm(t.cart.clearConfirm)) clearCart();
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.cart.clear}</span>
                </button>
              </div>

              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>

            {/* Горизонтальна свайп-стрічка соусів та додатків */}
            {sauceAddons.length > 0 && (
              <div className="space-y-3 pt-3 pb-3 border-y border-white/5 my-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {locale === 'pl' ? 'Dodaj sosy i dodatki' : 'Додати соуси та додатки'}
                  </span>
                  
                  {/* Кнопки перемикання для компʼютера та підказка */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline-block mr-1">
                      {locale === 'pl' ? 'Do smaku' : 'До смаку'}
                    </span>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('left')}
                      aria-label="Вліво"
                      title="Попередня"
                      className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel('right')}
                      aria-label="Вправо"
                      title="Наступна"
                      className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div 
                  ref={carouselRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onWheel={handleWheel}
                  className="flex gap-3 overflow-x-auto py-2.5 px-5 sm:px-6 -mx-5 sm:-mx-6 scrollbar-none snap-x cursor-grab active:cursor-grabbing select-none"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {sauceAddons.map((addon) => {
                    const cartItem = items.find((i) => i.product.id === addon.id);
                    const qty = cartItem ? cartItem.quantity : 0;
                    const name = typeof addon.name === 'object'
                      ? (addon.name[locale as 'uk' | 'pl'] || addon.name.uk || addon.name.pl)
                      : addon.name;

                    return (
                      <div
                        key={addon.id}
                        className={cn(
                          'w-[116px] sm:w-[124px] shrink-0 snap-start rounded-xl p-3 flex flex-col justify-between transition-all duration-200 border relative select-none',
                          qty > 0
                            ? 'bg-[#1b1b26] border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-[#14141c] border-white/5 hover:border-white/15'
                        )}
                      >
                        {/* Бейдж кількості в кошику */}
                        {qty > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
                            {qty}
                          </span>
                        )}

                        <div className="space-y-1.5 text-center">
                          {/* Картинка або стильна іконка */}
                          <div className="w-12 h-12 mx-auto rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
                            {addon.image ? (
                              <img
                                src={addon.image}
                                alt={name}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            ) : (
                              <span className="text-xl pointer-events-none">🥢</span>
                            )}
                          </div>

                          {/* Назва соусу */}
                          <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight min-h-[26px]">
                            {name}
                          </p>
                        </div>

                        {/* Ціна та кнопка додавання */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-amber-400">
                            {formatPrice(addon.price, locale)}
                          </span>

                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => addItem(addon, 1)}
                              aria-label={`Додати ${name}`}
                              className="w-6 h-6 rounded-full bg-[#e50914] hover:bg-[#f4222d] active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-[#e50914]/40"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-black/60 rounded-full p-0.5 border border-white/10">
                              <button
                                type="button"
                                onClick={() => updateQuantity(addon.id, qty - 1)}
                                className="w-5 h-5 flex items-center justify-center text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-[11px] font-black text-white min-w-[12px] text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(addon.id, qty + 1)}
                                className="w-5 h-5 flex items-center justify-center text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Вибір кількості приборів та паличок */}
            <div className="p-4 rounded-xl bg-[#14141c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Utensils className="w-4 h-4 text-[#e50914] shrink-0" />
                  <span className="text-xs font-bold text-white truncate">
                    {t.cart.chopsticks}
                  </span>
                </div>
                <div
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="flex items-center gap-1 bg-[#1b1b24] border border-white/10 p-1 shrink-0"
                >
                  <button
                    onClick={() => setPersonsCount(personsCount - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-300 text-xs font-bold cursor-pointer transition-colors shrink-0"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white px-2 whitespace-nowrap text-center select-none shrink-0">
                    {personsCount} {t.cart.persons}
                  </span>
                  <button
                    onClick={() => setPersonsCount(personsCount + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-[#e50914] hover:bg-[#f4222d] text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                {t.cart.chopsticksHelp}
              </p>
            </div>
          </div>

          {/* Нижня закріплена панель підсумку */}
          <div className="p-5 sm:p-6 bg-[#16161f] border-t border-white/10 space-y-3">
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span>{t.cart.subtotal}</span>
                <span className="font-semibold text-white">{formatPrice(subtotal, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.cart.delivery}</span>
                <span className="font-semibold text-white">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400">{t.cart.free}</span>
                  ) : (
                    formatPrice(deliveryFee, locale)
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between text-base font-extrabold text-white">
                <span>{t.cart.total}</span>
                <span className="text-lg text-[#e50914]">{formatPrice(total, locale)}</span>
              </div>
            </div>

            {/* Головна кнопка оформлення замовлення у формі клинка */}
            <button
              onClick={handleProceedToCheckout}
              id="proceed-to-checkout-btn"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 text-white font-black text-sm sm:text-base shadow-lg shadow-[#e50914]/30 hover:shadow-[#e50914]/50 active:scale-[0.99] transition-all cursor-pointer select-none"
            >
              <span>{t.cart.checkout}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
