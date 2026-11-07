'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Phone, Clock, MapPin, User, Gift } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useCustomerStore, normalizePhone } from '@/store/useCustomerStore';
import { useI18n } from '@/lib/i18nContext';
import { brandTheme, getStoreStatus } from '@/config/theme';
import { formatPrice, cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured, fetchStoreSettings } from '@/lib/supabase';

export function Header() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const toggleCart = useCartStore((s) => s.toggleOpen);
  const items = useCartStore((s) => s.items);
  const menuProducts = useCartStore((s) => s.menuProducts);
  const giftPromo = useSettingsStore((s) => s.giftPromo);

  const toggleCustomerDrawer = useCustomerStore((s) => s.toggleOpen);
  const customer = useCustomerStore((s) => s.customer);

  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNewAdminOrder, setHasNewAdminOrder] = useState(false);
  const [customerOrderStatus, setCustomerOrderStatus] = useState<'pending' | 'kitchen' | 'in_delivery' | null>(null);

  // Слайдер верхньої плашки: статус роботи (5 сек) / активна акція (10 сек)
  const [activeTopSlide, setActiveTopSlide] = useState<'status' | 'promo'>('status');

  const giftProduct = React.useMemo(() => {
    if (!giftPromo?.enabled || !giftPromo.productId) return null;
    return menuProducts?.find((p) => p.id === giftPromo.productId) || null;
  }, [giftPromo, menuProducts]);

  useEffect(() => {
    if (!mounted || !giftPromo?.enabled) {
      setActiveTopSlide('status');
      return;
    }

    const duration = activeTopSlide === 'status' ? 5000 : 10000;
    const timer = setTimeout(() => {
      setActiveTopSlide((prev) => (prev === 'status' ? 'promo' : 'status'));
    }, duration);

    return () => clearTimeout(timer);
  }, [activeTopSlide, giftPromo?.enabled, mounted]);

  useEffect(() => {
    setMounted(true);

    // Синхронізація глобальних налаштувань магазину (стоп-кран замовлень, час приготування)
    fetchStoreSettings().then((synced) => {
      if (synced) {
        if (typeof synced.isOrdersPaused === 'boolean') {
          useSettingsStore.getState().updateSettings({ isOrdersPaused: synced.isOrdersPaused });
        }
        if (typeof synced.prepWaitTimeMinutes === 'number') {
          useCartStore.getState().setPrepWaitTimeMinutes(synced.prepWaitTimeMinutes);
        }
      }
    });

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('client_store_settings_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: 'id=eq.__settings__' },
          (payload) => {
            const rawComment = (payload.new as any)?.comment;
            if (rawComment) {
              try {
                const parsed = JSON.parse(rawComment);
                if (typeof parsed.isOrdersPaused === 'boolean') {
                  useSettingsStore.getState().updateSettings({ isOrdersPaused: parsed.isOrdersPaused });
                }
                if (typeof parsed.prepWaitTimeMinutes === 'number') {
                  useCartStore.getState().setPrepWaitTimeMinutes(parsed.prepWaitTimeMinutes);
                }
              } catch { }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Перевірка активного замовлення авторизованого клієнта
  const checkCustomerOrderStatus = async () => {
    if (!customer?.phone) {
      setCustomerOrderStatus(null);
      return;
    }
    const digits = normalizePhone(customer.phone).slice(-9);
    if (!digits) {
      setCustomerOrderStatus(null);
      return;
    }

    try {
      let activeStatus: 'pending' | 'kitchen' | 'in_delivery' | null = null;
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('orders')
          .select('status, created_at')
          .ilike('phone', `%${digits}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          const active = data.find((o: any) => o.status !== 'delivered' && o.status !== 'cancelled');
          if (active) {
            if (active.status === 'pending') activeStatus = 'pending';
            else if (active.status === 'confirmed' || active.status === 'preparing') activeStatus = 'kitchen';
            else if (active.status === 'in_delivery') activeStatus = 'in_delivery';
          }
        }
      } else if (typeof window !== 'undefined') {
        const local = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
        if (Array.isArray(local)) {
          const matching = local.filter((o: any) => normalizePhone(o.phone || '').includes(digits));
          const active = matching.find((o: any) => o.status !== 'delivered' && o.status !== 'cancelled');
          if (active) {
            if (active.status === 'pending') activeStatus = 'pending';
            else if (active.status === 'confirmed' || active.status === 'preparing') activeStatus = 'kitchen';
            else if (active.status === 'in_delivery') activeStatus = 'in_delivery';
          }
        }
      }

      setCustomerOrderStatus(activeStatus);
    } catch (err) { }
  };

  // Реактивне оновлення статусу замовлення при зміні профілю клієнта
  useEffect(() => {
    if (mounted && customer) {
      checkCustomerOrderStatus();
    } else if (!customer) {
      setCustomerOrderStatus(null);
    }
  }, [mounted, customer]);

  // Відстеження адмін-сесії та надходження замовлень у реальному часі
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
          if (!error) {
            hasPending = Boolean(data && data.length > 0);
          }
        } else if (typeof window !== 'undefined') {
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
      } catch (e) { }

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
      checkCustomerOrderStatus();
    };
    const onOrdersUpdate = (e?: any) => {
      if (e?.detail && typeof e.detail.hasPending === 'boolean') {
        if (isMounted) setHasNewAdminOrder(e.detail.hasPending);
      } else {
        checkPendingOrders();
      }
      checkCustomerOrderStatus();
    };

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
            checkCustomerOrderStatus();
          }
        )
        .subscribe();
    }

    const interval = setInterval(() => {
      checkPendingOrders();
      checkCustomerOrderStatus();
    }, 20000);

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

  // Підказка кнопки користувача
  const getUserButtonTitle = () => {
    if (isAdmin) {
      return hasNewAdminOrder
        ? (locale === 'pl' ? 'Nowe zamówienie! Kliknij, aby przejść do panelu' : 'Нове замовлення! Клікніть, щоб відкрити адмінку')
        : (locale === 'pl' ? 'Panel administratora' : 'Панель адміністратора');
    }
    if (customer) {
      if (customerOrderStatus === 'pending') {
        return locale === 'pl' ? 'Twoje zamówienie oczekuje na potwierdzenie' : 'Ваше замовлення очікує підтвердження';
      }
      if (customerOrderStatus === 'kitchen') {
        return locale === 'pl' ? 'Twoje zamówienie jest przygotowywane na kuchni' : 'Ваше замовлення готується на кухні';
      }
      if (customerOrderStatus === 'in_delivery') {
        return locale === 'pl' ? 'Twoje zamówienie jest w drodze!' : 'Ваше замовлення в дорозі!';
      }
      return t.customer.myAccount;
    }
    return t.customer.loginTitle;
  };

  // Стиль рамки та фону кнопки користувача
  const getUserButtonClassName = () => {
    if (isAdmin && hasNewAdminOrder) {
      return 'bg-[#1a0808] border-[#e50914] shadow-[0_0_12px_rgba(229,9,20,0.5)]';
    }
    if (!isAdmin && customer) {
      if (customerOrderStatus === 'pending') {
        return 'bg-[#181824] border-amber-500/50 text-amber-300';
      }
      if (customerOrderStatus === 'kitchen') {
        return 'bg-[#1c1808] border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]';
      }
      if (customerOrderStatus === 'in_delivery') {
        return 'bg-[#0a1224] border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
      }
      return 'bg-[#181824] hover:bg-[#202030] border-white/10 text-white shadow-sm';
    }
    return 'bg-[#131318] hover:bg-[#1a1a22] border-white/10 text-zinc-300 hover:text-white';
  };

  // Стиль і колір іконки
  const getUserIconClassName = () => {
    if (isAdmin && hasNewAdminOrder) {
      return 'text-[#e50914] animate-pulse drop-shadow-[0_0_8px_rgba(229,9,20,0.9)] scale-110';
    }
    if (!isAdmin && customer) {
      if (customerOrderStatus === 'pending') {
        return 'text-amber-400';
      }
      if (customerOrderStatus === 'kitchen') {
        return 'text-amber-400';
      }
      if (customerOrderStatus === 'in_delivery') {
        return 'text-blue-400';
      }
    }
    return 'text-zinc-300 group-hover:text-white';
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-nav border-b border-white/10 transition-all">
        {/* Верхня інформаційна стрічка */}
        <div className="top-info-bar border-b border-white/5 bg-[#070709]/90 py-1.5 sm:py-2 text-[11px] sm:text-xs text-zinc-400">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1 overflow-hidden">
              {activeTopSlide === 'status' || !giftPromo?.enabled ? (
                <div key="status" className="flex items-center gap-1.5 min-w-0 truncate animate-in fade-in duration-300">
                  <span className="relative flex h-2 w-2 shrink-0">
                    {storeStatus.isOpen ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    )}
                  </span>
                  <span className={cn('truncate', storeStatus.isOpen ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold')}>
                    {storeStatus.text}
                  </span>
                  <span className="text-zinc-500 hidden xs:inline">•</span>
                  <span className="hidden xs:flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {storeStatus.todayHours}
                  </span>
                </div>
              ) : (
                <button
                  key="promo"
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('select-menu-category', { detail: { categoryId: 'promocje' } }));
                    const el = document.getElementById('catalog-active-category') || document.getElementById('catalog') || document.getElementById('menu');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-left min-w-0 truncate animate-in fade-in duration-300 cursor-pointer group"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#e50914]/20 border border-[#e50914]/40 text-[#ff4d58] shrink-0">
                    <Gift className="w-2.5 h-2.5 animate-bounce" />
                  </span>
                  <span className="font-bold text-amber-300 group-hover:text-amber-200 transition-colors truncate">
                    {/* На телефоні: короткий напис, що гарантовано поміщається в 1 рядок */}
                    <span className="inline sm:hidden">
                      {locale === 'pl'
                        ? `Rolka gratis od ${giftPromo.minAmount} zł!`
                        : `Рол безкоштовно від ${giftPromo.minAmount} zł!`}
                    </span>
                    {/* На планшетах та ПК: повна назва страви */}
                    <span className="hidden sm:inline">
                      {giftProduct
                        ? (locale === 'pl'
                          ? `${giftProduct.name.pl} gratis od ${giftPromo.minAmount} zł!`
                          : `${giftProduct.name.uk} безкоштовно від ${giftPromo.minAmount} zł!`)
                        : (locale === 'pl'
                          ? `Rolka gratis od ${giftPromo.minAmount} zł!`
                          : `Рол безкоштовно від ${giftPromo.minAmount} zł!`)}
                    </span>
                  </span>
                </button>
              )}
            </div>

            {/* Праворуч: Контакти (Адреса + Телефон) */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <a
                href={brandTheme.contacts.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors group cursor-pointer text-xs"
                title={locale === 'pl' ? 'Pokaż na Google Maps' : 'Показати на Google Maps'}
              >
                <MapPin className="w-3.5 h-3.5 text-[#e50914] group-hover:scale-110 transition-transform shrink-0" />
                <span className="group-hover:underline underline-offset-2">{brandTheme.contacts.shortAddress}</span>
              </a>

              <span className="text-zinc-600 hidden md:inline">•</span>

              <a
                href={`tel:${brandTheme.contacts.phoneRaw}`}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-[#e50914] transition-colors font-medium text-xs sm:text-sm shrink-0"
              >
                <Phone className="w-3 h-3 text-[#e50914]" />
                <span>{brandTheme.contacts.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Головна панель навігації */}
        <div className="main-nav-bar max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between">
          {/* Логотип */}
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}`}
              onClick={(e) => {
                window.dispatchEvent(new CustomEvent('reset-to-initial-catalog'));
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
                  alt="Maks Sushi Świdnica"
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

          {/* Права частина: Кнопка кабінету клієнта / адміна + Кнопка кошика */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Кнопка кабінету клієнта / адміна (пульсує відповідно до статусу замовлення без крапок) */}
            <button
              onClick={() => {
                if (isAdmin) {
                  router.push('/admin');
                } else {
                  toggleCustomerDrawer();
                }
              }}
              aria-label={mounted ? getUserButtonTitle() : t.customer.loginTitle}
              title={mounted ? getUserButtonTitle() : t.customer.loginTitle}
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
              className={cn(
                'relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border transition-all cursor-pointer select-none active:scale-95 shrink-0',
                mounted ? getUserButtonClassName() : 'bg-[#18181f]/80 border-white/10 hover:border-white/20'
              )}
            >
              <div className="relative flex items-center justify-center">
                <User className={cn('w-4 h-4 transition-all duration-300', mounted ? getUserIconClassName() : 'text-zinc-400')} />
              </div>
            </button>

            {/* Реактивна кнопка кошика */}
            <button
              onClick={toggleCart}
              id="cart-trigger-button"
              aria-label={t.cart.title}
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
              className={`relative flex items-center gap-2 bg-[#e50914] hover:bg-[#f4222d] text-white px-3 py-1.5 sm:px-4 sm:py-2 shadow-md shadow-[#e50914]/25 hover:shadow-[#e50914]/40 active:scale-95 transition-all duration-200 cursor-pointer font-bold text-xs sm:text-sm select-none ${isBumping ? 'scale-110 shadow-lg shadow-[#e50914]/50' : ''
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
