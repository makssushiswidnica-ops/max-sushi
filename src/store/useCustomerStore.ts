import { create } from 'zustand';
import { CustomerProfile, Order, OrderAddress } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface CustomerState {
  customer: CustomerProfile | null;
  isOpen: boolean;
  activeTab: 'orders' | 'profile';
  isFirstOrderEligible: boolean;
  isBirthdayUsedThisYear: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveTab: (tab: 'orders' | 'profile') => void;
  checkEligibility: (phone?: string) => Promise<boolean>;
  checkBirthdayUsedThisYear: (phone?: string) => Promise<boolean>;
  registerCustomer: (params: { phone: string; name: string; password: string; email?: string }) => Promise<CustomerProfile>;
  loginUser: (identifier: string, password: string) => Promise<{ type: 'admin' | 'customer'; profile?: CustomerProfile }>;
  updateProfile: (data: Partial<CustomerProfile>) => Promise<void>;
  logout: () => void;
  fetchCustomerOrders: () => Promise<Order[]>;
}

// Завантаження збереженого профілю з localStorage при завантаженні сторінки
const getInitialCustomer = (): CustomerProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('max-sushi-customer');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse customer profile from localStorage:', e);
  }
  return null;
};

// Завантаження бази зареєстрованих клієнтів з localStorage
export const getStoredCustomersDb = (): CustomerProfile[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('max-sushi-customers-db');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse customers db:', e);
  }
  return [];
};

// Очищення та стандартизація телефонного номера (тільки цифри та знак +)
export const normalizePhone = (phone: string): string => {
  return phone.replace(/[^\d+]/g, '').trim();
};

const buildPhoneIlikePattern = (digits: string): string => {
  const clean = digits.replace(/\D/g, '');
  if (clean.length >= 9) {
    const last9 = clean.slice(-9);
    return `%${last9.slice(0, 3)}%${last9.slice(3, 6)}%${last9.slice(6, 9)}%`;
  }
  return `%${clean}%`;
};

// Перевірка чи має номер телефону попередні замовлення (для акції 10% на перше замовлення)
export const checkPhoneHasOrders = async (phone: string): Promise<boolean> => {
  if (!phone) return false;
  const digits = normalizePhone(phone).slice(-9);
  if (!digits || digits.length < 6) return false;

  // 1. Перевірка локальних замовлень у браузері
  if (typeof window !== 'undefined') {
    try {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
      const hasLocal = localOrders.some((o) => normalizePhone(o.phone).includes(digits) && o.status !== 'cancelled');
      if (hasLocal) return true;
    } catch {}
  }

  // 2. Перевірка в Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status')
        .ilike('phone', `%${digits}%`)
        .neq('status', 'cancelled')
        .limit(1);

      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (e) {
      console.warn('Notice checking customer orders in Supabase:', e);
    }
  }

  return false;
};

// Перевірка чи збігається день і місяць народження з сьогоднішньою датою
export const isBirthdayToday = (birthDate?: string): boolean => {
  if (!birthDate) return false;
  const match = birthDate.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return match[1] === month && match[2] === day;
};

