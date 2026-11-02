import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreSettings, DeliveryZoneId } from '@/types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  cityFreeThreshold: 150, // Поріг безкоштовної доставки по Свідниці (150 zł)
  cityStandardFee: 12,    // Стандартна ціна по Свідниці якщо менше 150 zł
  suburb10kmFee: 25,      // За місто до 10 км (завжди платна, 25 zł)
  giftPromo: {
    enabled: true,
    minAmount: 150,       // Подарунок від 150 zł
    productId: 'maki-ogorek', // Страва в подарунок за замовчуванням (Макі Огірок)
  },
  soundNotificationsEnabled: true,
};

interface SettingsStoreState extends StoreSettings {
  updateSettings: (updates: Partial<StoreSettings>) => void;
  getDeliveryFee: (zone: DeliveryZoneId, subtotal: number, isPickup?: boolean) => number;
  getRemainingForFreeCity: (subtotal: number) => number;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STORE_SETTINGS,

      updateSettings: (updates) => {
        set((state) => {
          const next = { ...state, ...updates };
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('store-settings-updated', { detail: next }));
          }
          return next;
        });
      },

      getDeliveryFee: (zone: DeliveryZoneId, subtotal: number, isPickup = false) => {
        if (isPickup) return 0;
        const state = get();

        // За місто (до 10 км)
        if (zone === 'suburb' || zone === 'suburb_10km' || zone === 'suburb_5km') {
          return state.suburb10kmFee;
        }

        // Місто (Świdnica)
        if (subtotal >= state.cityFreeThreshold || subtotal === 0) {
          return 0;
        }
        return state.cityStandardFee;
      },

      getRemainingForFreeCity: (subtotal: number) => {
        const threshold = get().cityFreeThreshold;
        if (subtotal >= threshold) return 0;
        return threshold - subtotal;
      },
    }),
    {
      name: 'max-sushi-store-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

