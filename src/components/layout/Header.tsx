'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Phone, Clock, MapPin, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useI18n } from '@/lib/i18nContext';
import { brandTheme, getStoreStatus } from '@/config/theme';
import { formatPrice, cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function Header() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const toggleCart = useCartStore((s) => s.toggleOpen);
  const items = useCartStore((s) => s.items);

  const toggleCustomerDrawer = useCustomerStore((s) => s.toggleOpen);
  const customer = useCustomerStore((s) => s.customer);

  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNewAdminOrder, setHasNewAdminOrder] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Відстеження адмін-сесії та надходження нових замовлень у реальному часі
  useEffect(() => {
    if (!mounted) return;

    let isMounted = true;

    const checkPendingOrders = async () => {
      try {
        let hasPending = false;
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('orders')
            .select('id')
            .eq('status', 'pending')
            .limit(1);
          if (!error && data && data.length > 0) {
            hasPending = true;
          }
        }
        if (!hasPending && typeof window !== 'undefined') {
          const local = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
          if (Array.isArray(local) && local.some((o: any) => o.status === 'pending')) {
            hasPending = true;
          }
        }
        if (isMounted) setHasNewAdminOrder(hasPending);
      } catch (err) {
        console.warn('Check pending orders notice:', err);
      }
    };

    const verifyAdmin = async () => {
      let adminLogged = false;
      try {
        const { data } = await supabase.auth.getSession();
        const email = data?.session?.user?.email?.toLowerCase() || '';
        if (email === 'makssushiswidnica@gmail.com' || email.includes('admin') || email.includes('makssushi')) {
          adminLogged = true;
        }
      } catch (e) {}

      if (!adminLogged && typeof window !== 'undefined') {
        adminLogged = localStorage.getItem('max-sushi-is-admin') === 'true';
      }

      if (isMounted) {
        setIsAdmin(adminLogged);
        if (adminLogged) {
          checkPendingOrders();
        }
      }
    };

    verifyAdmin();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase() || '';
      const adminActive = email === 'makssushiswidnica@gmail.com' || email.includes('admin') || email.includes('makssushi');
      if (isMounted) {
        setIsAdmin(adminActive);
        if (adminActive) {
          checkPendingOrders();
        } else {
          setHasNewAdminOrder(false);
        }
      }
    });

    const onAdminAuthChange = () => verifyAdmin();
    const onNewOrder = () => {
      if (isMounted) setHasNewAdminOrder(true);
    };
    const onOrdersUpdate = () => checkPendingOrders();

    window.addEventListener('admin-auth-changed', onAdminAuthChange);
    window.addEventListener('max-sushi-new-order', onNewOrder);
    window.addEventListener('admin-orders-updated', onOrdersUpdate);
    window.addEventListener('storage', onOrdersUpdate);

    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('header-admin-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              if (isMounted) setHasNewAdminOrder(true);
            } else {
              checkPendingOrders();
            }
          }
        )
        .subscribe();
    }

    const interval = setInterval(() => {
      checkPendingOrders();
    }, 25000);

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('admin-auth-changed', onAdminAuthChange);
      window.removeEventListener('max-sushi-new-order', onNewOrder);
      window.removeEventListener('admin-orders-updated', onOrdersUpdate);
      window.removeEventListener('storage', onOrdersUpdate);
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(interval);
    };
  }, [mounted]);

  // Реактивне обчислення напряму з items, щоб зміна кошика оновлювала хедер миттєво
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const displayTotalCount = mounted ? totalCount : 0;
  const displaySubtotal = mounted ? subtotal : 0;
  // Захист від розбіжності часу SSR та клієнта:
  const defaultStatus = {
    isOpen: true,
    text: locale === 'pl' ? 'Otwarte teraz' : 'Відчинено зараз',
    todayHours: '12:00 – 21:00',
  };
  const storeStatus = mounted ? getStoreStatus(locale) : defaultStatus;

  // Анімація імпульсу при зміні кількості в кошику
  const [isBumping, setIsBumping] = useState(false);
  useEffect(() => {
    if (mounted && totalCount > 0) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalCount, subtotal, mounted]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-nav border-b border-white/10 transition-all">
        {/* Верхня інформаційна стрічка: тепер видна і на мобільних телефонах */}
        <div className="border-b border-white/5 bg-[#070709]/90 py-1.5 sm:py-2 text-[11px] sm:text-xs text-zinc-400">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {storeStatus.isOpen ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  )}
                </span>
                <span className={storeStatus.isOpen ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {storeStatus.text}
                </span>
                <span className="text-zinc-500 hidden xs:inline">•</span>
                <span className="hidden xs:flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {storeStatus.todayHours}
                </span>
              </div>
              <a
                href={brandTheme.contacts.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1 text-zinc-400 hover:text-white transition-colors group cursor-pointer"
                title={locale === 'pl' ? 'Pokaż na Google Maps' : 'Показати на Google Maps'}
              >
                <MapPin className="w-3.5 h-3.5 text-[#e50914] group-hover:scale-110 transition-transform" />
                <span className="group-hover:underline underline-offset-2">{brandTheme.contacts.shortAddress}</span>
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={`tel:${brandTheme.contacts.phoneRaw}`}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-[#e50914] transition-colors font-medium text-xs sm:text-sm"
              >
                <Phone className="w-3 h-3 text-[#e50914]" />
                <span>{brandTheme.contacts.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Головна панель навігації */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between">
          {/* Логотип: повертає на самий верх сторінки */}
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}`}
              onClick={(e) => {
                // Скидаємо відкриту категорію та пошук до початкового стану головної сторінки
                window.dispatchEvent(new CustomEvent('reset-to-initial-catalog'));

                // Якщо вже знаходимось на цій сторінці, миттєво переходимо на самий верх
                if (window.location.pathname.startsWith(`/${locale}`)) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }
              }}
              className="flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer"
              aria-label="Strona główna Maks Sushi"
            >
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[#e50914] shadow-md shadow-[#e50914]/35 group-hover:scale-105 transition-all duration-300 bg-black shrink-0">
                <img
                  src={brandTheme.logo}
                  alt={brandTheme.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5 font-brand">
                  <span className="text-xl sm:text-3xl text-[#e50914] leading-none drop-shadow-sm">
                    MAKS
                  </span>
                  <span className="text-xl sm:text-3xl text-white group-hover:text-zinc-200 transition-colors leading-none drop-shadow-sm">
                    SUSHI
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Права частина: Кнопка кабінету клієнта + Кнопка кошика */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Кнопка кабінету клієнта / адміна (якщо адмін — перехід в адмінку, іконка пульсує червоним при замовленні) */}
            <button
              onClick={() => {
                if (isAdmin) {
                  router.push('/admin');
                } else {
                  toggleCustomerDrawer();
                }
              }}
              aria-label={
                isAdmin
                  ? hasNewAdminOrder
                    ? (locale === 'pl' ? 'Nowe zamówienie! Panel administratora' : 'Нове замовлення! Панель адміністратора')
                    : (locale === 'pl' ? 'Panel administratora' : 'Панель адміністратора')
                  : customer
                  ? t.customer.myAccount
                  : t.customer.loginTitle
              }
              title={
                isAdmin
                  ? hasNewAdminOrder
                    ? (locale === 'pl' ? 'Nowe zamówienie! Kliknij, aby przejść do panelu' : 'Нове замовлення! Клікніть, щоб відкрити адмінку')
                    : (locale === 'pl' ? 'Panel administratora' : 'Панель адміністратора')
                  : customer
                  ? t.customer.myAccount
                  : t.customer.loginTitle
              }
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
              className={cn(
                'relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border transition-all cursor-pointer select-none active:scale-95 shrink-0',
                isAdmin && hasNewAdminOrder
                  ? 'bg-[#1a0808] border-[#e50914] shadow-[0_0_12px_rgba(229,9,20,0.5)]'
                  : customer
                  ? 'bg-[#181824] hover:bg-[#202030] border-emerald-500/40 text-white shadow-sm'
                  : 'bg-[#131318] hover:bg-[#1a1a22] border-white/10 text-zinc-300 hover:text-white'
              )}
            >
              <div className="relative flex items-center justify-center">
                <User
                  className={cn(
                    'w-4 h-4 transition-all duration-300',
                    isAdmin && hasNewAdminOrder
                      ? 'text-[#e50914] animate-pulse drop-shadow-[0_0_8px_rgba(229,9,20,0.9)] scale-110'
                      : 'text-[#e50914]'
                  )}
                />
                {/* Зелена цятка для авторизованого клієнта */}
                {!isAdmin && customer && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#181824]" />
                )}
              </div>
            </button>

            {/* Реактивна кнопка кошика з формою клинка та анімацією імпульсу */}
            <button
              onClick={toggleCart}
              id="cart-trigger-button"
              aria-label={t.cart.title}
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
              className={`relative flex items-center gap-2 bg-[#e50914] hover:bg-[#f4222d] text-white px-3 py-1.5 sm:px-4 sm:py-2 shadow-md shadow-[#e50914]/25 hover:shadow-[#e50914]/40 active:scale-95 transition-all duration-200 cursor-pointer font-bold text-xs sm:text-sm select-none ${
                isBumping ? 'scale-110 shadow-lg shadow-[#e50914]/50' : ''
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-white" />
                {displayTotalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-white text-[#e50914] text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs animate-in zoom-in">
                    {displayTotalCount}
                  </span>
                )}
              </div>

              <span className="font-bold text-white text-xs sm:text-sm">
                {displaySubtotal > 0 ? formatPrice(displaySubtotal, locale) : '0 zł'}
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
