'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  RotateCcw, 
  Edit3, 
  LogOut, 
  Check, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Globe,
  Home,
  CheckCircle2,
  Sparkles
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
  const login = useCustomerStore((s) => s.login);
  const updateProfile = useCustomerStore((s) => s.updateProfile);
  const logout = useCustomerStore((s) => s.logout);
  const fetchCustomerOrders = useCustomerStore((s) => s.fetchCustomerOrders);

  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const setIsCheckoutOpen = useCartStore((s) => s.setIsCheckoutOpen);

  // Стан для форми логіну
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Стан для форми профілю
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [floor, setFloor] = useState('');
  const [entryCode, setEntryCode] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Стан замовлень клієнта
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  // Синхронізація даних форми при зміні клієнта
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

  // Завантаження історії замовлень при відкритті штори або зміні вкладки
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

  // Швидкий вхід
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanPhone = loginPhone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      setLoginError(locale === 'pl' ? 'Podaj prawidłowy numer telefonu' : 'Вкажіть коректний номер телефону');
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(loginPhone, loginName);
      setLoginPhone('');
      setLoginName('');
    } catch (err: any) {
      setLoginError(err?.message || 'Błąd logowania');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Збереження оновлень профілю та адреси
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

  // 1. Повторити замовлення: додає позиції в кошик та відразу відкриває Checkout
  const handleDirectReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;

    clearCart();
    order.items.forEach((item) => {
      addItem(item.product, item.quantity);
    });

    setOpen(false);
    setIsCheckoutOpen(true);
  };

  // 2. Відредагувати і замовити: додає позиції в кошик та відкриває CartDrawer
  const handleEditAndReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;

    clearCart();
    order.items.forEach((item) => {
      addItem(item.product, item.quantity);
    });

    setOpen(false);
    setCartOpen(true);
  };

  // Форматування дати замовлення
  const formatOrderDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month < 10 ? '0' + month : month}, ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

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
            {customer ? t.customer.myAccount : t.customer.loginTitle}
          </span>
        </div>
      }
    >
      {!customer ? (
        /* ВХІД / РЕЄСТРАЦІЯ ЗА ТЕЛЕФОНОМ */
        <div className="space-y-6 pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c1c28] to-[#12121a] border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#e50914]/10 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-base font-black text-white uppercase tracking-wide">
              {t.customer.loginTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {t.customer.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#e50914]" />
                <span>{t.customer.phone} *</span>
              </label>
              <input
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="+48 000 000 000"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#e50914]" />
                <span>{t.customer.name}</span>
              </label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder={t.customer.namePlaceholder}
                className="w-full px-3.5 py-3 rounded-xl bg-[#14141c] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-white text-sm placeholder:text-zinc-600 outline-hidden transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
              className="w-full py-3.5 px-4 bg-[#e50914] hover:bg-[#f4222d] active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-[#e50914]/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>{t.customer.loginButton}</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* ЗАЛОГІНЕНИЙ КАБІНЕТ КЛІЄНТА */
        <div className="space-y-5">
          {/* Плашка вітання користувача */}
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

          {/* ВКЛАДКА 1: ІСТОРІЯ ЗАМОВЛЕНЬ */}
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
                <div className="space-y-3.5">
                  {orders.map((order) => {
                    const isPickup = order.deliveryMethod === 'pickup';
                    const itemsCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl bg-[#14141e] border border-white/10 hover:border-white/20 transition-all space-y-3 shadow-md"
                      >
                        {/* Верхній рядок картки замовлення: Номер, дата, статус */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs sm:text-sm text-white">
                              #{order.id}
                            </span>
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {formatOrderDate(order.createdAt)}
                            </span>
                          </div>

                          {/* Статус замовлення */}
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                              order.status === 'pending' && 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                              order.status === 'confirmed' && 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                              order.status === 'preparing' && 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                              order.status === 'in_delivery' && 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                              order.status === 'delivered' && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            )}
                          >
                            {order.status === 'pending' && (locale === 'pl' ? 'Nowe' : 'Нове')}
                            {order.status === 'confirmed' && (locale === 'pl' ? 'Potwierdzone' : 'Підтверджено')}
                            {order.status === 'preparing' && (locale === 'pl' ? 'W kuchni' : 'Готується')}
                            {order.status === 'in_delivery' && (isPickup ? (locale === 'pl' ? 'Do odbioru' : 'Готово до видачі') : (locale === 'pl' ? 'W drodze' : 'В дорозі'))}
                            {order.status === 'delivered' && (locale === 'pl' ? 'Dostarczone' : 'Виконано')}
                          </span>
                        </div>

                        {/* Список страв замовлення */}
                        <div className="space-y-1.5 text-xs text-zinc-300">
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
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-white/5">
                          <MapPin className="w-3 h-3 text-[#e50914] shrink-0" />
                          <span className="truncate">
                            {isPickup
                              ? (locale === 'pl' ? 'Odbiór osobisty (Parkowa 8)' : 'Самовивіз (Parkowa 8)')
                              : `вул. ${order.address?.street || ''} ${order.address?.house || ''}${order.address?.apartment ? `, кв. ${order.address?.apartment}` : ''}`}
                          </span>
                          <span className="ml-auto font-black text-sm text-white">
                            {formatPrice(order.total, locale)}
                          </span>
                        </div>

                        {/* Кнопки дій: 1) Повторити замовлення 2) Редагувати і замовити */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleEditAndReorder(order)}
                            className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title={t.customer.editAndReorder}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span className="truncate">{t.customer.editAndReorder}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDirectReorder(order)}
                            className="py-2 px-2.5 rounded-xl bg-[#e50914] hover:bg-[#f4222d] active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#e50914]/30"
                            title={t.customer.reorder}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="truncate">{t.customer.reorder}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                    <span>Polski (domyślny)</span>
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
