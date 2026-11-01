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
  login: (phone: string, name?: string) => Promise<CustomerProfile>;
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

  login: async (phone: string, name?: string) => {
    const cleanPhone = phone.trim();
    let customerName = name?.trim() || '';
    let defaultAddress: OrderAddress | undefined = undefined;

    // Спробуємо підтягнути імʼя та останню адресу з історії замовлень, якщо імʼя не вказано
    try {
      if (typeof window !== 'undefined') {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
        const matchingLocal = localOrders.find(
          (o) => normalizePhone(o.phone) === normalizePhone(cleanPhone)
        );
        if (matchingLocal) {
          if (!customerName && matchingLocal.name) customerName = matchingLocal.name;
          if (matchingLocal.address?.street) defaultAddress = matchingLocal.address;
        }
      }

      // Перевіряємо в Supabase
      if (isSupabaseConfigured) {
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*')
          .ilike('phone', `%${normalizePhone(cleanPhone).slice(-9)}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (dbOrders && dbOrders.length > 0) {
          const latest = dbOrders[0];
          if (!customerName && (latest.customer_name || latest.name)) {
            customerName = latest.customer_name || latest.name;
          }
          if (!defaultAddress && latest.address?.street) {
            defaultAddress = latest.address;
          }
        }
      }
    } catch (e) {
      console.warn('Auto-detect customer info notice:', e);
    }

    if (!customerName) {
      customerName = 'Гість';
    }

    const newProfile: CustomerProfile = {
      id: `cust_${Date.now()}`,
      phone: cleanPhone,
      name: customerName,
      defaultAddress,
      preferredLanguage: 'pl',
      savedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('max-sushi-customer', JSON.stringify(newProfile));
    }

    // Спроба збереження в таблицю Supabase `customers` (якщо існує)
    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').upsert(
          {
            phone: cleanPhone,
            name: customerName,
            address: defaultAddress,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
      } catch (err) {
        // Якщо таблиця customers ще не створена, продовжуємо без помилки
      }
    }

    set({ customer: newProfile });
    return newProfile;
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
    }

    if (isSupabaseConfigured && updated.phone) {
      try {
        await supabase.from('customers').upsert(
          {
            phone: updated.phone,
            name: updated.name,
            address: updated.defaultAddress,
            language: updated.preferredLanguage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
      } catch (err) {
        // Безшумний фолбек
      }
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
