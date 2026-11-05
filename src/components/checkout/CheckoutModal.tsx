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
  AlertCircle,
  Zap,
  Navigation,
  Loader2,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/useCartStore';
import { useCustomerStore } from '@/store/useCustomerStore';
import { useI18n } from '@/lib/i18nContext';
import { createOrder } from '@/lib/supabase';
import { brandTheme } from '@/config/theme';
import { formatPrice, cn } from '@/lib/utils';
import { DeliveryMethod, PaymentMethod, Order, OrderAddress, DeliveryZoneId } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  maskName,
  maskPhone,
  getRawPhoneDigits,
  maskCity,
  maskStreet,
  maskHouse,
  maskApartment,
  maskFloor,
  maskEntryCode,
  maskChangeFrom
} from '@/lib/inputMasks';

// Населені пункти Свідницького повіту для розумного автокомпліту та підказок
const NEARBY_TOWNS = [
  'Pszenno',
  'Witoszów Dolny',
  'Witoszów Górny',
  'Bystrzyca Dolna',
  'Bystrzyca Górna',
  'Słotwina',
  'Komorów',
  'Mokrzeszów',
  'Boleścin',
  'Grodziszcze',
  'Panków',
  'Zawiszów',
  'Jagodnik',
  'Miłochów',
  'Niegoszów',
  'Lutomia Dolna',
  'Lutomia Górna',
  'Burkatów',
  'Makowice',
  'Opoczka',
  'Jakubów',
  'Wilków',
  'Krzczonów',
  'Gogołów',
  'Wiśniowa',
  'Sulisławice',
  'Marcinowice',
  'Jaworzyna Śląska',
  'Żarów',
  'Świebodzice',
  'Strzegom',
  'Dzierżoniów',
];

// Популярні вулиці Свідниці та околиць для розумного автокомпліту
const POPULAR_STREETS = [
  '1 Maja',
  '3 Maja',
  'Akacjowa',
  'Armii Krajowej',
  'Batalionów Chłopskich',
  'Biała',
  'Boczna',
  'Bohaterów Getta',
  'Bolesława Chrobrego',
  'Bolesława Krzywoustego',
  'Bratobójcza',
  'Brzozowa',
  'Bystrzycka',
  'Ceglana',
  'Chopina',
  'Cicha',
  'Czereśniowa',
  'Daleka',
  'Dębowa',
  'Długa',
  'Dmowskiego',
  'Dworcowa',
  'Esperantystów',
  'Fabryczna',
  'Fieldorfa',
  'Franciszkańska',
  'Galla Anonima',
  'Garncarska',
  'Gdyńska',
  'Głowackiego',
  'Główna',
  'Grodzka',
  'Hetmańska',
  'Husarska',
  'Inwalidów Wojennych',
  'Jagiellońska',
  'Jagodowa',
  'Jarzębinowa',
  'Jodłowa',
  'Kasztanowa',
  'Kazimierza Odnowiciela',
  'Kazimierza Wielkiego',
  'Kilińskiego',
  'Klonowa',
  'Kolejowa',
  'Kołłątaja',
  'Komunalna',
  'Komunardów',
  'Konopnickiej',
  'Kopernika',
  'Kościelna',
  'Kościuszki',
  'Kotlarska',
  'Kozara-Słobódzkiego',
  'Kraszowicka',
  'Krótka',
  'Kwiatowa',
  'Lelewela',
  'Leśna',
  'Lipowa',
  'Lwowska',
  'Łączna',
  'Łukasińskiego',
  'Marcinkowskiego',
  'Marii Konopnickiej',
  'Marii Kunic',
  'Mennicka',
  'Mieszka I',
  'Młynarska',
  'Muzealna',
  'Nadbrzeżna',
  'Niecała',
  'Niemiecka',
  'Noworudzka',
  'Ofiar Oświęcimskich',
  'Okulickiego',
  'Okrężna',
  'Paderewskiego',
  'Parkowa',
  'Partyzantów',
  'Piekarska',
  'Piękna',
  'Pionierów Ziemi Świdnickiej',
  'Piotra Skargi',
  'Plac Grunwaldzki',
  'Plac Jana Pawła II',
  'Plac Pokoju',
  'Plac Wolności',
  'Pocztowa',
  'Podchorążych',
  'Podmiejska',
  'Pogodna',
  'Polna Droga',
  'Prądzyńskiego',
  'Promenada',
  'Prosta',
  'Przemysłowa',
  'Przyjaźni',
  'Pułaskiego',
  'Reja',
  'Riedla',
  'Rolnicza',
  'Równa',
  'Różana',
  'Rycerska',
  'Rynek',
  'Rzeźbiarska',
  'Sadowa',
  'Saperów',
  'Serbska',
  'Sienkiewicza',
  'Sikorskiego',
  'Skłodowskiej-Curie',
  'Składowa',
  'Słoneczna',
  'Słowackiego',
  'Słowiańska',
  'Sobieskiego',
  'Solna',
  'Sosnowa',
  'Sowiogórska',
  'Spacerowa',
  'Sportowa',
  'Spółdzielcza',
  'Srebrna',
  'Stalowa',
  'Stary Rynek',
  'Staszica',
  'Strzelińska',
  'Strzegomska',
  'Sukiennicka',
  'Szarych Szeregów',
  'Szpitalna',
  'Szymanowskiego',
  'Ślężana',
  'Środkowa',
  'Świerkowa',
  'Świętokrzyska',
  'Teatralna',
  'Tołstoja',
  'Traugutta',
  'Ułańska',
  'Wałbrzyska',
  'Wałowa',
  'Warszawska',
  'Waryńskiego',
  'Wąska',
  'Wesoła',
  'Westerplatte',
  'Wewnętrzna',
  'Widokowa',
  'Wiejska',
  'Wierzbowa',
  'Wilcza',
  'Wiosenna',
  'Wiśniowa',
  'Wodna',
  'Wojska Polskiego',
  'Wrocławska',
  'Wróblewskiego',
  'Wschodnia',
  'Wybickiego',
  'Wyspiańskiego',
  'Wyszyńskiego',
  'Zacisze',
  'Zagłoby',
  'Zamenhofa',
  'Zamkowa',
  'Zawiszowska',
  'Zielona',
  'Zimowa',
  'Zwierzyniecka',
  'Zwycięstwa',
  'Żeromskiego',
  'Żwirki i Wigury',
];

