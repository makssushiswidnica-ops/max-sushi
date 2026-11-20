import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, Category, DeliveryZoneId, SelectedProductOptions } from '@/types';
import { brandTheme } from '@/config/theme';
import { getEffectivePrice, getItemUnitPrice, isPromotionalProduct } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { products as defaultProducts } from '@/lib/mockData';

export function isSameProductOptions(a?: SelectedProductOptions, b?: SelectedProductOptions): boolean {
  return (
    Boolean(a?.baked) === Boolean(b?.baked) &&
    Boolean(a?.tempura) === Boolean(b?.tempura) &&
    (a?.sauce || '') === (b?.sauce || '')
  );
}

function syncGiftItem(items: CartItem[], menuProducts: Product[]): CartItem[] {
  try {
    const settings = useSettingsStore.getState();
    const rawItems = items.filter((i) => !i.isGift);
    const subtotal = rawItems.reduce(
      (sum, item) => sum + getItemUnitPrice(item.product, item.selectedOptions) * item.quantity,
      0
    );

    if (
      settings.giftPromo?.enabled &&
      subtotal >= settings.giftPromo.minAmount &&
      rawItems.length > 0
    ) {
      const giftProdId = settings.giftPromo.productId || 'maki-ogorek';
      const allDishes = menuProducts && menuProducts.length > 0 ? menuProducts : defaultProducts;
      const found =
        allDishes.find((p) => p.id === giftProdId) ||
        defaultProducts.find((p) => p.id === giftProdId) ||
        allDishes[0];

      if (found) {
        const giftItem: CartItem = {
          product: { ...found, price: 0 },
          quantity: 1,
          isGift: true,
        };
        const existingGiftIdx = items.findIndex((i) => i.isGift);
        if (existingGiftIdx > -1) {
          if (items[existingGiftIdx].product.id === found.id) {
            return items;
          }
          const next = [...rawItems];
          next.push(giftItem);
          return next;
        }
        return [...rawItems, giftItem];
      }
    }
    return rawItems;
  } catch {
    return items;
  }
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  selectedProduct: Product | null;
  isCheckoutOpen: boolean;
  personsCount: number;
  isChopsticksSelected: boolean;

  // Меню страв з бази даних Supabase для швидкого доступу та навігації в модалці
  menuProducts: Product[];
  setMenuProducts: (products: Product[]) => void;
  menuCategories: Category[];
  setMenuCategories: (categories: Category[]) => void;

  // Дії кошика
  addItem: (product: Product, quantity?: number, selectedOptions?: SelectedProductOptions) => void;
  removeItem: (productId: string, selectedOptions?: SelectedProductOptions) => void;
  updateQuantity: (productId: string, quantity: number, selectedOptions?: SelectedProductOptions) => void;
  clearCart: () => void;
  
  // Керування панелями та модалками
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setSelectedProduct: (product: Product | null) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setPersonsCount: (count: number) => void;

  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;

  // Час очікування приготування/доставки від закладу (в хвилинах)
  prepWaitTimeMinutes: number;
  setPrepWaitTimeMinutes: (minutes: number) => void;

  // Компактний вигляд меню (2 колонки на телефоні)
  isCompactView: boolean;
  setIsCompactView: (compact: boolean) => void;
  toggleCompactView: () => void;

  // Обчислення
  getTotalCount: () => number;
  getSubtotal: () => number;
  getDeliveryFee: (isPickup?: boolean, zone?: DeliveryZoneId, customFee?: number) => number;
  getTotal: (isPickup?: boolean, zone?: DeliveryZoneId, customFee?: number) => number;
  getRemainingForFreeDelivery: () => number;
}

function readLatestPersistedItems(fallbackItems: CartItem[]): CartItem[] {
  if (typeof window === 'undefined') return fallbackItems;
  try {
    const raw = localStorage.getItem('max-sushi-cart-storage');
    if (!raw) return fallbackItems;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.state?.items)) {
      return parsed.state.items;
    }
  } catch {
    // ignore
  }
  return fallbackItems;
}

const safeCartLocalStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch {
      // Якщо LocalStorage переповнений старими історіями замовлень — очищуємо зайвий кеш і повторюємо запис кошика
      try {
        localStorage.removeItem('max-sushi-orders');
        localStorage.setItem(name, value);
      } catch {
        // ignore
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      selectedProduct: null,
      menuProducts: [],
      setMenuProducts: (products: Product[]) => {
        set((state) => {
          const latestItems = readLatestPersistedItems(state.items);
          return {
            menuProducts: products,
            items: syncGiftItem(latestItems, products),
          };
        });
      },
      menuCategories: [],
      setMenuCategories: (categories: Category[]) =>
        set((state) => ({
          menuCategories: categories,
          items: state.items.length > 0 ? state.items : readLatestPersistedItems(state.items),
        })),
      isCheckoutOpen: false,
      personsCount: 1,
      isChopsticksSelected: false,
      activeCardId: null,
      setActiveCardId: (id: string | null) => set({ activeCardId: id }),
      isMenuOpen: false,
      setIsMenuOpen: (open: boolean) =>
        set((state) =>
          state.isMenuOpen === open
            ? state
            : {
                isMenuOpen: open,
                items: state.items.length > 0 ? state.items : readLatestPersistedItems(state.items),
              }
        ),
      prepWaitTimeMinutes: 40,
      setPrepWaitTimeMinutes: (minutes: number) => {
        const clamped = Math.max(10, Math.min(minutes, 240));
        set((state) => {
          const latestItems = readLatestPersistedItems(state.items);
          if (state.prepWaitTimeMinutes === clamped && latestItems.length === state.items.length) {
            return state;
          }
          return {
            prepWaitTimeMinutes: clamped,
            items: latestItems,
          };
        });
      },
      isCompactView: true,
      setIsCompactView: (compact: boolean) => set({ isCompactView: compact }),
      toggleCompactView: () => set((state) => ({ isCompactView: !state.isCompactView })),

      addItem: (product: Product, quantity = 1, selectedOptions?: SelectedProductOptions) => {
        set((state) => {
          const targetSku = product.sku || (product as any).nutrition?.sku || state.menuProducts.find(p => p.id === product.id)?.sku || defaultProducts.find(p => p.id === product.id)?.sku;
          const safeProduct = targetSku && !product.sku ? { ...product, sku: targetSku } : product;

          const baseItems = state.items.length > 0 ? state.items : readLatestPersistedItems(state.items);
          const rawItems = baseItems.filter((i) => !i.isGift);
          const existingIndex = rawItems.findIndex(
            (item) => item.product.id === safeProduct.id && isSameProductOptions(item.selectedOptions, selectedOptions)
          );

          let updated: CartItem[];
          if (existingIndex > -1) {
            updated = rawItems.map((item, idx) =>
              idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
            );
          } else {
            updated = [...rawItems, { product: safeProduct, quantity, selectedOptions }];
          }

          return { items: syncGiftItem(updated, state.menuProducts) };
        });
      },

      removeItem: (productId: string, selectedOptions?: SelectedProductOptions) => {
        set((state) => {
          const rawItems = state.items.filter((i) => !i.isGift);
          const updated = rawItems.filter(
            (item) => !(item.product.id === productId && (selectedOptions === undefined || isSameProductOptions(item.selectedOptions, selectedOptions)))
          );
          const synced = syncGiftItem(updated, state.menuProducts);
          return {
            items: synced,
            ...(synced.length === 0 ? { isChopsticksSelected: false, personsCount: 1 } : {}),
          };
        });
      },

      updateQuantity: (productId: string, quantity: number, selectedOptions?: SelectedProductOptions) => {
        set((state) => {
          const rawItems = state.items.filter((i) => !i.isGift);
          let updated: CartItem[];
          if (quantity <= 0) {
            updated = rawItems.filter(
              (item) => !(item.product.id === productId && (selectedOptions === undefined || isSameProductOptions(item.selectedOptions, selectedOptions)))
            );
          } else {
            const exists = rawItems.some(
              (item) => item.product.id === productId && (selectedOptions === undefined || isSameProductOptions(item.selectedOptions, selectedOptions))
            );
            if (exists) {
              updated = rawItems.map((item) =>
                item.product.id === productId && (selectedOptions === undefined || isSameProductOptions(item.selectedOptions, selectedOptions))
                  ? { ...item, quantity }
                  : item
              );
            } else {
              const allDishes = state.menuProducts?.length ? state.menuProducts : defaultProducts;
              const prod = allDishes.find((p) => p.id === productId) || defaultProducts.find((p) => p.id === productId);
              if (prod) {
                updated = [...rawItems, { product: prod, quantity, selectedOptions }];
              } else {
                updated = rawItems;
              }
            }
          }
          const synced = syncGiftItem(updated, state.menuProducts);
          return {
            items: synced,
            ...(synced.length === 0 ? { isChopsticksSelected: false, personsCount: 1 } : {}),
          };
        });
      },

      clearCart: () => {
        set({ items: [], isChopsticksSelected: false, personsCount: 1 });
      },

      setOpen: (open: boolean) => {
        set({ isOpen: open });
      },

      toggleOpen: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      setSelectedProduct: (product: Product | null) => {
        set({ selectedProduct: product });
      },

      setIsCheckoutOpen: (open: boolean) => {
        set({ isCheckoutOpen: open });
      },

      setPersonsCount: (count: number) => {
        set({
          personsCount: Math.max(0, Math.min(count, 20)),
          isChopsticksSelected: true,
        });
      },

      getTotalCount: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
          if (item.isGift) return sum;
          return sum + getItemUnitPrice(item.product, item.selectedOptions) * item.quantity;
        }, 0);
      },

      getDeliveryFee: (isPickup = false, zone: DeliveryZoneId = 'city', customFee?: number) => {
        if (isPickup) return 0;
        if (customFee !== undefined) return customFee;
        const subtotal = get().getSubtotal();
        const settings = useSettingsStore.getState();
        return settings.getDeliveryFee(zone, subtotal, isPickup);
      },

      getTotal: (isPickup = false, zone: DeliveryZoneId = 'city', customFee?: number) => {
        const subtotal = get().getSubtotal();
        const deliveryFee = get().getDeliveryFee(isPickup, zone, customFee);
        if (isPickup) {
          const { items } = get();
          const pickupDiscountRate = (brandTheme.delivery.pickupDiscountPercent || 5) / 100;
          // Знижка на самовивіз 5% застосовується ТІЛЬКИ до страв без акційної знижки (акції не плюсуються)
          const discountedTotal = items.reduce((sum, item) => {
            if (item.isGift) return sum;
            const unitPrice = getItemUnitPrice(item.product, item.selectedOptions);
            const lineTotal = unitPrice * item.quantity;
            const hasPromoDiscount = isPromotionalProduct(item.product);
            const effectiveLineTotal = hasPromoDiscount
              ? lineTotal
              : lineTotal * (1 - pickupDiscountRate);
            return sum + effectiveLineTotal;
          }, 0);
          return Math.round(discountedTotal);
        }
        return subtotal + deliveryFee;
      },

      getRemainingForFreeDelivery: () => {
        const subtotal = get().getSubtotal();
        const settings = useSettingsStore.getState();
        return settings.getRemainingForFreeCity(subtotal);
      },
    }),
    {
      name: 'max-sushi-cart-storage',
      storage: createJSONStorage(() => safeCartLocalStorage),
      // Зберігаємо в LocalStorage тільки елементи кошика, кількість приборів та час очікування
      partialize: (state) => ({
        items: state.items,
        personsCount: state.personsCount,
        isChopsticksSelected: state.isChopsticksSelected,
        prepWaitTimeMinutes: state.prepWaitTimeMinutes,
        isCompactView: state.isCompactView,
        compactGridDefaultV2: true,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        items: Array.isArray(persistedState?.items) ? persistedState.items : currentState.items,
        isCompactView: persistedState?.compactGridDefaultV2
          ? persistedState.isCompactView
          : true,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('store-settings-updated', () => {
    useCartStore.setState((state) => {
      const latestItems = readLatestPersistedItems(state.items);
      const nextItems = syncGiftItem(latestItems, state.menuProducts);
      const sameLength = nextItems.length === state.items.length;
      const sameIds =
        sameLength &&
        nextItems.every(
          (item, idx) =>
            item.product.id === state.items[idx]?.product.id &&
            item.quantity === state.items[idx]?.quantity &&
            Boolean(item.isGift) === Boolean(state.items[idx]?.isGift)
        );
      if (sameIds) return state;
      return { items: nextItems };
    });
  });

  // Синхронізація кошика між вкладками (щоб відкрита вкладка адмінки не перезаписувала кошик сайту своїм старим станом)
  window.addEventListener('storage', (e) => {
    if (e.key === 'max-sushi-cart-storage') {
      useCartStore.persist.rehydrate();
    }
  });
}
