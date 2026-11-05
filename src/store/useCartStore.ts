import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, Category, DeliveryZoneId, SelectedProductOptions } from '@/types';
import { brandTheme } from '@/config/theme';
import { getEffectivePrice, getItemUnitPrice } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { products as defaultProducts } from '@/lib/mockData';

export function isSameProductOptions(a?: SelectedProductOptions, b?: SelectedProductOptions): boolean {
  return Boolean(a?.baked) === Boolean(b?.baked) && Boolean(a?.tempura) === Boolean(b?.tempura);
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      selectedProduct: null,
      menuProducts: [],
      setMenuProducts: (products: Product[]) => {
        set((state) => ({
          menuProducts: products,
          items: syncGiftItem(state.items, products),
        }));
      },
      menuCategories: [],
      setMenuCategories: (categories: Category[]) => set({ menuCategories: categories }),
      isCheckoutOpen: false,
      personsCount: 1,
      activeCardId: null,
      setActiveCardId: (id: string | null) => set({ activeCardId: id }),
      isMenuOpen: false,
      setIsMenuOpen: (open: boolean) => set({ isMenuOpen: open }),
      prepWaitTimeMinutes: 40,
      setPrepWaitTimeMinutes: (minutes: number) => set({ prepWaitTimeMinutes: Math.max(10, Math.min(minutes, 240)) }),
      isCompactView: false,
      setIsCompactView: (compact: boolean) => set({ isCompactView: compact }),
      toggleCompactView: () => set((state) => ({ isCompactView: !state.isCompactView })),

      addItem: (product: Product, quantity = 1, selectedOptions?: SelectedProductOptions) => {
        set((state) => {
          const rawItems = state.items.filter((i) => !i.isGift);
          const existingIndex = rawItems.findIndex(
            (item) => item.product.id === product.id && isSameProductOptions(item.selectedOptions, selectedOptions)
          );

          let updated: CartItem[];
          if (existingIndex > -1) {
            updated = [...rawItems];
            updated[existingIndex].quantity += quantity;
          } else {
            updated = [...rawItems, { product, quantity, selectedOptions }];
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
          return { items: syncGiftItem(updated, state.menuProducts) };
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
          return { items: syncGiftItem(updated, state.menuProducts) };
        });
      },

      clearCart: () => {
        set({ items: [] });
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
        set({ personsCount: Math.max(1, Math.min(count, 20)) });
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
            const hasPromoDiscount = (item.product.discountPercent || 0) > 0;
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
      storage: createJSONStorage(() => localStorage),
      // Зберігаємо в LocalStorage тільки елементи кошика, кількість приборів та час очікування
      partialize: (state) => ({
        items: state.items,
        personsCount: state.personsCount,
        prepWaitTimeMinutes: state.prepWaitTimeMinutes,
        isCompactView: state.isCompactView,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('store-settings-updated', () => {
    useCartStore.setState((state) => ({
      items: syncGiftItem(state.items, state.menuProducts),
    }));
  });
}