// Схема валідації Zod з масками, підтримкою мов та захистом від некоректних символів
const createCheckoutSchema = (t: ReturnType<typeof useI18n>['t'], locale: string) =>
  z.object({
    name: z
      .string()
      .min(2, t.checkout.errors.nameRequired)
      .max(40, t.checkout.errors.nameRequired)
      .refine((v) => /^[\p{L}\s'-]{2,40}$/u.test(v.trim()), t.checkout.errors.nameRequired),
    phone: z
      .string()
      .refine((v) => getRawPhoneDigits(v).length === 9, t.checkout.errors.phoneRequired),
    deliveryMethod: z.enum(['delivery', 'pickup']),
    zone: z.string().default('city'),
    city: z.string().optional(),
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
      if (data.deliveryMethod === 'delivery' && data.zone === 'suburb') {
        return Boolean(data.city && data.city.trim().length >= 2);
      }
      return true;
    },
    {
      message: (t.checkout.errors as any).cityRequired || (locale === 'pl' ? 'Proszę podać miejscowość' : 'Вкажіть населений пункт'),
      path: ['city'],
    }
  ).refine(
    (data) => {
      if (data.deliveryMethod === 'delivery') {
        return Boolean(data.street && data.street.trim().length >= 2);
      }
      return true;
    },
    {
      message: t.checkout.errors.streetRequired,
      path: ['street'],
    }
  ).refine(
    (data) => {
      if (data.deliveryMethod === 'delivery') {
        return Boolean(data.house && data.house.trim().length > 0 && /\d/.test(data.house));
      }
      return true;
    },
    {
      message: t.checkout.errors.houseRequired,
      path: ['house'],
    }
  );

type CheckoutFormValues = z.infer<ReturnType<typeof createCheckoutSchema>>;

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
  const [selectedZone, setSelectedZone] = useState<DeliveryZoneId>('city');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const storeSettings = useSettingsStore();
  const isPickup = deliveryMethod === 'pickup';
  const subtotal = useCartStore((s) => s.getSubtotal)();
  const hasDiscountedItem = items.some(
    (item) => !item.isGift && (item.product.discountPercent || 0) > 0
  );

  // Динамічний прорахунок кілометражу за місто через Nominatim + OSRM
  const [distanceData, setDistanceData] = useState<{
    distanceKm: number;
    deliveryPrice: number;
    isOutTown: boolean;
    precisionLevel?: 'city' | 'street' | 'house';
    cityName?: string;
    streetName?: string;
    houseNumber?: string;
    formattedAddress?: string;
    isFallback?: boolean;
    message?: string;
  } | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const customFee = (!isPickup && selectedZone === 'suburb')
    ? (distanceData?.deliveryPrice ?? storeSettings.suburb10kmFee)
    : undefined;

  const deliveryFee = useCartStore((s) => s.getDeliveryFee)(isPickup, selectedZone, customFee);
  const total = useCartStore((s) => s.getTotal)(isPickup, selectedZone, customFee);

  // Розрахунок обмежень для вибору часу:
  // - Понеділок: вихідний день (ресторан зачинено весь день).
  // - Якщо на годиннику більше ніж час закриття мінус час виконання (prepWaitTimeMinutes + 15 хв для доставки),
  //   прийом замовлень на сьогодні блокується та автоматично пропонується вибір на завтра.
  const getSchedulingBounds = () => {
    const requiredWait = isPickup ? prepWaitTimeMinutes : prepWaitTimeMinutes + 15;
    const now = new Date();
    const day = now.getDay(); // 0: Неділя, 1: Понеділок, 2: Вівторок...
    const isTodayClosed = day === 1; // Понеділок — завжди вихідний день!

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

    // Дедлайн прийому замовлень на сьогодні: якщо сьогодні вихідний (понеділок) або поточний час + очікування перевищує час закриття
    const isTodayCutoffPassed = isTodayClosed || (now.getTime() + requiredWait * 60000) >= todayClosingMs;

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
      isTodayClosed,
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

  const checkoutSchema = React.useMemo(() => createCheckoutSchema(t, locale), [t, locale]);
  const schemaResolver = React.useMemo(() => createZodResolver(checkoutSchema), [checkoutSchema]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: schemaResolver,
    defaultValues: {
      name: '',
      phone: '',
      deliveryMethod: 'delivery',
      zone: 'city',
      city: '',
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
  const watchCity = watch('city');
  const watchStreet = watch('street');
  const watchHouse = watch('house');

  const resetAddressDetails = React.useCallback(() => {
    setValue('street', '', { shouldValidate: false });
    setValue('house', '', { shouldValidate: false });
    setValue('apartment', '', { shouldValidate: false });
    setValue('floor', '', { shouldValidate: false });
    setValue('entryCode', '', { shouldValidate: false });
  }, [setValue]);

  const calculateDistanceFee = React.useCallback(async (cityVal?: string, streetVal?: string, houseVal?: string) => {
    const currentCity = cityVal ?? watch('city');
    const currentStreet = streetVal ?? watch('street');
    const currentHouse = houseVal ?? watch('house');

    if (!currentCity || currentCity.trim().length < 2) {
      setDistanceData(null);
      return;
    }

    setIsCalculatingDistance(true);
    try {
      const res = await fetch('/api/delivery/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: currentCity.trim(),
          street: (currentStreet || '').trim(),
          house: (currentHouse || '').trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDistanceData(data);
      }
    } catch (err) {
      console.warn('Failed to calculate distance:', err);
    } finally {
      setIsCalculatingDistance(false);
    }
  }, [watch]);

  // Підказки та автокомпліт населених пунктів Свідницького повіту
  const [isCitySuggestionsOpen, setIsCitySuggestionsOpen] = useState(false);

  const filteredTowns = React.useMemo(() => {
    const query = (watchCity || '').trim().toLowerCase();
    if (!query) return [];
    return NEARBY_TOWNS.filter((town) =>
      town.toLowerCase().includes(query) && town.toLowerCase() !== query
    ).slice(0, 6);
  }, [watchCity]);

  const selectCitySuggestion = (town: string) => {
    setValue('city', town, { shouldValidate: true });
    setIsCitySuggestionsOpen(false);
    resetAddressDetails();
    calculateDistanceFee(town, '', '');
  };

  // Підказки та автокомпліт вулиць
  const [isStreetSuggestionsOpen, setIsStreetSuggestionsOpen] = useState(false);

  const filteredStreets = React.useMemo(() => {
    const query = (watchStreet || '').trim().toLowerCase();
    if (!query) return [];
    return POPULAR_STREETS.filter((st) =>
      st.toLowerCase().includes(query) && st.toLowerCase() !== query
    ).slice(0, 6);
  }, [watchStreet]);

  const selectStreetSuggestion = (st: string) => {
    setValue('street', st, { shouldValidate: true });
    setIsStreetSuggestionsOpen(false);
    if (selectedZone === 'suburb') {
      calculateDistanceFee(watchCity, st, watchHouse);
    }
  };

  React.useEffect(() => {
    if (selectedZone !== 'suburb' || deliveryMethod === 'pickup') {
      setDistanceData(null);
    }
  }, [selectedZone, deliveryMethod]);

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

  // Обробник швидкого перемикання на замовлення на завтра при перевантаженій кухні
  React.useEffect(() => {
    const handleSetTomorrow = () => {
      setScheduledDate('tomorrow');
      setValue('timingType', 'scheduled');
      setValue('scheduledTime', bounds.tomorrowMinTimeString);
    };
    window.addEventListener('set-checkout-order-tomorrow', handleSetTomorrow);
    return () => window.removeEventListener('set-checkout-order-tomorrow', handleSetTomorrow);
  }, [bounds.tomorrowMinTimeString, setValue]);

  // Корекція часу, якщо обрано значення менше ніж мінімально дозволений час для обраного дня
  React.useEffect(() => {
    const minTime = scheduledDate === 'tomorrow' ? bounds.tomorrowMinTimeString : bounds.todayMinTimeString;
    if (selectedScheduledTime && selectedScheduledTime < minTime) {
      setValue('scheduledTime', minTime);
    }
  }, [scheduledDate, bounds.tomorrowMinTimeString, bounds.todayMinTimeString, selectedScheduledTime]);

  // Автоматичне автозаповнення контактів та адреси зі збереженого профілю клієнта
  React.useEffect(() => {
    if (isCheckoutOpen) {
      if (customer) {
        if (customer.name) setValue('name', maskName(customer.name));
        if (customer.phone) setValue('phone', maskPhone(customer.phone));

        // Автовибір зони зі збережених даних клієнта
        let clientZone: DeliveryZoneId = 'city';
        const savedZone = customer.defaultAddress?.zone;
        const savedCity = customer.defaultAddress?.city?.trim();

        if (savedZone === 'suburb' || savedZone === 'suburb_10km' || savedZone === 'suburb_5km') {
          clientZone = 'suburb';
        } else if (savedCity && savedCity.toLowerCase() !== 'świdnica' && savedCity.toLowerCase() !== 'swidnica') {
          clientZone = 'suburb';
        }

        setSelectedZone(clientZone);
        setValue('zone', clientZone);

        if (customer.defaultAddress?.city) setValue('city', maskCity(customer.defaultAddress.city));
        if (customer.defaultAddress?.street) setValue('street', maskStreet(customer.defaultAddress.street));
        if (customer.defaultAddress?.house) setValue('house', maskHouse(customer.defaultAddress.house));
        if (customer.defaultAddress?.apartment) setValue('apartment', maskApartment(customer.defaultAddress.apartment));
        if (customer.defaultAddress?.floor) setValue('floor', maskFloor(customer.defaultAddress.floor));
        if (customer.defaultAddress?.entryCode) setValue('entryCode', maskEntryCode(customer.defaultAddress.entryCode));
      } else {
        // За замовчуванням завжди Свідниця
        setSelectedZone('city');
        setValue('zone', 'city');
      }
    }
  }, [isCheckoutOpen, customer, setValue]);

  const onSubmit = async (values: CheckoutFormValues) => {
    // Якщо прийом замовлень призупинено в адмінці через перевантаження кухні — дозволено ТІЛЬКИ на завтра
    if (storeSettings.isOrdersPaused && (scheduledDate !== 'tomorrow' || values.timingType !== 'scheduled')) {
      return;
    }

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
        name: maskName(values.name),
        phone: getRawPhoneDigits(values.phone),
        deliveryMethod: values.deliveryMethod,
        address:
          values.deliveryMethod === 'delivery'
            ? {
              zone: selectedZone,
              city: selectedZone === 'suburb' ? maskCity(values.city || '') : 'Świdnica',
              street: maskStreet(values.street || ''),
              house: maskHouse(values.house || ''),
              apartment: values.apartment ? maskApartment(values.apartment) : undefined,
              floor: values.floor ? maskFloor(values.floor) : undefined,
              entryCode: values.entryCode ? maskEntryCode(values.entryCode) : undefined,
            }
            : undefined,
        paymentMethod: values.paymentMethod,
        changeFrom: values.changeFrom ? maskChangeFrom(values.changeFrom) : undefined,
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
          zone: selectedZone,
          city: selectedZone === 'suburb' ? maskCity(values.city || '') : 'Świdnica',
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
                  : hasDiscountedItem
                  ? t.checkout.pickup
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
          {/* Попередження, якщо прийом замовлень призупинено з адмінки */}
          {storeSettings.isOrdersPaused && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs sm:text-sm">
                    {locale === 'pl' ? 'Zamówienia na dzisiaj wstrzymane' : 'Замовлення на сьогодні призупинено'}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {scheduledDate === 'tomorrow' && selectedTiming === 'scheduled'
                      ? (locale === 'pl'
                          ? 'Dziękujemy! Przygotujemy Twoje zamówienie jutro na wskazaną godzinę.'
                          : 'Дякуємо! Ми приготуємо ваше замовлення завтра точно на вказаний час.')
                      : (locale === 'pl'
                          ? 'Kuchnia jest dziś przeciążona. Złóż zamówienie na jutro na dogodną godzinę або zadzwoń do lokalu:'
                          : 'Кухня на сьогодні перевантажена. Оформіть замовлення на завтра на зручний час або зателефонуйте:')}{' '}
                    <a href={`tel:${brandTheme.contacts.phoneRaw}`} className="text-amber-400 font-bold hover:underline">
                      {brandTheme.contacts.phone}
                    </a>
                  </p>
                </div>
              </div>

              {(scheduledDate !== 'tomorrow' || selectedTiming !== 'scheduled') && (
                <button
                  type="button"
                  onClick={() => {
                    setScheduledDate('tomorrow');
                    setValue('timingType', 'scheduled');
                    setValue('scheduledTime', bounds.tomorrowMinTimeString);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shrink-0 transition-all cursor-pointer shadow-sm select-none active:scale-95 whitespace-nowrap"
                >
                  {locale === 'pl' ? 'Przełącz na jutro' : 'Обрати на завтра'}
                </button>
              )}
            </div>
          )}

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
                className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 border text-center transition-all cursor-pointer select-none ${deliveryMethod === 'delivery'
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
                className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 border text-center transition-all cursor-pointer select-none ${deliveryMethod === 'pickup'
                    ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                    : 'bg-[#181822] border-white/5 text-zinc-400 hover:text-white'
                  }`}
              >
                <Store className={`w-4 h-4 shrink-0 ${deliveryMethod === 'pickup' ? 'text-[#e50914]' : ''}`} />
                <div className="text-left">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm leading-none">
                    <span>{t.checkout.pickup}</span>
                    {!hasDiscountedItem && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-black">-{brandTheme.delivery.pickupDiscountPercent}%</span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">~{prepWaitTimeMinutes} {locale === 'pl' ? 'min' : 'хв'}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Контактні дані: компактні інпути з масками */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <Input
              label={t.checkout.name}
              id="customer-name"
              placeholder={t.checkout.namePlaceholder}
              error={errors.name?.message}
              className="h-9 sm:h-9.5 text-xs sm:text-sm"
              maxLength={40}
              {...register('name', {
                onChange: (e) => {
                  const cleaned = maskName(e.target.value);
                  e.target.value = cleaned;
                  setValue('name', cleaned, { shouldValidate: true });
                },
              })}
            />
            <Input
              label={t.checkout.phone}
              id="customer-phone"
              type="tel"
              placeholder="000 000 000"
              error={errors.phone?.message}
              className="h-9 sm:h-9.5 text-xs sm:text-sm font-mono tracking-wider"
              maxLength={11}
              {...register('phone', {
                onChange: (e) => {
                  const formatted = maskPhone(e.target.value);
                  e.target.value = formatted;
                  setValue('phone', formatted, { shouldValidate: true });
                },
              })}
            />
          </div>

          {/* Адреса доставки (тільки при доставці) */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-2.5 p-2.5 sm:p-3 rounded-xl bg-[#161620] border border-white/5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#e50914]" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  {t.checkout.addressTitle}
                </span>
              </div>

              {/* Вибір зони доставки */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {locale === 'pl' ? 'Strefa dostawy' : 'Зона доставки'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* 1. Свідниця */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedZone !== 'city') {
                        setSelectedZone('city');
                        setValue('zone', 'city');
                        setValue('city', 'Świdnica');
                        resetAddressDetails();
                        setDistanceData(null);
                      }
                    }}
                    className={cn(
                      'p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                      selectedZone === 'city'
                        ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-sm shadow-[#e50914]/20'
                        : 'bg-[#121218] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    )}
                  >
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                      <span>Świdnica</span>
                      {selectedZone === 'city' && <span className="w-2 h-2 rounded-full bg-[#e50914] shadow-sm shadow-[#e50914]" />}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 leading-tight">
                      {subtotal >= storeSettings.cityFreeThreshold
                        ? (locale === 'pl' ? 'Darmowa dostawa' : 'Безкоштовно')
                        : `${storeSettings.cityStandardFee} zł (od ${storeSettings.cityFreeThreshold} zł gratis)`}
                    </div>
                  </button>

                  {/* 2. За місто (до 10 км) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedZone !== 'suburb') {
                        setSelectedZone('suburb');
                        setValue('zone', 'suburb');
                        setValue('city', '');
                        resetAddressDetails();
                        setDistanceData(null);
                      }
                    }}
                    className={cn(
                      'p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                      selectedZone === 'suburb'
                        ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-sm shadow-[#e50914]/20'
                        : 'bg-[#121218] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    )}
                  >
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                      <span>{locale === 'pl' ? 'Za miastem' : 'За місто'}</span>
                      {selectedZone === 'suburb' && <span className="w-2 h-2 rounded-full bg-[#e50914] shadow-sm shadow-[#e50914]" />}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 leading-tight">
                      {distanceData?.deliveryPrice
                        ? `${distanceData.deliveryPrice} zł (~${distanceData.distanceKm} km)`
                        : `${storeSettings.suburb10kmFee} zł (+1 zł/km)`}
                    </div>
                  </button>
                </div>
              </div>

              {/* Інформаційна плашка прорахунку доставки за місто */}
              {selectedZone === 'suburb' && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-white font-bold">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      {isCalculatingDistance ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                      ) : (
                        <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-black">
                        {isCalculatingDistance
                          ? (locale === 'pl' ? 'Obliczanie trasy OSRM...' : 'Розрахунок маршруту по карті...')
                          : distanceData
                            ? (distanceData.precisionLevel === 'city'
                                ? (locale === 'pl'
                                    ? `Centrum ${distanceData.cityName || 'miejscowości'}: ~${distanceData.distanceKm} km`
                                    : `До центру ${distanceData.cityName || 'міста'}: ~${distanceData.distanceKm} км`)
                                : distanceData.precisionLevel === 'street'
                                ? (locale === 'pl'
                                    ? `Początek ul. ${distanceData.streetName || ''}: ~${distanceData.distanceKm} km`
                                    : `Початок вул. ${distanceData.streetName || ''}: ~${distanceData.distanceKm} км`)
                                : (locale === 'pl'
                                    ? `Dokładny adres (${distanceData.houseNumber || ''}): ~${distanceData.distanceKm} km`
                                    : `Точна адреса (буд. ${distanceData.houseNumber || ''}): ~${distanceData.distanceKm} км`))
                            : (locale === 'pl' ? 'Dostawa za miasto' : 'Доставка за місто')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                          {locale === 'pl' ? 'Koszt:' : 'Вартість:'}
                        </span>
                        <span className="text-amber-300 font-black text-sm sm:text-base">
                          {distanceData ? `${distanceData.deliveryPrice} zł` : `od ${storeSettings.suburb10kmFee} zł`}
                        </span>
                      </div>

                      {watchCity && watchCity.trim().length >= 2 && (
                        <button
                          type="button"
                          onClick={() => calculateDistanceFee()}
                          disabled={isCalculatingDistance}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 transition-all cursor-pointer"
                        >
                          {locale === 'pl' ? 'Przelicz' : 'Розрахувати'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {distanceData
                      ? (distanceData.precisionLevel === 'city'
                          ? (locale === 'pl'
                              ? `Wyliczono do centrum (${distanceData.cityName}). Wpisz ulicę oraz numer domu, aby doprecyzować trasę.`
                              : `Розраховано до центру (${distanceData.cityName}). Вкажіть вулицю та номер будинку для точного розрахунку.`)
                          : distanceData.precisionLevel === 'street'
                          ? (locale === 'pl'
                              ? `Wyliczono do początku ulicy. Wpisz numer domu dla ostatecznej wyceny.`
                              : `Розраховано до початку вулиці. Вкажіть номер будинку для фінальної ціни.`)
                          : (locale === 'pl'
                              ? `Dokładna trasa pod wskazany dom (9 zł baza + ${Math.max(0, Math.ceil(distanceData.distanceKm - 4.5))} zł za dodatkowe km).`
                              : `Точний маршрут за адресою (9 zł база + ${Math.max(0, Math.ceil(distanceData.distanceKm - 4.5))} zł за км понад 4.5 км).`))
                      : (locale === 'pl'
                          ? 'Wpisz miejscowość poniżej — system natychmiast wyliczy dystans i cenę do centrum (od 9 zł + 1 zł/km).'
                          : 'Вкажіть населений пункт нижче — система одразу прорахує відстань і ціну до центру (від 9 zł + 1 zł/км).')}
                  </p>
                </div>
              )}

              {/* Поле для вводу населеного пункту з автокомплітом та швидким вибором */}
              {selectedZone === 'suburb' && (
                <div className="animate-in fade-in duration-200 relative">
                  <Input
                    label={locale === 'pl' ? 'Miejscowość (do 10 km poza Świdnicą) *' : 'Населений пункт (до 10 км за містом) *'}
                    id="order-city"
                    placeholder={locale === 'pl' ? 'np. Pszenno, Witoszów Dolny, Bystrzyca...' : 'наприклад, Pszenno, Witoszów Dolny...'}
                    error={errors.city?.message}
                    className="h-8.5 sm:h-9 text-xs"
                    maxLength={40}
                    autoComplete="off"
                    {...register('city', {
                      onChange: (e) => {
                        const cleaned = maskCity(e.target.value);
                        const prevCity = watchCity;
                        e.target.value = cleaned;
                        setValue('city', cleaned, { shouldValidate: true });
                        setIsCitySuggestionsOpen(true);
                        // При зміні населеного пункту очищаємо вулицю, будинок, квартиру, поверх та код під'їзду
                        if (cleaned !== prevCity) {
                          resetAddressDetails();
                          if (!cleaned || cleaned.trim().length < 2) {
                            setDistanceData(null);
                          }
                        }
                      },
                      onBlur: () => {
                        setTimeout(() => setIsCitySuggestionsOpen(false), 250);
                        calculateDistanceFee();
                      },
                    })}
                    onFocus={() => setIsCitySuggestionsOpen(true)}
                  />

                  {/* Випадаючий список підказок при введенні літер */}
                  {isCitySuggestionsOpen && filteredTowns.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#181824] border border-amber-500/40 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 bg-black/50 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{locale === 'pl' ? 'Wybierz miejscowość:' : 'Оберіть населений пункт:'}</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredTowns.map((town) => (
                          <button
                            key={town}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectCitySuggestion(town);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-white hover:bg-amber-500/20 hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="font-semibold">{town}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">Powiat świdnicki</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <Input
                    label={t.checkout.street}
                    id="order-street"
                    placeholder={t.checkout.streetPlaceholder}
                    error={errors.street?.message}
                    className="h-8.5 sm:h-9 text-xs"
                    maxLength={50}
                    autoComplete="off"
                    {...register('street', {
                      onChange: (e) => {
                        const cleaned = maskStreet(e.target.value);
                        e.target.value = cleaned;
                        setValue('street', cleaned, { shouldValidate: true });
                        setIsStreetSuggestionsOpen(true);
                      },
                      onBlur: () => {
                        setTimeout(() => setIsStreetSuggestionsOpen(false), 250);
                        if (selectedZone === 'suburb') {
                          calculateDistanceFee();
                        }
                      },
                    })}
                    onFocus={() => setIsStreetSuggestionsOpen(true)}
                  />

                  {/* Випадаючий список підказок вулиць при введенні літер */}
                  {isStreetSuggestionsOpen && filteredStreets.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#181824] border border-amber-500/40 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 bg-black/50 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{locale === 'pl' ? 'Wybierz ulicę:' : 'Оберіть вулицю:'}</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredStreets.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectStreetSuggestion(st);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-white hover:bg-amber-500/20 hover:text-amber-300 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="font-semibold">{st}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {watchCity || 'Świdnica'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    label={t.checkout.house}
                    id="order-house"
                    placeholder={t.checkout.housePlaceholder}
                    error={errors.house?.message}
                    className="h-8.5 sm:h-9 text-xs font-mono"
                    maxLength={8}
                    {...register('house', {
                      onChange: (e) => {
                        const cleaned = maskHouse(e.target.value);
                        e.target.value = cleaned;
                        setValue('house', cleaned, { shouldValidate: true });
                      },
                      onBlur: () => {
                        if (selectedZone === 'suburb') {
                          calculateDistanceFee();
                        }
                      },
                    })}
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
                    inputMode="numeric"
                    placeholder={t.checkout.apartmentPlaceholder}
                    className="h-8.5 text-xs font-mono"
                    maxLength={6}
                    {...register('apartment', {
                      onChange: (e) => {
                        const cleaned = maskApartment(e.target.value);
                        e.target.value = cleaned;
                        setValue('apartment', cleaned);
                      },
                    })}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 mb-1 leading-tight h-8 sm:h-7 flex items-end">
                    {t.checkout.floor}
                  </span>
                  <Input
                    id="order-floor"
                    type="text"
                    inputMode="numeric"
                    placeholder={t.checkout.floorPlaceholder}
                    className="h-8.5 text-xs font-mono"
                    maxLength={3}
                    {...register('floor', {
                      onChange: (e) => {
                        const cleaned = maskFloor(e.target.value);
                        e.target.value = cleaned;
                        setValue('floor', cleaned);
                      },
                    })}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-medium text-zinc-300 mb-1 leading-tight h-8 sm:h-7 flex items-end">
                    {t.checkout.entryCode}
                  </span>
                  <Input
                    id="order-entry-code"
                    placeholder={t.checkout.entryCodePlaceholder}
                    className="h-8.5 text-xs font-mono"
                    maxLength={8}
                    {...register('entryCode', {
                      onChange: (e) => {
                        const cleaned = maskEntryCode(e.target.value);
                        e.target.value = cleaned;
                        setValue('entryCode', cleaned);
                      },
                    })}
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
                className={`flex items-center justify-start gap-2.5 px-3 py-2.5 sm:p-3 border cursor-pointer transition-all select-none ${selectedPayment === 'blik_online' || selectedPayment === 'card_courier'
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
                className={`flex items-center justify-start gap-2.5 px-3 py-2.5 sm:p-3 border cursor-pointer transition-all select-none ${selectedPayment === 'cash'
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
                  className="h-8.5 text-xs font-mono"
                  maxLength={5}
                  {...register('changeFrom', {
                    onChange: (e) => {
                      const cleaned = maskChangeFrom(e.target.value);
                      e.target.value = cleaned;
                      setValue('changeFrom', cleaned);
                    },
                  })}
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
                  if (bounds.isTodayCutoffPassed) return;
                  setValue('timingType', 'asap');
                  setValue('scheduledTime', '');
                }}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className={cn(
                  'flex flex-col items-start justify-center p-2.5 sm:p-3 border text-left transition-all select-none',
                  bounds.isTodayCutoffPassed
                    ? 'opacity-40 cursor-not-allowed bg-zinc-900/40 border-white/5'
                    : selectedTiming === 'asap'
                      ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs cursor-pointer'
                      : 'bg-[#171720] border-white/5 text-zinc-400 hover:text-white cursor-pointer'
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white">
                  <Zap className={cn('w-3.5 h-3.5', bounds.isTodayCutoffPassed ? 'text-zinc-500' : 'text-[#e50914]')} />
                  <span>{locale === 'pl' ? 'Jak najszybciej' : 'Якнайшвидше'}</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  {bounds.isTodayClosed
                    ? (locale === 'pl' ? 'Dziś nieczynne' : 'Сьогодні вихідний')
                    : bounds.isTodayCutoffPassed
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
                className={cn(
                  'flex flex-col items-start justify-center p-2.5 sm:p-3 border text-left cursor-pointer transition-all select-none',
                  selectedTiming === 'scheduled'
                    ? 'bg-[#e50914]/15 border-[#e50914] text-white shadow-xs'
                    : 'bg-[#171720] border-white/5 text-zinc-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {bounds.isTodayClosed || bounds.isTodayCutoffPassed
                      ? (locale === 'pl' ? 'Zamówienie na jutro' : 'Замовлення на завтра')
                      : (locale === 'pl' ? 'Na wybraną godzinę' : 'На обраний час')}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  {bounds.isTodayClosed
                    ? (locale === 'pl' ? 'Na jutro od 12:00' : 'На завтра з 12:00')
                    : (locale === 'pl' ? 'Wcześniejsze zamówienie' : 'Попереднє замовлення')}
                </span>
              </button>
            </div>

            {/* Сповіщення про вихідний день (Понеділок) */}
            {bounds.isTodayClosed ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-300">
                    {locale === 'pl'
                      ? 'Dzisiaj mamy nieczynne (Poniedziałek — dzień wolny)'
                      : 'Сьогодні заклад зачинено (Понеділок — вихідний день)'}
                  </p>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {locale === 'pl'
                      ? 'W poniedziałki odpoczywamy. Przyjmujemy zamówienia na jutro (Wtorek) od 12:00!'
                      : 'По понеділках заклад відпочиває. Приймаємо замовлення на завтра (Вівторок) з 12:00!'}
                  </p>
                </div>
              </div>
            ) : bounds.isTodayCutoffPassed && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
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
                    <button
                      type="button"
                      disabled={bounds.isTodayClosed || bounds.isTodayCutoffPassed}
                      onClick={() => {
                        if (bounds.isTodayClosed || bounds.isTodayCutoffPassed) return;
                        setScheduledDate('today');
                        setValue('scheduledTime', bounds.todayMinTimeString);
                      }}
                      className={cn(
                        'px-2.5 py-1 text-xs font-bold rounded transition-all select-none',
                        (bounds.isTodayClosed || bounds.isTodayCutoffPassed)
                          ? 'opacity-40 text-zinc-500 cursor-not-allowed line-through'
                          : scheduledDate === 'today'
                            ? 'bg-[#e50914] text-white shadow-xs cursor-pointer'
                            : 'text-zinc-400 hover:text-white cursor-pointer'
                      )}
                    >
                      {locale === 'pl'
                        ? bounds.isTodayClosed ? 'Dzisiaj (Nieczynne)' : 'Dzisiaj'
                        : bounds.isTodayClosed ? 'Сьогодні (Вихідний)' : 'Сьогодні'}
                    </button>

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
                              } catch { }
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
                              } catch { }
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
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-zinc-400 font-medium">{t.cart.total}:</span>
                <span className="text-lg sm:text-xl font-black text-[#e50914]">{formatPrice(total, locale)}</span>
                {isPickup && !hasDiscountedItem && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {t.checkout.pickupDiscount}
                  </span>
                )}
              </div>

              {!isPickup && (
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span>{locale === 'pl' ? 'W tym dostawa:' : 'У тому числі доставка:'}</span>
                  <span className={cn('font-bold', deliveryFee === 0 ? 'text-emerald-400' : 'text-amber-300')}>
                    {deliveryFee === 0
                      ? (locale === 'pl' ? 'Gratis (Świdnica)' : 'Безкоштовно (Свідниця)')
                      : `${deliveryFee} zł ${selectedZone === 'suburb' ? (distanceData?.distanceKm ? `(~${distanceData.distanceKm} km)` : '(za miastem)') : '(Świdnica)'}`}
                  </span>
                </div>
              )}
            </div>

            {(() => {
              const isBlockedByPause = storeSettings.isOrdersPaused && (scheduledDate !== 'tomorrow' || selectedTiming !== 'scheduled');
              const isDisabled = isSubmitting || items.length === 0 || isBlockedByPause || (bounds.isTodayCutoffPassed && selectedTiming === 'asap');

              return (
                <button
                  type="submit"
                  disabled={isDisabled}
                  id="submit-order-button"
                  style={{
                    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                  }}
                  className="flex-1 sm:max-w-xs flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] hover:brightness-110 text-white font-black text-sm shadow-md shadow-[#e50914]/30 hover:shadow-[#e50914]/50 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer select-none"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isBlockedByPause ? (
                    <span>{locale === 'pl' ? 'Tylko na jutro' : 'Тільки на завтра'}</span>
                  ) : storeSettings.isOrdersPaused && scheduledDate === 'tomorrow' ? (
                    <span>{locale === 'pl' ? 'Złóż zamówienie na jutro' : 'Оформити на завтра'}</span>
                  ) : (
                    <span>{t.checkout.submitOrder}</span>
                  )}
                </button>
              );
            })()}
          </div>
        </form>
      )}
    </Dialog>
  );
}
