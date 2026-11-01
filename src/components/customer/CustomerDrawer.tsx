'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Phone, 
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin, 
  ShoppingBag, 
  RotateCcw, 
  LogOut, 
  Check, 
  Clock, 
  AlertCircle,
  Globe,
  Home,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useCartStore } from '@/store/useCartStore';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, cn } from '@/lib/utils';
import { Order, OrderAddress } from '@/types';

export function CustomerDrawer() {
  const { locale, t, changeLocale } = useI18n();
  const isOpen = useCustomerStore((s) => s.isOpen);
  const setOpen = useCustomerStore((s) => s.setOpen);
  const customer = useCustomerStore((s) => s.customer);
  const activeTab = useCustomerStore((s) => s.activeTab);
  const setActiveTab = useCustomerStore((s) => s.setActiveTab);
  const registerCustomer = useCustomerStore((s) => s.registerCustomer);
  const loginUser = useCustomerStore((s) => s.loginUser);
  const updateProfile = useCustomerStore((s) => s.updateProfile);
  const logout = useCustomerStore((s) => s.logout);
  const fetchCustomerOrders = useCustomerStore((s) => s.fetchCustomerOrders);

  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const setIsCheckoutOpen = useCartStore((s) => s.setIsCheckoutOpen);

  // Режим авторизації: вхід або реєстрація (за замовчуванням реєстрація для нових клієнтів або вхід)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [showPassword, setShowPassword] = useState(false);

  // Поля входу
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Поля реєстрації
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Стан помилки та завантаження
  const [authError, setAuthError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Поля профілю для редагування
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [floor, setFloor] = useState('');
  const [entryCode, setEntryCode] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Історія замовлень
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(6);

  const ordersContainerRef = useRef<HTMLDivElement | null>(null);
  const orderCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Динамічний розрахунок кількості замовлень на сторінці залежно від висоти екрану
  useEffect(() => {
    const calcPerPage = () => {
      if (typeof window === 'undefined') return;
      const h = window.innerHeight;
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setOrdersPerPage(h < 680 ? 4 : 5);
      } else {
        if (h >= 1050) {
          setOrdersPerPage(10);
        } else if (h >= 880) {
          setOrdersPerPage(8);
        } else if (h >= 740) {
          setOrdersPerPage(6);
        } else {
          setOrdersPerPage(5);
        }
      }
    };

    calcPerPage();
    window.addEventListener('resize', calcPerPage);
    return () => window.removeEventListener('resize', calcPerPage);
  }, []);

  // Розгортання тільки однієї картки за раз + розумне докручування вгору, якщо знизу брак місця
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId((prev) => {
      const willOpen = prev !== orderId;
      if (willOpen) {
        setTimeout(() => {
          const el = orderCardRefs.current[orderId];
          const container = ordersContainerRef.current;
          if (el && container) {
            const elRect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const bottomOverflow = elRect.bottom - containerRect.bottom;
            if (bottomOverflow > -40) {
              el.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }, 120);
        return orderId;
      }
      return null;
    });
  };

  // Синхронізація полів профілю при авторизації
  useEffect(() => {
    if (customer) {
      setProfileName(customer.name || '');
      setProfilePhone(customer.phone || '');
      setStreet(customer.defaultAddress?.street || '');
      setHouse(customer.defaultAddress?.house || '');
      setApartment(customer.defaultAddress?.apartment || '');
      setFloor(customer.defaultAddress?.floor || '');
      setEntryCode(customer.defaultAddress?.entryCode || '');
    }
  }, [customer]);

  // Скидання розкритої картки при відкритті кабінету, зміні вкладок або сторінок
  useEffect(() => {
    if (isOpen) {
      setExpandedOrderId(null);
    }
  }, [isOpen, activeTab, currentPage]);

  // Завантаження замовлень клієнта при відкритті кабінету
  useEffect(() => {
    if (isOpen && customer) {
      setIsLoadingOrders(true);
      fetchCustomerOrders()
        .then((res) => {
          setOrders(res);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  }, [isOpen, customer, fetchCustomerOrders]);

  // Очищення помилок при перемиканні режиму входу/реєстрації
  const toggleAuthMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthError('');
    setAdminNotice('');
  };

  // Обробка реєстрації нового клієнта
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAdminNotice('');

    if (!regPhone.trim()) {
      setAuthError(t.customer.phoneRequired);
      return;
    }
    if (!regName.trim()) {
      setAuthError(t.customer.nameRequired);
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setAuthError(t.customer.passwordTooShort);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerCustomer({
        phone: regPhone,
        name: regName,
        password: regPassword,
        email: regEmail,
      });
      // Очищення полів
      setRegPhone('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } catch (err: any) {
      const msgKey = err?.message as keyof typeof t.customer;
      setAuthError(t.customer[msgKey] || err?.message || 'Błąd rejestracji');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обробка входу (клієнт або адміністратор)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAdminNotice('');

    if (!loginIdentifier.trim()) {
      setAuthError(locale === 'pl' ? 'Podaj numer telefonu lub e-mail' : 'Вкажіть номер телефону або e-mail');
      return;
    }
    if (!loginPassword) {
      setAuthError(locale === 'pl' ? 'Podaj hasło' : 'Введіть пароль');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginUser(loginIdentifier, loginPassword);

      if (res.type === 'admin') {
        // ВХІД АДМІНІСТРАТОРА
        setAdminNotice(t.customer.adminRedirectNotice);
        setTimeout(() => {
          window.location.href = '/admin';
        }, 600);
        return;
      }

      // Успішний вхід клієнта
      setLoginIdentifier('');
      setLoginPassword('');
    } catch (err: any) {
      const msgKey = err?.message as keyof typeof t.customer;
      setAuthError(t.customer[msgKey] || err?.message || 'Błąd logowania');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Збереження оновлень профілю
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    const defaultAddress: OrderAddress = {
      street: street.trim(),
      house: house.trim(),
      apartment: apartment.trim() || undefined,
      floor: floor.trim() || undefined,
      entryCode: entryCode.trim() || undefined,
    };

    await updateProfile({
      name: profileName.trim() || customer.name,
      phone: profilePhone.trim() || customer.phone,
      defaultAddress,
    });

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 2500);
  };

  // Переглянути та замовити повторно: переносимо страви в кошик та відкриваємо кошик
  const handleReviewAndReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    clearCart();
    order.items.forEach((item) => {
      addItem(item.product, item.quantity);
    });
    setOpen(false);
    setCartOpen(true);
  };

  // Форматування часу "HH:mm"
  const formatOrderTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Групування замовлень по даті
  const getDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      const day = d.getDate();
      const month = d.getMonth() + 1;
      const formattedMonth = month < 10 ? '0' + month : month;

      if (isToday) {
        return `${t.customer.today}, ${day}.${formattedMonth}`;
      }
      if (isYesterday) {
        return `${t.customer.yesterday}, ${day}.${formattedMonth}`;
      }
      return `${day}.${formattedMonth}.${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Розрахунок сторінок та пагінації замовлень з урахуванням адаптивної висоти
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Групуємо замовлення поточної сторінки по календарних датах
  const groupedOrders = paginatedOrders.reduce((acc, order) => {
    const dateKey = order.createdAt ? order.createdAt.slice(0, 10) : 'other';
    const existing = acc.find((g) => g.dateKey === dateKey);
    if (existing) {
      existing.orders.push(order);
    } else {
      acc.push({
        dateKey,
        label: getDateLabel(order.createdAt),
        orders: [order],
      });
    }
    return acc;
  }, [] as { dateKey: string; label: string; orders: Order[] }[]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
            <User className="w-4 h-4" />
          </div>
          <span className="font-brand tracking-wider text-base sm:text-lg">
            {customer 
              ? t.customer.myAccount 
              : authMode === 'register' ? t.customer.registerTitle : t.customer.loginTitle}
          </span>
        </div>
      }
    >
      {!customer ? (
        /* 1. БЛОК АВТОРИЗАЦІЇ ТА РЕЄСТРАЦІЇ */
        <div className="space-y-5 pt-1">
          {/* Перемикач Реєстрація / Вхід */}
          <div className="grid grid-cols-2 p-1 bg-[#14141c] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => toggleAuthMode('register')}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                authMode === 'register'
                  ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <span>{t.customer.registerButton}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleAuthMode('login')}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                authMode === 'login'
                  ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <span>{t.customer.loginButton}</span>
            </button>
          </div>

          {/* Банер заголовка */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c1c28] to-[#12121a] border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#e50914]/10 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-base font-black text-white uppercase tracking-wide">
              {authMode === 'register' ? t.customer.registerTitle : t.customer.loginTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {authMode === 'register' ? t.customer.registerSubtitle : t.customer.loginSubtitle}
            </p>
          </div>

          {/* Повідомлення про помилку */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Повідомлення перенаправлення в адмінку */}
          {adminNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 animate-pulse" />
              <span className="font-bold">{adminNotice}</span>
            </div>
          )}

          {/* ФОРМА РЕЄСТРАЦІЇ */}
          {authMode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.customer.phone} *</span>
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+48 000 000 000"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.customer.name} *</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={t.customer.namePlaceholder}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{t.customer.emailOptional}</span>
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="twoj@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.customer.password} *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t.customer.passwordPlaceholder}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className="w-full mt-2 py-3 px-4 bg-[#e50914] hover:bg-[#f4222d] active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-[#e50914]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>{t.customer.registerButton}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => toggleAuthMode('login')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t.customer.hasAccountAlready} <span className="text-[#e50914] font-bold underline">{t.customer.loginButton}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ФОРМА ВХОДУ (КЛІЄНТ АБО АДМІН) */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.customer.identifier} *</span>
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={t.customer.identifierPlaceholder}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.customer.password} *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t.customer.passwordPlaceholder}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className="w-full py-3 px-4 bg-[#e50914] hover:bg-[#f4222d] active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-[#e50914]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>{t.customer.loginButton}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => toggleAuthMode('register')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t.customer.noAccountYet} <span className="text-[#e50914] font-bold underline">{t.customer.registerButton}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* 2. ЗАЛОГІНЕНИЙ КАБІНЕТ КЛІЄНТА */
        <div className="space-y-5">
          {/* Плашка вітання клієнта */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#171722] to-[#12121a] border border-white/10 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#e50914] to-rose-400 p-0.5 shadow-md shadow-[#e50914]/30 shrink-0">
                <div className="w-full h-full bg-[#121218] rounded-full flex items-center justify-center text-white font-black text-sm">
                  {customer.name ? customer.name.slice(0, 1).toUpperCase() : 'M'}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {t.customer.greeting},
                  </span>
                  <span className="text-sm font-black text-white truncate">
                    {customer.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400 font-mono mt-0.5">
                  <Phone className="w-3 h-3 text-[#e50914] shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title={t.customer.logout}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/5 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Перемикач вкладок: Замовлення / Профіль */}
          <div className="grid grid-cols-2 p-1 bg-[#14141c] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                activeTab === 'orders'
                  ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t.customer.ordersTab}</span>
              {orders.length > 0 && (
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                  activeTab === 'orders' ? 'bg-black/40 text-white' : 'bg-white/10 text-zinc-300'
                )}>
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                activeTab === 'profile'
                  ? 'bg-[#e50914] text-white shadow-md shadow-[#e50914]/30'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.customer.profileTab}</span>
            </button>
          </div>

          {/* ВКЛАДКА 1: ІСТОРІЯ ЗАМОВЛЕНЬ (ЗГОРНУТІ ПО ДАТАХ + ПАГІНАЦІЯ) */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {isLoadingOrders ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 mx-auto border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-400">
                    {locale === 'pl' ? 'Ładowanie historii zamówień...' : 'Завантаження історії замовлень...'}
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center bg-[#13131b] border border-white/5 rounded-2xl space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {t.customer.noOrders}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    {t.customer.noOrdersSubtitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#e50914] hover:bg-[#f4222d] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer mt-2"
                  >
                    <span>{t.cart.browseMenu}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Контейнер списку з адаптивною висотою під висоту екрану */}
                  <div
                    ref={ordersContainerRef}
                    className="max-h-[calc(100vh-270px)] sm:max-h-[calc(100vh-260px)] overflow-y-auto pr-1 space-y-4 scrollbar-thin scroll-smooth"
                  >
                    {groupedOrders.map((group) => (
                      <div key={group.dateKey} className="space-y-2">
                        {/* Заголовок групи дати */}
                        <div className="flex items-center gap-2 pt-1 pb-0.5">
                          <Calendar className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                            {group.label}
                          </span>
                          <span className="h-[1px] flex-1 bg-white/10" />
                        </div>

                        {/* Список карток замовлень за цю дату */}
                        <div className="space-y-2">
                          {group.orders.map((order) => {
                            const isPickup = order.deliveryMethod === 'pickup';
                            const isExpanded = expandedOrderId === order.id;
                            const itemsCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

                            return (
                              <div
                                key={order.id}
                                ref={(el) => {
                                  orderCardRefs.current[order.id] = el;
                                }}
                                className="rounded-xl bg-[#14141e] border border-white/10 hover:border-white/20 transition-all overflow-hidden shadow-sm"
                              >
                                {/* Згорнутий компактний рядок (клікабельний) */}
                                <button
                                  type="button"
                                  onClick={() => toggleOrderExpand(order.id)}
                                  className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-white/5 transition-colors select-none"
                                >
                                  {/* Зліва: Номер, час, статус */}
                                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="font-mono font-black text-xs sm:text-sm text-white">
                                      #{order.id}
                                    </span>
                                    <span className="text-[11px] text-zinc-400 font-mono">
                                      {formatOrderTime(order.createdAt)}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-[11px] font-bold tracking-wide shrink-0',
                                        order.status === 'pending' && 'text-[#e50914]',
                                        order.status === 'confirmed' && 'text-amber-400',
                                        order.status === 'preparing' && 'text-amber-400',
                                        order.status === 'in_delivery' && 'text-sky-400',
                                        order.status === 'delivered' && 'text-emerald-400'
                                      )}
                                    >
                                      {order.status === 'pending' && (locale === 'pl' ? 'Niepotwierdzone' : 'Непідтверджено')}
                                      {order.status === 'confirmed' && (locale === 'pl' ? 'Potwierdzone' : 'Підтверджено')}
                                      {order.status === 'preparing' && (locale === 'pl' ? 'W kuchni' : 'Готується')}
                                      {order.status === 'in_delivery' && (isPickup ? (locale === 'pl' ? 'Do odbioru' : 'Готово') : (locale === 'pl' ? 'W drodze' : 'В дорозі'))}
                                      {order.status === 'delivered' && (locale === 'pl' ? 'Dostarczone' : 'Виконано')}
                                    </span>
                                  </div>

                                  {/* Справа: кількість страв, ціна та стрілочка розгортання */}
                                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                    <span className="text-[11px] text-zinc-400 hidden xs:inline">
                                      {itemsCount} {locale === 'pl' ? 'szt.' : 'шт.'}
                                    </span>
                                    <span className="font-black text-xs sm:text-sm text-white">
                                      {formatPrice(order.total, locale)}
                                    </span>
                                    <div className={cn('text-zinc-400 transition-transform duration-200', isExpanded && 'rotate-180')}>
                                      <ChevronDown className="w-4 h-4" />
                                    </div>
                                  </div>
                                </button>

                                {/* Розгорнуті деталі замовлення при кліку */}
                                {isExpanded && (
                                  <div className="p-3.5 pt-2 border-t border-white/5 space-y-3 bg-black/25 animate-in fade-in duration-150">
                                    {/* Перелік страв */}
                                    <div className="space-y-1.5 text-xs text-zinc-300 pt-1">
                                      {(order.items || []).map((item, idx) => {
                                        const name = typeof item.product?.name === 'object'
                                          ? (item.product.name[locale as 'uk' | 'pl'] || item.product.name.uk || item.product.name.pl)
                                          : (item.product?.name || 'Позиція');

                                        return (
                                          <div key={idx} className="flex items-center justify-between gap-2">
                                            <span className="truncate text-zinc-200">
                                              <span className="font-bold text-amber-400 mr-1.5">{item.quantity}×</span>
                                              {name}
                                            </span>
                                            <span className="font-medium text-zinc-400 shrink-0">
                                              {formatPrice((item.product?.price || 0) * item.quantity, locale)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Адреса або самовивіз */}
                                    <div className="text-[11px] text-zinc-400 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <MapPin className="w-3.5 h-3.5 text-[#e50914] shrink-0" />
                                        <span className="truncate">
                                          {isPickup
                                            ? (locale === 'pl' ? 'Odbiór osobisty (Parkowa 8)' : 'Самовивіз (Parkowa 8)')
                                            : `вул. ${order.address?.street || ''} ${order.address?.house || ''}${order.address?.apartment ? `, кв. ${order.address?.apartment}` : ''}`}
                                        </span>
                                      </div>
                                      <span className="font-black text-xs sm:text-sm text-[#e50914] shrink-0">
                                        {formatPrice(order.total, locale)}
                                      </span>
                                    </div>

                                    {/* Кнопка "Переглянути та замовити повторно" */}
                                    <div className="pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleReviewAndReorder(order)}
                                        style={{
                                          clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                                        }}
                                        className="w-full py-2.5 px-3 bg-[#e50914] hover:bg-[#f4222d] active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#e50914]/30"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>{t.customer.reviewAndReorder}</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Блок пагінації (сторінки) */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs select-none">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">{t.customer.prevPage}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={cn(
                              'w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                              currentPage === p
                                ? 'bg-[#e50914] text-white shadow-sm'
                                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span className="hidden xs:inline">{t.customer.nextPage}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ВКЛАДКА 2: НАЛАШТУВАННЯ ПРОФІЛЮ ТА АДРЕСИ */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {isSavedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{t.customer.savedSuccess}</span>
                </div>
              )}

              {/* Особисті дані */}
              <div className="p-4 rounded-xl bg-[#14141c] border border-white/5 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.checkout.contactInfo}</span>
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">{t.customer.name}</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder={t.customer.namePlaceholder}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[#e50914] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">{t.customer.phone}</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[#e50914] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Збережена адреса доставки */}
              <div className="p-4 rounded-xl bg-[#14141c] border border-white/5 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.customer.addressTitle}</span>
                </span>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-zinc-400">{t.customer.street}</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="np. Parkowa"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[#e50914] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400">{t.customer.house}</label>
                      <input
                        type="text"
                        value={house}
                        onChange={(e) => setHouse(e.target.value)}
                        placeholder="np. 8"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[#e50914] outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400">{t.customer.apartment}</label>
                      <input
                        type="text"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        placeholder="np. 14"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[#e50914] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400">{t.customer.floor}</label>
                      <input
                        type="text"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        placeholder="np. 2"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[#e50914] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400">{t.customer.entryCode}</label>
                      <input
                        type="text"
                        value={entryCode}
                        onChange={(e) => setEntryCode(e.target.value)}
                        placeholder="np. 14#"
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-[#e50914] outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Мова інтерфейсу (польська за замовчуванням) */}
              <div className="p-4 rounded-xl bg-[#14141c] border border-white/5 space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#e50914]" />
                  <span>{t.customer.language}</span>
                </span>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      changeLocale('pl');
                      updateProfile({ preferredLanguage: 'pl' });
                    }}
                    className={cn(
                      'py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer',
                      locale === 'pl'
                        ? 'bg-[#e50914] text-white border-[#e50914] shadow-md shadow-[#e50914]/30'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                    )}
                  >
                    <span>Polski</span>
                    {locale === 'pl' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      changeLocale('uk');
                      updateProfile({ preferredLanguage: 'uk' });
                    }}
                    className={cn(
                      'py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer',
                      locale === 'uk'
                        ? 'bg-[#e50914] text-white border-[#e50914] shadow-md shadow-[#e50914]/30'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                    )}
                  >
                    <span>Українська</span>
                    {locale === 'uk' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Кнопка збереження */}
              <button
                type="submit"
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className="w-full py-3 px-4 bg-[#e50914] hover:bg-[#f4222d] text-white font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-[#e50914]/30 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{t.customer.saveChanges}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </Drawer>
  );
}
