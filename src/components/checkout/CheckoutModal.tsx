'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createZodResolver } from '@/lib/zodResolver';
import * as z from 'zod';
import confetti from 'canvas-confetti';
import {
  Truck,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Check,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/useCartStore';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useI18n } from '@/lib/i18nContext';
import { createOrder } from '@/lib/supabase';
import { brandTheme } from '@/config/theme';
import { formatPrice, cn } from '@/lib/utils';
import { DeliveryMethod, PaymentMethod, Order, OrderAddress } from '@/types';

// Схема валідації Zod
const checkoutSchema = z.object({
  name: z.string().min(2, 'Імʼя занадто коротке'),
  phone: z.string().min(7, 'Введіть коректний номер телефону'),
  deliveryMethod: z.enum(['delivery', 'pickup']),
  street: z.string().optional(),
  house: z.string().optional(),
  apartment: z.string().optional(),
  floor: z.string().optional(),
  entryCode: z.string().optional(),
  paymentMethod: z.enum(['blik_online', 'card_courier', 'cash']),
  changeFrom: z.string().optional(),
  timingType: z.enum(['asap', 'scheduled']).default('asap'),
  scheduledTime: z.string().optional(),
  comment: z.string().optional(),
}).refine(
  (data) => {
    if (data.deliveryMethod === 'delivery') {
      return Boolean(data.street && data.street.trim().length > 0);
    }
    return true;
  },
  {
    message: 'Вкажіть вулицю доставки',
    path: ['street'],
  }
).refine(
  (data) => {
    if (data.deliveryMethod === 'delivery') {
      return Boolean(data.house && data.house.trim().length > 0);
    }
    return true;
  },
  {
    message: 'Вкажіть номер будинку',
    path: ['house'],
  }
);

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutModal() {
  const { locale, t } = useI18n();
  const isCheckoutOpen = useCartStore((s) => s.isCheckoutOpen);
  const setIsCheckoutOpen = useCartStore((s) => s.setIsCheckoutOpen);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const personsCount = useCartStore((s) => s.personsCount);
  const prepWaitTimeMinutes = useCartStore((s) => s.prepWaitTimeMinutes) || 40;
  const customer = useCustomerStore((s) => s.customer);
  const updateProfile = useCustomerStore((s) => s.updateProfile);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const isPickup = deliveryMethod === 'pickup';
  const subtotal = useCartStore((s) => s.getSubtotal)();
  const deliveryFee = useCartStore((s) => s.getDeliveryFee)(isPickup);
  const total = useCartStore((s) => s.getTotal)(isPickup);

  // Розрахунок обмежень для вибору часу:
  // Якщо на годиннику більше ніж час закриття мінус час виконання (prepWaitTimeMinutes + 15 хв для доставки),
  // прийом замовлень на сьогодні блокується та пропонується вибір на завтра.
  const getSchedulingBounds = () => {
    const requiredWait = isPickup ? prepWaitTimeMinutes : prepWaitTimeMinutes + 15;
    const now = new Date();
    const day = now.getDay();
    const todayClosingHour = (day === 5 || day === 6) ? 22 : 21; // Пт, Сб до 22:00, інші дні до 21:00

    // Час закриття закладу сьогодні в мілісекундах
    const todayClosingMs = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      todayClosingHour,
      0,
      0,
      0
    ).getTime();

    // Дедлайн прийому замовлень на сьогодні: якщо поточний час + очікування перевищує час закриття
    const isTodayCutoffPassed = (now.getTime() + requiredWait * 60000) >= todayClosingMs;

    // Розрахунок мінімального часу для замовлення на сьогодні
    const minDate = new Date(now.getTime() + requiredWait * 60000);
    let targetHour = Math.max(12, minDate.getHours()); // ресторан відчиняється о 12:00
    let roundedMins = Math.ceil(minDate.getMinutes() / 5) * 5;
    if (roundedMins >= 60) {
      roundedMins = 0;
      targetHour += 1;
    }

    const todayMinTimeString = `${String(Math.min(todayClosingHour, targetHour)).padStart(2, '0')}:${String(roundedMins).padStart(2, '0')}`;
    const todayMaxTimeString = `${String(todayClosingHour).padStart(2, '0')}:00`;

    // Параметри для завтра: заклад відкривається о 12:00, отже найраніший час замовлення — 12:00 + час виконання (з адмінки)
    const tomorrowDay = (day + 1) % 7;
    const tomorrowClosingHour = (tomorrowDay === 5 || tomorrowDay === 6) ? 22 : 21;
    let tomorrowHour = 12;
    let tomorrowMins = Math.ceil(requiredWait / 5) * 5;
    if (tomorrowMins >= 60) {
      tomorrowHour += Math.floor(tomorrowMins / 60);
      tomorrowMins = tomorrowMins % 60;
    }
    const tomorrowMinTimeString = `${String(tomorrowHour).padStart(2, '0')}:${String(tomorrowMins).padStart(2, '0')}`;
    const tomorrowMaxTimeString = `${String(tomorrowClosingHour).padStart(2, '0')}:00`;

    return {
      requiredWait,
      todayClosingHour,
      isTodayCutoffPassed,
      todayMinTimeString,
      todayMaxTimeString,
      tomorrowClosingHour,
      tomorrowMinTimeString,
      tomorrowMaxTimeString,
    };
  };

  const bounds = getSchedulingBounds();
  const [scheduledDate, setScheduledDate] = useState<'today' | 'tomorrow'>(() => {
    return bounds.isTodayCutoffPassed ? 'tomorrow' : 'today';
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: createZodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      phone: '',
      deliveryMethod: 'delivery',
      street: '',
      house: '',
      apartment: '',
      floor: '',
      entryCode: '',
      paymentMethod: 'blik_online',
      changeFrom: '',
      timingType: 'asap',
      scheduledTime: '',
      comment: '',
    },
  });

  const selectedPayment = watch('paymentMethod');
  const selectedTiming = watch('timingType') || 'asap';
  const selectedScheduledTime = watch('scheduledTime') || '';

  // Автоматичне перемикання на "Завтра", якщо час прийому замовлень на сьогодні вичерпано
  React.useEffect(() => {
    if (bounds.isTodayCutoffPassed) {
      setScheduledDate('tomorrow');
      if (selectedTiming === 'asap') {
        setValue('timingType', 'scheduled');
        setValue('scheduledTime', bounds.tomorrowMinTimeString);
      }
    }
  }, [bounds.isTodayCutoffPassed, isPickup]);

  // Корекція часу, якщо обрано значення менше ніж мінімально дозволений час для обраного дня
  React.useEffect(() => {
    const minTime = scheduledDate === 'tomorrow' ? bounds.tomorrowMinTimeString : bounds.todayMinTimeString;
    if (selectedScheduledTime && selectedScheduledTime < minTime) {
      setValue('scheduledTime', minTime);
    }
  }, [scheduledDate, bounds.tomorrowMinTimeString, bounds.todayMinTimeString, selectedScheduledTime]);

  // Автоматичне автозаповнення контактів та адреси зі збереженого профілю клієнта
  React.useEffect(() => {
    if (isCheckoutOpen && customer) {
      if (customer.name) setValue('name', customer.name);
      if (customer.phone) setValue('phone', customer.phone);
      if (customer.defaultAddress?.street) setValue('street', customer.defaultAddress.street);
      if (customer.defaultAddress?.house) setValue('house', customer.defaultAddress.house);
      if (customer.defaultAddress?.apartment) setValue('apartment', customer.defaultAddress.apartment);
      if (customer.defaultAddress?.floor) setValue('floor', customer.defaultAddress.floor);
      if (customer.defaultAddress?.entryCode) setValue('entryCode', customer.defaultAddress.entryCode);
    }
  }, [isCheckoutOpen, customer, setValue]);

  const onSubmit = async (values: CheckoutFormValues) => {
    // Якщо прийом замовлень на сьогодні завершено, забороняємо замовлення ASAP
    if (bounds.isTodayCutoffPassed && values.timingType === 'asap') {
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `MS-${Math.floor(100000 + Math.random() * 900000)}`;

      const finalScheduledTime = values.timingType === 'scheduled'
        ? (scheduledDate === 'tomorrow'
            ? (locale === 'pl'
                ? `Jutro, ${values.scheduledTime || bounds.tomorrowMinTimeString}`
                : `Завтра, ${values.scheduledTime || bounds.tomorrowMinTimeString}`)
            : (values.scheduledTime || bounds.todayMinTimeString))
        : undefined;

      const orderData: Order = {
        id: orderId,
        name: values.name,
        phone: values.phone,
        deliveryMethod: values.deliveryMethod,
        address:
          values.deliveryMethod === 'delivery'
            ? {
                street: values.street || '',
                house: values.house || '',
                apartment: values.apartment,
                floor: values.floor,
                entryCode: values.entryCode,
              }
            : undefined,
        paymentMethod: values.paymentMethod,
        changeFrom: values.changeFrom,
        comment: values.comment,
        personsCount,
        timingType: values.timingType,
        scheduledDate: values.timingType === 'scheduled' ? scheduledDate : undefined,
        scheduledTime: finalScheduledTime,
        items,
        subtotal,
        deliveryFee,
        total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await createOrder(orderData);

      // Запам'ятовуємо або оновлюємо дані клієнта та адресу для майбутніх замовлень
      try {
        const addressObj: OrderAddress | undefined = values.deliveryMethod === 'delivery' && values.street ? {
          street: values.street,
          house: values.house || '',
          apartment: values.apartment || undefined,
          floor: values.floor || undefined,
          entryCode: values.entryCode || undefined,
        } : (customer?.defaultAddress);

        if (customer) {
          updateProfile({
            name: values.name || customer.name,
            phone: values.phone || customer.phone,
            defaultAddress: addressObj,
          });
        } else {
          // Якщо клієнт ще не був залогінений, зберігаємо профіль для миттєвого впізнання при наступному візиті
          const autoProfile = {
            id: `cust_${Date.now()}`,
            name: values.name,
            phone: values.phone,
            defaultAddress: addressObj,
            preferredLanguage: locale as 'pl' | 'uk',
            savedAt: new Date().toISOString(),
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('max-sushi-customer', JSON.stringify(autoProfile));
          }
        }
      } catch (e) {
        console.warn('Customer auto-save notice:', e);
      }

      // Запуск феєрверку конфеті
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e50914', '#eab308', '#ffffff', '#22c55e'],
        });
      } catch {
        // ігноруємо помилки confetti на деяких оточеннях
      }

      setCreatedOrder(orderData);
      clearCart();
    } catch (error) {
      console.error('Order checkout error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    if (createdOrder) {
      setCreatedOrder(null);
      reset();
    }
  };

  return (
    <Dialog
      isOpen={isCheckoutOpen}
      onClose={handleClose}
      title={
        createdOrder ? (
          <span className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            {t.checkout.successTitle}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#e50914]" />
            {t.checkout.title}
          </span>
        )
      }
      maxWidth="max-w-2xl"
    >
      {createdOrder ? (
        /* Екран успіху після оформлення замовлення */
        <div className="py-6 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/20 mx-auto animate-in zoom-in">
            <Check className="w-10 h-10 stroke-[3] text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">
              {t.checkout.successTitle}
            </h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
              {t.checkout.successMessage}
            </p>
          </div>

          {/* Інформаційна картка замовлення у формі клинка */}
          <div
            style={{
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
            }}
            className="max-w-md mx-auto p-5 bg-[#171722] border border-white/10 text-left space-y-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">{t.checkout.orderNumber}</span>
              <span className="text-sm font-black text-[#e50914]">{createdOrder.id}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">{t.checkout.deliveryMethod}</span>
              <span className="text-xs font-bold text-white">
                {createdOrder.deliveryMethod === 'delivery'
                  ? t.checkout.delivery
                  : `${t.checkout.pickup} (-${brandTheme.delivery.pickupDiscountPercent}%)`}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs text-zinc-400">
                {createdOrder.timingType === 'scheduled' && createdOrder.scheduledTime
                  ? (createdOrder.deliveryMethod === 'pickup'
                      ? (locale === 'pl' ? 'Zaplanowany odbiór' : 'Запланований самовивіз')
                      : (locale === 'pl' ? 'Zaplanowana dostawa' : 'Запланована доставка'))
                  : (createdOrder.deliveryMethod === 'pickup'
                      ? ((t.checkout as any).estimatedPickupTime || (locale === 'pl' ? 'Czas gotowości do odbioru' : 'Час готовності замовлення'))
                      : (t.checkout.estimatedTime || (locale === 'pl' ? 'Czas dostawy' : 'Час доставки')))}
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {createdOrder.timingType === 'scheduled' && createdOrder.scheduledTime
                  ? `${locale === 'pl' ? 'na godz.' : 'на'} ${createdOrder.scheduledTime}`
                  : (createdOrder.deliveryMethod === 'delivery'
                      ? `~${prepWaitTimeMinutes + 15} ${locale === 'pl' ? 'min' : 'хв'}`
                      : `~${prepWaitTimeMinutes} ${locale === 'pl' ? 'min' : 'хв'}`)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 text-base font-extrabold text-white">
              <span>{t.checkout.orderSummary}</span>
              <span className="text-[#e50914]">{formatPrice(createdOrder.total, locale)}</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
            className="w-full max-w-md py-3.5 px-6 bg-[#e50914] hover:bg-[#f4222d] text-white font-black text-sm shadow-lg shadow-[#e50914]/30 hover:shadow-[#e50914]/50 transition-all cursor-pointer select-none"
          >
            {t.checkout.backToMenu}
          </button>
        </div>
      ) : (
        /* Форма замовлення */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4 max-w-full">
          {/* Вибір: Доставка чи Самовивіз у формі клинка */}
          <div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeliveryMethod('delivery');
                  setValue('deliveryMethod', 'delivery');
                }}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 border text-center transition-all cursor-pointer select-none ${
                  deliveryMethod === 'delivery'
                    ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                    : 'bg-[#181822] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Truck className={`w-4 h-4 shrink-0 ${deliveryMethod === 'delivery' ? 'text-[#e50914]' : ''}`} />
                <div className="text-left">
                  <div className="font-bold text-xs sm:text-sm leading-none">{t.checkout.delivery}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">~{prepWaitTimeMinutes + 15} {locale === 'pl' ? 'min' : 'хв'}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeliveryMethod('pickup');
                  setValue('deliveryMethod', 'pickup');
                }}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 border text-center transition-all cursor-pointer select-none ${
                  deliveryMethod === 'pickup'
                    ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                    : 'bg-[#181822] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <Store className={`w-4 h-4 shrink-0 ${deliveryMethod === 'pickup' ? 'text-[#e50914]' : ''}`} />
                <div className="text-left">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm leading-none">
                    <span>{t.checkout.pickup}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-black">-{brandTheme.delivery.pickupDiscountPercent}%</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">~{prepWaitTimeMinutes} {locale === 'pl' ? 'min' : 'хв'}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Контактні дані: компактні інпути */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <Input
              label={t.checkout.name}
              id="customer-name"
              placeholder={t.checkout.namePlaceholder}
              error={errors.name?.message}
              className="h-9 sm:h-9.5 text-xs sm:text-sm"
              {...register('name')}
            />
            <Input
              label={t.checkout.phone}
              id="customer-phone"
              placeholder={t.checkout.phonePlaceholder}
              error={errors.phone?.message}
              className="h-9 sm:h-9.5 text-xs sm:text-sm"
              {...register('phone')}
            />
          </div>

          {/* Адреса доставки (тільки при доставці) */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-2 p-2.5 sm:p-3 rounded-xl bg-[#161620] border border-white/5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#e50914]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  {t.checkout.addressTitle} ({brandTheme.contacts.city})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <Input
                    label={t.checkout.street}
                    id="order-street"
                    placeholder={t.checkout.streetPlaceholder}
                    error={errors.street?.message}
                    className="h-8.5 sm:h-9 text-xs"
                    {...register('street')}
                  />
                </div>
                <div>
                  <Input
                    label={t.checkout.house}
                    id="order-house"
                    placeholder={t.checkout.housePlaceholder}
                    error={errors.house?.message}
                    className="h-8.5 sm:h-9 text-xs"
                    {...register('house')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 mb-1 leading-tight h-8 sm:h-7 flex items-end">
                    {t.checkout.apartment}
                  </span>
                  <Input
                    id="order-apartment"
                    placeholder={t.checkout.apartmentPlaceholder}
                    className="h-8.5 text-xs"
                    {...register('apartment')}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 mb-1 leading-tight h-8 sm:h-7 flex items-end">
                    {t.checkout.floor}
                  </span>
                  <Input
                    id="order-floor"
                    placeholder={t.checkout.floorPlaceholder}
                    className="h-8.5 text-xs"
                    {...register('floor')}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 mb-1 leading-tight h-8 sm:h-7 flex items-end">
                    {t.checkout.entryCode}
                  </span>
                  <Input
                    id="order-entry-code"
                    placeholder={t.checkout.entryCodePlaceholder}
                    className="h-8.5 text-xs"
                    {...register('entryCode')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Спосіб оплати: рівно 2 опції у формі клинка (залежно від типу доставки) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              {t.checkout.paymentTitle}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {/* 1. Опція BLIK / Karta (і кур'єру, і особисто) */}
              <label
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className={`flex items-center justify-start gap-2.5 px-3 py-2.5 sm:p-3 border cursor-pointer transition-all select-none ${
                  selectedPayment === 'blik_online' || selectedPayment === 'card_courier'
                    ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                    : 'bg-[#171720] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  value="blik_online"
                  className="sr-only"
                  {...register('paymentMethod')}
                />
                <CreditCard className="w-4 h-4 text-[#e50914] shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">BLIK / Karta</span>
              </label>

              {/* 2. Опція Gotówka (і кур'єру, і особисто) */}
              <label
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className={`flex items-center justify-start gap-2.5 px-3 py-2.5 sm:p-3 border cursor-pointer transition-all select-none ${
                  selectedPayment === 'cash'
                    ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                    : 'bg-[#171720] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  value="cash"
                  className="sr-only"
                  {...register('paymentMethod')}
                />
                <Banknote className="w-4 h-4 text-[#e50914] shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">
                  {locale === 'pl' ? 'Gotówka' : 'Готівка'}
                </span>
              </label>
            </div>

            {selectedPayment === 'cash' && (
              <div className="mt-1.5">
                <Input
                  label={t.checkout.changeFrom}
                  id="order-change-from"
                  placeholder={t.checkout.changeFromPlaceholder}
                  className="h-8.5 text-xs"
                  {...register('changeFrom')}
                />
              </div>
            )}
          </div>

          {/* Час виконання: Якнайшвидше АБО На обраний час */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#e50914]" />
              <span>
                {isPickup
                  ? (locale === 'pl' ? 'Czas odbioru zamówienia' : 'Коли плануєте забрати?')
                  : (locale === 'pl' ? 'Czas doręczenia zamówienia' : 'Коли доставити замовлення?')}
              </span>
            </span>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Опція 1: Якнайшвидше */}
              <button
                type="button"
                disabled={bounds.isTodayCutoffPassed}
                onClick={() => {
                  setValue('timingType', 'asap');
                  setValue('scheduledTime', '');
                }}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className={`flex flex-col items-start justify-center p-2.5 sm:p-3 border text-left cursor-pointer transition-all select-none ${
                  bounds.isTodayCutoffPassed
                    ? 'opacity-40 cursor-not-allowed bg-zinc-900/40 border-white/5'
                    : selectedTiming === 'asap'
                      ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                      : 'bg-[#171720] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white">
                  <span>{locale === 'pl' ? 'Jak najszybciej' : 'Якнайшвидше'}</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  {bounds.isTodayCutoffPassed
                    ? (locale === 'pl' ? 'Niedostępne dzisiaj' : 'Недоступно сьогодні')
                    : isPickup
                      ? `~${prepWaitTimeMinutes} ${locale === 'pl' ? 'min' : 'хв'}`
                      : `~${prepWaitTimeMinutes + 15} ${locale === 'pl' ? 'min' : 'хв'}`}
                </span>
              </button>

              {/* Опція 2: На обраний час */}
              <button
                type="button"
                onClick={() => {
                  setValue('timingType', 'scheduled');
                  if (bounds.isTodayCutoffPassed) {
                    setScheduledDate('tomorrow');
                    setValue('scheduledTime', bounds.tomorrowMinTimeString);
                  } else {
                    if (!watch('scheduledTime')) {
                      setValue('scheduledTime', bounds.todayMinTimeString);
                    }
                  }
                }}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className={`flex flex-col items-start justify-center p-2.5 sm:p-3 border text-left cursor-pointer transition-all select-none ${
                  selectedTiming === 'scheduled'
                    ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                    : 'bg-[#171720] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {bounds.isTodayCutoffPassed
                      ? (locale === 'pl' ? 'Zamówienie na jutro' : 'Замовлення на завтра')
                      : (locale === 'pl' ? 'Na wybraną godzinę' : 'На обраний час')}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  {locale === 'pl' ? 'Wcześniejsze zamówienie' : 'Попереднє замовлення'}
                </span>
              </button>
            </div>

            {/* Сповіщення про завершення прийому на сьогодні */}
            {bounds.isTodayCutoffPassed && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {locale === 'pl'
                    ? `Przyjmowanie zamówień na dzisiaj zakończone (do zamknięcia o ${bounds.todayClosingHour}:00 zostało mniej niż ${bounds.requiredWait} min). Możesz złożyć zamówienie na jutro!`
                    : `Прийом замовлень на сьогодні завершено (до закриття о ${bounds.todayClosingHour}:00 залишилось менше ${bounds.requiredWait} хв). Ви можете оформити замовлення на завтра!`}
                </span>
              </div>
            )}

            {/* Поле вводу часу при виборі "На обраний час" */}
            {selectedTiming === 'scheduled' && (
              <div className="p-3 bg-[#13131c] border border-amber-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                {/* Перемикач дня: Сьогодні / Завтра */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {locale === 'pl' ? 'Dzień realizacji:' : 'День замовлення:'}
                  </span>
                  <div className="flex items-center gap-1 bg-[#0a0a0f] p-0.5 rounded-lg border border-white/10">
                    {!bounds.isTodayCutoffPassed && (
                      <button
                        type="button"
                        onClick={() => {
                          setScheduledDate('today');
                          setValue('scheduledTime', bounds.todayMinTimeString);
                        }}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer',
                          scheduledDate === 'today'
                            ? 'bg-[#e50914] text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        )}
                      >
                        {locale === 'pl' ? 'Dzisiaj' : 'Сьогодні'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledDate('tomorrow');
                        setValue('scheduledTime', bounds.tomorrowMinTimeString);
                      }}
                      className={cn(
                        'px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer',
                        scheduledDate === 'tomorrow'
                          ? 'bg-[#e50914] text-white shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      {locale === 'pl' ? 'Jutro' : 'Завтра'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <label htmlFor="order-scheduled-time" className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5 self-start sm:self-center">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {scheduledDate === 'tomorrow'
                        ? (isPickup
                            ? (locale === 'pl' ? 'Godzina odbioru jutro:' : 'Час самовивозу на завтра:')
                            : (locale === 'pl' ? 'Godzina dostawy jutro:' : 'Час доставки на завтра:'))
                        : (isPickup
                            ? (locale === 'pl' ? 'Podaj godzinę odbioru:' : 'Вкажіть час самовивозу:')
                            : (locale === 'pl' ? 'Podaj godzinę dostawy:' : 'Вкажіть час доставки:'))}
                    </span>
                  </label>
                  {(() => {
                    const minTime = scheduledDate === 'tomorrow'
                      ? bounds.tomorrowMinTimeString
                      : bounds.todayMinTimeString;
                    const maxTime = scheduledDate === 'tomorrow'
                      ? bounds.tomorrowMaxTimeString
                      : bounds.todayMaxTimeString;

                    return (
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <div
                          onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input) {
                              input.focus();
                              try {
                                (input as any).showPicker?.();
                              } catch {}
                            }
                          }}
                          className="w-full sm:w-36 relative cursor-pointer"
                        >
                          <input
                            key={`${scheduledDate}-${minTime}`}
                            id="order-scheduled-time"
                            type="time"
                            min={minTime}
                            max={maxTime}
                            step="300"
                            value={selectedScheduledTime || minTime}
                            required={selectedTiming === 'scheduled'}
                            onKeyDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              try {
                                (e.currentTarget as any).showPicker?.();
                              } catch {}
                            }}
                            style={{
                              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                            }}
                            className="w-full bg-[#0a0a0f] border border-amber-500/40 text-white font-mono font-bold text-sm px-3 py-1.5 focus:border-amber-400 focus:outline-none cursor-pointer select-none"
                            {...register('scheduledTime', {
                              required: selectedTiming === 'scheduled',
                              onChange: (e) => {
                                setValue('scheduledTime', e.target.value, { shouldValidate: true });
                              },
                              validate: (val) => {
                                if (selectedTiming !== 'scheduled' || !val) return true;
                                if (val < minTime) {
                                  if (scheduledDate === 'tomorrow') {
                                    return locale === 'pl'
                                      ? `Najwcześniejsza godzina: ${minTime}`
                                      : `Найраніший час замовлення: ${minTime}`;
                                  }
                                  return locale === 'pl'
                                    ? `Minimalny czas to ${minTime} (min. ${bounds.requiredWait} min)`
                                    : `Мінімальний час: ${minTime} (не менше ${bounds.requiredWait} хв)`;
                                }
                                if (val > maxTime) {
                                  return locale === 'pl'
                                    ? `Lokal czynny do ${maxTime}`
                                    : `Заклад зачиняється о ${maxTime}`;
                                }
                                return true;
                              },
                            })}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {scheduledDate === 'tomorrow'
                            ? (locale === 'pl'
                                ? `Jutro od ${minTime} do ${maxTime}`
                                : `Завтра з ${minTime} до ${maxTime}`)
                            : (locale === 'pl'
                                ? `Najwcześniej: ${minTime}`
                                : `Найраніше: ${minTime}`)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                {errors.scheduledTime && (
                  <p className="text-xs text-rose-400 font-semibold">
                    {errors.scheduledTime.message}
                  </p>
                )}
                <p className="text-[10px] text-zinc-400">
                  {scheduledDate === 'tomorrow'
                    ? (isPickup
                        ? (locale === 'pl' ? 'Przygotujemy zamówienie na jutro na wskazaną godzinę.' : 'Ми приготуємо ваші роли завтра точно на вказаний час.')
                        : (locale === 'pl' ? 'Kurier dowiezie zamówienie jutro na wskazaną godzinę.' : 'Курʼєр доставить замовлення завтра на обраний час.'))
                    : (isPickup
                        ? (locale === 'pl' ? `Przygotujemy Twoje rolki точно na tę godzinę (minimum ${prepWaitTimeMinutes} min).` : `Ми приготуємо ваші роли точно на вказаний час (не менше ${prepWaitTimeMinutes} хв).`)
                        : (locale === 'pl' ? `Kurier dowiezie zamówienie na wskazaną godzinę (minimum ${prepWaitTimeMinutes + 15} min).` : `Курʼєр доставить замовлення на обраний час (не менше ${prepWaitTimeMinutes + 15} хв).`))}
                </p>
              </div>
            )}
          </div>

          {/* Коментар: 1 рядок */}
          <div>
            <input
              id="order-comment"
              type="text"
              placeholder={t.checkout.commentPlaceholder}
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              }}
              className="w-full border border-zinc-800 bg-[#0d0d12] px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-[#e50914] focus:outline-none focus:ring-1 focus:ring-[#e50914]"
              {...register('comment')}
            />
          </div>

          {/* Підсумок замовлення та кнопка відправки у формі клинка */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-zinc-400 font-medium">{t.cart.total}:</span>
              <span className="text-lg sm:text-xl font-black text-[#e50914]">{formatPrice(total, locale)}</span>
              {isPickup && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {t.checkout.pickupDiscount}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0 || (bounds.isTodayCutoffPassed && selectedTiming === 'asap')}
              id="submit-order-button"
              style={{
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              }}
              className="flex-1 sm:max-w-xs flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 text-white font-black text-sm shadow-md shadow-[#e50914]/30 hover:shadow-[#e50914]/50 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer select-none"
            >
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t.checkout.submitOrder}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
