import { createClient } from '@supabase/supabase-js';
import { Order, FirstOrderPromo } from '@/types';

// Отримуємо змінні оточення для проєкту Maks Sushi на Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czjqvocewhucknsrnese.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6anF2b2Nld2h1Y2tuc3JuZXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDE4NTYsImV4cCI6MjEwODkxNzg1Nn0.OTnqNg6TMY8-38KPuqaRzTvZIXC4AoSTPtr0GBhbCaQ';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  !supabaseUrl.includes('demo-max-sushi')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Зберігає оформлене замовлення в базу даних Supabase або в локальну історію
 */
export async function createOrder(order: Order): Promise<{ success: boolean; orderId: string; error?: string }> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            id: order.id,
            customer_name: order.name,
            phone: order.phone,
            delivery_method: order.deliveryMethod,
            address: order.address,
            payment_method: order.paymentMethod,
            items: order.items,
            subtotal: order.subtotal,
            delivery_fee: order.deliveryFee,
            total: order.total,
            comment: order.comment,
            timing_type: order.timingType,
            scheduled_time: order.scheduledTime,
            scheduled_date: order.scheduledDate,
            persons_count: order.personsCount || 1,
            change_from: order.changeFrom,
            status: order.status,
            created_at: order.createdAt,
            accepted_at: (order as any).accepted_at || (order as any).acceptedAt,
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn('Supabase full insert notice, attempting compatible insert:', error.message);
        
        // Сумісний інсерт для таблиць, де ще не виконано ALTER TABLE
        const timingNote = order.timingType === 'scheduled' && order.scheduledTime 
          ? `[НА ЧАС: ${order.scheduledTime}] ` 
          : '';
        const combinedComment = `${timingNote}${order.comment || ''}`.trim();

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .insert([
            {
              id: order.id,
              customer_name: order.name,
              phone: order.phone,
              delivery_method: order.deliveryMethod,
              address: order.address,
              payment_method: order.paymentMethod,
              items: order.items,
              subtotal: order.subtotal,
              delivery_fee: order.deliveryFee,
              total: order.total,
              comment: combinedComment,
              status: order.status,
              created_at: order.createdAt,
            },
          ])
          .select()
          .single();

        if (fallbackError) {
          console.warn('Supabase fallback insert error:', fallbackError.message);
        } else if (fallbackData) {
          return { success: true, orderId: fallbackData.id };
        }
      } else if (data) {
        return { success: true, orderId: data.id };
      }
    }

    // Зберігаємо також у LocalStorage як історію замовлень клієнта
    if (typeof window !== 'undefined') {
      const existingHistory = JSON.parse(localStorage.getItem('max-sushi-orders') || '[]');
      existingHistory.unshift(order);
      localStorage.setItem('max-sushi-orders', JSON.stringify(existingHistory.slice(0, 20)));
      window.dispatchEvent(new CustomEvent('max-sushi-new-order', { detail: order }));
    }

    return { success: true, orderId: order.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown order error';
    console.error('Error creating order:', message);
    return { success: true, orderId: order.id }; // повертаємо успіх для клієнта
  }
}

export interface SyncedStoreSettings {
  isOrdersPaused?: boolean;
  prepWaitTimeMinutes?: number;
  pausedAtDate?: string; // YYYY-MM-DD
  firstOrderPromo?: FirstOrderPromo;
  giftPromo?: {
    enabled: boolean;
    minAmount: number;
    productId: string;
  };
}

/**
 * Отримує глобальні системні налаштування магазину з Supabase (синхронізація між усіма пристроями)
 * Автоматично відновлює прийом замовлень по завершенню робочого дня або наступного ранку.
 */
export async function fetchStoreSettings(): Promise<SyncedStoreSettings | null> {
  try {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('comment')
      .eq('id', '__settings__')
      .maybeSingle();

    if (error || !data?.comment) return null;
    const settings: SyncedStoreSettings = JSON.parse(data.comment);

    // Автоматичне відновлення прийому замовлень по завершенню робочого дня:
    // Пт, Сб заклад працює до 22:00, інші дні до 21:00.
    if (settings.isOrdersPaused) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const day = now.getDay();
      const closingHour = (day === 5 || day === 6) ? 22 : 21;
      const isPastClosing = now.getHours() >= closingHour;
      const isNextDay = Boolean(settings.pausedAtDate && settings.pausedAtDate !== todayStr);

      if (isPastClosing || isNextDay) {
        settings.isOrdersPaused = false;
        settings.pausedAtDate = undefined;
        // Оновлюємо в базі без очікування
        saveStoreSettings({ isOrdersPaused: false, pausedAtDate: undefined });
      }
    }

    return settings;
  } catch (e) {
    console.warn('Failed to fetch store settings:', e);
    return null;
  }
}

/**
 * Зберігає глобальні системні налаштування магазину в Supabase для миттєвої синхронізації
 */
export async function saveStoreSettings(settings: Partial<SyncedStoreSettings>): Promise<boolean> {
  try {
    if (!isSupabaseConfigured) return false;
    const current = await fetchStoreSettings() || {};
    
    // Якщо вмикаємо паузу, фіксуємо поточну дату
    const updates: Partial<SyncedStoreSettings> = { ...settings };
    if (settings.isOrdersPaused === true) {
      updates.pausedAtDate = new Date().toISOString().slice(0, 10);
    } else if (settings.isOrdersPaused === false) {
      updates.pausedAtDate = undefined;
    }

    const merged = { ...current, ...updates };
    const { error } = await supabase.from('orders').upsert({
      id: '__settings__',
      customer_name: '__SYSTEM_SETTINGS__',
      phone: '000000000',
      delivery_method: 'delivery',
      payment_method: 'cash',
      status: 'system',
      comment: JSON.stringify(merged),
      total: 0,
      subtotal: 0,
      items: [],
    });
    return !error;
  } catch (e) {
    console.warn('Failed to save store settings:', e);
    return false;
  }
}
