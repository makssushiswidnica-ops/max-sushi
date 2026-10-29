'use client';

import React from 'react';
import { ShoppingBag, ArrowRight, Trash2, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { CartItem } from '@/components/cart/CartItem';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';
import { brandTheme } from '@/config/theme';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const { locale, t } = useI18n();
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const personsCount = useCartStore((s) => s.personsCount);
  const setPersonsCount = useCartStore((s) => s.setPersonsCount);
  const setIsCheckoutOpen = useCartStore((s) => s.setIsCheckoutOpen);

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

            {/* Вибір кількості приборів та паличок */}
            <div className="p-4 rounded-xl bg-[#14141c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#e50914]" />
                  <span className="text-xs font-bold text-white">
                    {t.cart.chopsticks}
                  </span>
                </div>
                <div
                  style={{
                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  }}
                  className="flex items-center gap-2 bg-[#1b1b24] border border-white/10 p-1"
                >
                  <button
                    onClick={() => setPersonsCount(personsCount - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-300 text-xs font-bold cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white min-w-[20px] text-center select-none">
                    {personsCount} {t.cart.persons}
                  </span>
                  <button
                    onClick={() => setPersonsCount(personsCount + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-[#e50914] hover:bg-[#f4222d] text-white text-xs font-bold cursor-pointer transition-colors"
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
