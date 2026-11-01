import { create } from 'zustand';
import { CustomerProfile, Order, OrderAddress } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface CustomerState {
  customer: CustomerProfile | null;
  isOpen: boolean;
  activeTab: 'orders' | 'profile';
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveTab: (tab: 'orders' | 'profile') => void;
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

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customer: getInitialCustomer(),
  isOpen: false,
  activeTab: 'orders',

  setOpen: (open: boolean) => set({ isOpen: open }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // 1. РЕЄСТРАЦІЯ НОВОГО КЛІЄНТА
  registerCustomer: async ({ phone, name, password, email }) => {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const cleanEmail = email?.trim() || undefined;

    if (!cleanPhone) throw new Error('phoneRequired');
    if (!cleanName) throw new Error('nameRequired');
    if (!password || password.length < 4) throw new Error('passwordTooShort');

    const db = getStoredCustomersDb();

    // Перевірка на вже існуючий номер або e-mail
    const existing = db.find(
      (c) =>
        normalizePhone(c.phone) === normalizePhone(cleanPhone) ||
        (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail.toLowerCase())
    );

    if (existing) {
      throw new Error('userAlreadyExists');
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

    // Зберігаємо в базі користувачів
    db.push(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('max-sushi-customers-db', JSON.stringify(db));
      localStorage.setItem('max-sushi-customer', JSON.stringify(newProfile));
      localStorage.setItem('max-sushi-has-logged-in', 'true');
      localStorage.setItem('max-sushi-last-identifier', cleanPhone);
    }

    // Також спробуємо оновити або зберегти в Supabase таблицю customers (якщо створена)
    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').upsert(
          {
            phone: cleanPhone,
            name: cleanName,
            email: cleanEmail,
            address: defaultAddress,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
      } catch (err) {}
    }

    set({ customer: newProfile });
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

    // Перевірка 1: ВХІД В АДМІНКУ
    // Якщо це системний email та пароль адміна або обліковий запис у Supabase Auth
    const isDirectAdminCredentials =
      cleanEmail === 'makssushiswidnica@gmail.com' && password === 'MaksSushi@2026';

    if (isDirectAdminCredentials) {
      try {
        await supabase.auth.signInWithPassword({
          email: 'makssushiswidnica@gmail.com',
          password: password,
        });
      } catch (e) {}
      if (typeof window !== 'undefined') {
        localStorage.setItem('max-sushi-is-admin', 'true');
        window.dispatchEvent(new Event('admin-auth-changed'));
      }
      return { type: 'admin' };
    }

    // Спроба входу через Supabase Auth для інших адмінів або зареєстрованих поштових акаунтів
    if (rawId.includes('@') && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: rawId,
          password: password,
        });

        if (!error && data?.session) {
          // Якщо це адмінський email або в сесії є права
          if (data.session.user.email?.toLowerCase().includes('makssushi') || data.session.user.email?.toLowerCase().includes('admin')) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('max-sushi-is-admin', 'true');
              window.dispatchEvent(new Event('admin-auth-changed'));
            }
            return { type: 'admin' };
          }
        }
      } catch (e) {}
    }

    // Перевірка 2: ВХІД КЛІЄНТА
    const db = getStoredCustomersDb();
    const customerMatch = db.find((c) => {
      const phoneMatches = cleanPhone.length >= 7 && normalizePhone(c.phone) === cleanPhone;
      const emailMatches = c.email && c.email.toLowerCase() === cleanEmail;
      return phoneMatches || emailMatches;
    });

    if (customerMatch) {
      if (customerMatch.password && customerMatch.password !== password) {
        throw new Error('invalidPassword');
      }

      // Успішний вхід клієнта
      if (typeof window !== 'undefined') {
        localStorage.setItem('max-sushi-customer', JSON.stringify(customerMatch));
      }
      set({ customer: customerMatch });
      return { type: 'customer', profile: customerMatch };
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
        await supabase.from('customers').upsert(
          {
            phone: updated.phone,
            name: updated.name,
            email: updated.email,
            address: updated.defaultAddress,
            language: updated.preferredLanguage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
      } catch (err) {}
    }

    set({ customer: updated });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('max-sushi-customer');
    }
    set({ customer: null, activeTab: 'orders' });
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