// Перевірка чи клієнт вже використовував знижку до Дня народження у поточному році
export const checkPhoneUsedBirthdayThisYear = async (phone: string): Promise<boolean> => {
  if (!phone) return false;
  const digits = normalizePhone(phone).replace(/\D/g, '').slice(-9);
  if (!digits || digits.length < 6) return false;
  const currentYear = new Date().getFullYear();

  if (typeof window !== 'undefined') {
    try {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
      const usedLocal = localOrders.some((o) => {
        if (o.status === 'cancelled') return false;
        const oYear = new Date(o.createdAt).getFullYear();
        if (oYear !== currentYear) return false;
        const phoneMatch = normalizePhone(o.phone).replace(/\D/g, '').includes(digits);
        const isBday = Boolean(o.isBirthday || o.birthdayDiscount || /URODZINY/i.test(o.comment || ''));
        return phoneMatch && isBday;
      });
      if (usedLocal) return true;
    } catch {}
  }

  if (isSupabaseConfigured) {
    try {
      const yearStart = `${currentYear}-01-01T00:00:00.000Z`;
      const { data, error } = await supabase
        .from('orders')
        .select('id, comment, status, created_at')
        .ilike('phone', buildPhoneIlikePattern(digits))
        .neq('status', 'cancelled')
        .gte('created_at', yearStart)
        .ilike('comment', '%URODZINY%')
        .limit(1);

      if (!error && data && data.length > 0) {
        return true;
      }
    } catch {}
  }

  return false;
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customer: getInitialCustomer(),
  isOpen: false,
  activeTab: 'orders',
  isFirstOrderEligible: true,
  isBirthdayUsedThisYear: false,

  setOpen: (open: boolean) => set({ isOpen: open }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  checkEligibility: async (phone?: string): Promise<boolean> => {
    const targetPhone = phone || get().customer?.phone;
    if (!targetPhone) {
      set({ isFirstOrderEligible: false });
      return false;
    }
    const hasOrders = await checkPhoneHasOrders(targetPhone);
    const eligible = !hasOrders;
    set({ isFirstOrderEligible: eligible });
    return eligible;
  },

  checkBirthdayUsedThisYear: async (phone?: string): Promise<boolean> => {
    const currentCustomer = get().customer;
    const currentYear = new Date().getFullYear();
    if (currentCustomer?.birthdayUsedYear === currentYear) {
      set({ isBirthdayUsedThisYear: true });
      return true;
    }
    const targetPhone = phone || currentCustomer?.phone;
    if (!targetPhone) {
      set({ isBirthdayUsedThisYear: false });
      return false;
    }
    const used = await checkPhoneUsedBirthdayThisYear(targetPhone);
    set({ isBirthdayUsedThisYear: used });
    return used;
  },

  // 1. РЕЄСТРАЦІЯ НОВОГО КЛІЄНТА
  registerCustomer: async ({ phone, name, password, email }) => {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanEmail = email?.trim().toLowerCase() || undefined;

    if (!cleanPhone) throw new Error('phoneRequired');
    if (!cleanName) throw new Error('nameRequired');
    if (!password || password.length < 4) throw new Error('passwordTooShort');

    const db = getStoredCustomersDb();
    const cleanDigits = normalizePhone(cleanPhone).replace(/\D/g, '');
    const last9 = cleanDigits.slice(-9);

    // Перевірка на вже існуючий номер або e-mail у локальній базі
    const existing = db.find(
      (c) =>
        normalizePhone(c.phone).replace(/\D/g, '').slice(-9) === last9 ||
        (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail)
    );

    if (existing) {
      throw new Error('userAlreadyExists');
    }

    // Перевірка на вже існуючого користувача у Supabase (окремо телефон з урахуванням пробілів та e-mail без урахування регістру)
    if (isSupabaseConfigured) {
      try {
        const phonePattern = buildPhoneIlikePattern(last9);
        const [phoneRes, emailRes] = await Promise.all([
          supabase.from('customers').select('id').ilike('phone', phonePattern).limit(1),
          cleanEmail
            ? supabase.from('customers').select('id').ilike('email', cleanEmail).limit(1)
            : Promise.resolve({ data: null }),
        ]);

        if ((phoneRes.data && phoneRes.data.length > 0) || (emailRes.data && emailRes.data.length > 0)) {
          throw new Error('userAlreadyExists');
        }
      } catch (err: any) {
        if (err?.message === 'userAlreadyExists') throw err;
      }
    }

    // Спробуємо підтягнути збережену адресу з попередніх замовлень
    let defaultAddress: OrderAddress | undefined = undefined;
    if (typeof window !== 'undefined') {
      try {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
        const matchingLocal = localOrders.find(
          (o) => normalizePhone(o.phone) === normalizePhone(cleanPhone)
        );
        if (matchingLocal?.address?.street) {
          defaultAddress = matchingLocal.address;
        }
      } catch (e) {}
    }

    const newProfile: CustomerProfile = {
      id: `cust_${Date.now()}`,
      phone: cleanPhone,
      name: cleanName,
      email: cleanEmail,
      password: password,
      defaultAddress,
      preferredLanguage: 'pl',
      savedAt: new Date().toISOString(),
    };

    // Зберігаємо в базі користувачів браузера
    db.push(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('max-sushi-customers-db', JSON.stringify(db));
      localStorage.setItem('max-sushi-customer', JSON.stringify(newProfile));
      localStorage.setItem('max-sushi-has-logged-in', 'true');
      localStorage.setItem('max-sushi-last-identifier', cleanPhone);
    }

    // Зберігаємо безпосередньо в базі даних Supabase (таблиця customers)
    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').upsert(
          {
            id: newProfile.id,
            phone: cleanPhone,
            name: cleanName,
            email: cleanEmail,
            password: password,
            address: defaultAddress,
            language: 'pl',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
      } catch (err) {
        console.warn('Notice when saving customer to Supabase:', err);
      }
    }

    set({ customer: newProfile });
    get().checkEligibility(newProfile.phone);
    get().checkBirthdayUsedThisYear(newProfile.phone);
    return newProfile;
  },

  // 2. УНІФІКОВАНИЙ ВХІД (КЛІЄНТ АБО АДМІНІСТРАТОР)
  loginUser: async (identifier: string, password: string) => {
    const rawId = identifier.trim();
    const cleanPhone = normalizePhone(rawId);
    const cleanEmail = rawId.toLowerCase();

    // Зберігаємо відмітку про вхід для повторних візитів
    if (typeof window !== 'undefined') {
      localStorage.setItem('max-sushi-has-logged-in', 'true');
      localStorage.setItem('max-sushi-last-identifier', rawId);
    }

    // Перевірка 1: ВХІД В АДМІНКУ (виключно через захищений сервер Supabase Auth без збереження пароля в коді)
    if (cleanEmail === 'makssushiswidnica@gmail.com' && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (!error && data?.session && data.session.user?.email?.toLowerCase() === 'makssushiswidnica@gmail.com') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('max-sushi-is-admin', 'true');
            window.dispatchEvent(new Event('admin-auth-changed'));
          }
          return { type: 'admin' };
        }
      } catch (e) {}
    }

    // Перевірка 2: ВХІД КЛІЄНТА
    const isEmailLogin = rawId.includes('@');
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const last9 = cleanDigits.length >= 9 ? cleanDigits.slice(-9) : '';

    const db = getStoredCustomersDb();
    const localMatches = db.filter((c) => {
      const cDigits = normalizePhone(c.phone).replace(/\D/g, '');
      const phoneMatches =
        !isEmailLogin &&
        ((cleanDigits.length >= 7 && cDigits === cleanDigits) ||
          (last9.length === 9 && cDigits.slice(-9) === last9));
      const emailMatches = Boolean(isEmailLogin && c.email && c.email.trim().toLowerCase() === cleanEmail);
      return phoneMatches || emailMatches;
    });

    if (localMatches.length > 0) {
      const customerMatch =
        localMatches.find((c) => !c.password || c.password === password) || localMatches[0];
      if (customerMatch.password && customerMatch.password !== password) {
        throw new Error('invalidPassword');
      }

      // Успішний вхід клієнта
      if (typeof window !== 'undefined') {
        localStorage.setItem('max-sushi-customer', JSON.stringify(customerMatch));
      }
      set({ customer: customerMatch });
      get().checkEligibility(customerMatch.phone);
      get().checkBirthdayUsedThisYear(customerMatch.phone);
      return { type: 'customer', profile: customerMatch };
    }

    // Перевірка 3: Пошук у базі даних Supabase (якщо користувач заходить з нового пристрою або іншого браузера)
    if (isSupabaseConfigured) {
      try {
        let remoteUsers: any[] | null = null;
        if (isEmailLogin && cleanEmail) {
          const { data } = await supabase
            .from('customers')
            .select('*')
            .ilike('email', cleanEmail)
            .limit(10);
          remoteUsers = data;
        } else {
          const phoneNeedle = last9 || (cleanDigits.length >= 7 ? cleanDigits : '');
          if (phoneNeedle) {
            const { data } = await supabase
              .from('customers')
              .select('*')
              .ilike('phone', buildPhoneIlikePattern(phoneNeedle))
              .limit(10);
            remoteUsers = data;
          }
        }

        if (remoteUsers && remoteUsers.length > 0) {
            const remoteUser =
              remoteUsers.find((u) => !u.password || u.password === password) || remoteUsers[0];
            if (remoteUser.password && remoteUser.password !== password) {
              throw new Error('invalidPassword');
            }

            const rawAddr = remoteUser.address && typeof remoteUser.address === 'object' ? { ...remoteUser.address } : undefined;
            const extractedBirthDate = rawAddr?._birthDate as string | undefined;
            const extractedBirthdayUsedYear = rawAddr?._birthdayUsedYear as number | undefined;
            if (rawAddr) {
              delete rawAddr._birthDate;
              delete rawAddr._birthdayUsedYear;
            }
            const cleanDefaultAddress = rawAddr && Object.keys(rawAddr).length > 0 ? rawAddr : undefined;

            const restoredProfile: CustomerProfile = {
              id: remoteUser.id || `cust_${Date.now()}`,
              phone: remoteUser.phone,
              name: remoteUser.name,
              email: remoteUser.email || undefined,
              password: remoteUser.password || password,
              birthDate: extractedBirthDate || undefined,
              birthdayUsedYear: extractedBirthdayUsedYear || undefined,
              defaultAddress: cleanDefaultAddress,
              preferredLanguage: remoteUser.language || 'pl',
              savedAt: remoteUser.updated_at || new Date().toISOString(),
            };

            // Синхронізуємо локально для миттєвого доступу
            db.push(restoredProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem('max-sushi-customers-db', JSON.stringify(db));
              localStorage.setItem('max-sushi-customer', JSON.stringify(restoredProfile));
            }
            set({ customer: restoredProfile });
            get().checkEligibility(restoredProfile.phone);
            get().checkBirthdayUsedThisYear(restoredProfile.phone);
            return { type: 'customer', profile: restoredProfile };
          }
      } catch (e: any) {
        if (e?.message === 'invalidPassword') throw e;
      }
    }

    // Якщо користувач ще не створив пароль, але робив замовлення раніше
    if (cleanPhone.length >= 7) {
      let foundOrderName = '';
      if (typeof window !== 'undefined') {
        try {
          const localOrders: Order[] = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
          const matching = localOrders.find((o) => normalizePhone(o.phone).includes(cleanPhone.slice(-9)));
          if (matching?.name) foundOrderName = matching.name;
        } catch (e) {}
      }

      if (foundOrderName) {
        // Створюємо профіль із введеним паролем для зручності
        const autoProfile: CustomerProfile = {
          id: `cust_${Date.now()}`,
          phone: rawId,
          name: foundOrderName,
          email: rawId.includes('@') ? rawId : undefined,
          password: password,
          preferredLanguage: 'pl',
          savedAt: new Date().toISOString(),
        };
        db.push(autoProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('max-sushi-customers-db', JSON.stringify(db));
          localStorage.setItem('max-sushi-customer', JSON.stringify(autoProfile));
        }
        set({ customer: autoProfile });
        get().checkEligibility(autoProfile.phone);
        return { type: 'customer', profile: autoProfile };
      }
    }

    throw new Error('userNotFound');
  },

  updateProfile: async (data: Partial<CustomerProfile>) => {
    const current = get().customer;
    if (!current) return;

    const updated: CustomerProfile = {
      ...current,
      ...data,
      savedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('max-sushi-customer', JSON.stringify(updated));

      // Оновлюємо також у базі зареєстрованих клієнтів
      const db = getStoredCustomersDb();
      const idx = db.findIndex((c) => c.id === current.id || normalizePhone(c.phone) === normalizePhone(current.phone));
      if (idx !== -1) {
        db[idx] = updated;
      } else {
        db.push(updated);
      }
      localStorage.setItem('max-sushi-customers-db', JSON.stringify(db));
    }

    if (isSupabaseConfigured && updated.phone) {
      try {
        const packedAddress = {
          ...(updated.defaultAddress || {}),
          ...(updated.birthDate ? { _birthDate: updated.birthDate } : {}),
          ...(updated.birthdayUsedYear ? { _birthdayUsedYear: updated.birthdayUsedYear } : {}),
        };
        await supabase.from('customers').upsert(
          {
            phone: updated.phone,
            name: updated.name,
            email: updated.email,
            password: updated.password,
            address: Object.keys(packedAddress).length > 0 ? packedAddress : null,
            language: updated.preferredLanguage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
      } catch (err) {}
    }

    set({
      customer: updated,
      ...(updated.birthdayUsedYear === new Date().getFullYear() ? { isBirthdayUsedThisYear: true } : {}),
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('max-sushi-customer');
    }
    set({ customer: null, activeTab: 'orders', isFirstOrderEligible: false, isBirthdayUsedThisYear: false });
  },

  fetchCustomerOrders: async (): Promise<Order[]> => {
    const customer = get().customer;
    if (!customer || !customer.phone) return [];

    const digits = normalizePhone(customer.phone).slice(-9); // Останні 9 цифр для надійного порівняння
    const ordersMap = new Map<string, Order>();

    // 1. Спочатку додаємо замовлення з LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
        localOrders.forEach((o) => {
          if (normalizePhone(o.phone).includes(digits)) {
            ordersMap.set(o.id, o);
          }
        });
      } catch (e) {
        console.warn('Failed to read local orders:', e);
      }
    }

    // 2. Додаємо або оновлюємо замовлення з Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .ilike('phone', `%${digits}%`)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          data.forEach((d: any) => {
            const rawComment = d.comment || '';
            const matchScheduled = !d.scheduled_time && rawComment.match(/\[НА ЧАС:\s*([^\]]+)\]/i);
            const scheduledTime = d.scheduled_time || d.scheduledTime || (matchScheduled ? matchScheduled[1].trim() : undefined);
            const timingType = d.timing_type || d.timingType || (scheduledTime ? 'scheduled' : 'asap');
            const cleanComment = matchScheduled ? rawComment.replace(/\[НА ЧАС:\s*[^\]]+\]\s*/i, '').trim() : rawComment;

            const parsedOrder: Order = {
              id: String(d.id || ''),
              name: d.customer_name || d.name || 'Клієнт',
              phone: d.phone || '',
              deliveryMethod: d.delivery_method || d.deliveryMethod || 'delivery',
              address: d.address,
              paymentMethod: d.payment_method || d.paymentMethod || 'blik_online',
              changeFrom: d.change_from || d.changeFrom,
              comment: cleanComment,
              personsCount: d.persons_count || d.personsCount || 1,
              timingType: timingType,
              scheduledDate: d.scheduled_date || d.scheduledDate,
              scheduledTime: scheduledTime,
              items: Array.isArray(d.items) ? d.items : [],
              subtotal: Number(d.subtotal || 0),
              deliveryFee: Number(d.delivery_fee ?? d.deliveryFee ?? 0),
              total: Number(d.total || 0),
              status: d.status || 'pending',
              createdAt: d.created_at || d.createdAt || new Date().toISOString(),
            };
            ordersMap.set(parsedOrder.id, parsedOrder);
          });
        }
      } catch (e) {
        console.warn('Failed to load orders for customer from Supabase:', e);
      }
    }

    // Сортуємо замовлення від найновіших до старіших
    return Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
}));

// Фонова перевірка права на знижку на перше замовлення та ДР для збереженого профілю
if (typeof window !== 'undefined') {
  const initCust = getInitialCustomer();
  if (initCust?.phone) {
    checkPhoneHasOrders(initCust.phone).then((hasOrders) => {
      useCustomerStore.setState({ isFirstOrderEligible: !hasOrders });
    });
    const currentYear = new Date().getFullYear();
    if (initCust.birthdayUsedYear === currentYear) {
      useCustomerStore.setState({ isBirthdayUsedThisYear: true });
    } else {
      checkPhoneUsedBirthdayThisYear(initCust.phone).then((used) => {
        useCustomerStore.setState({ isBirthdayUsedThisYear: used });
      });
    }
  }
}
