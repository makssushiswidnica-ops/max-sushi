import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '@/types';
import { brandTheme } from '@/config/theme';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  selectedProduct: Product | null;
  isCheckoutOpen: boolean;
  personsCount: number;

  // Дії кошика
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

  // Обчислення
  getTotalCount: () => number;
  getSubtotal: () => number;
  getDeliveryFee: (isPickup?: boolean) => number;
  getTotal: (isPickup?: boolean) => number;
  getRemainingForFreeDelivery: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      selectedProduct: null,
      isCheckoutOpen: false,
      personsCount: 1,
      activeCardId: null,
      setActiveCardId: (id: string | null) => set({ activeCardId: id }),
      isMenuOpen: false,
      setIsMenuOpen: (open: boolean) => set({ isMenuOpen: open }),

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += quantity;
            return { items: updatedItems };
          }

          return {
            items: [...state.items, { product, quantity }],
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.product.id !== productId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          };
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
        return items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      },

      getDeliveryFee: (isPickup = false) => {
        if (isPickup) return 0;
        const subtotal = get().getSubtotal();
        if (subtotal >= brandTheme.delivery.freeDeliveryThreshold || subtotal === 0) {
          return 0;
        }
        return brandTheme.delivery.deliveryFee;
      },

      getTotal: (isPickup = false) => {
        const subtotal = get().getSubtotal();
        const deliveryFee = get().getDeliveryFee(isPickup);
        if (isPickup) {
          // Знижка на самовивіз 10%
          const discounted = Math.round(subtotal * (1 - brandTheme.delivery.pickupDiscountPercent / 100));
          return discounted;
        }
        return subtotal + deliveryFee;
      },

      getRemainingForFreeDelivery: () => {
        const subtotal = get().getSubtotal();
        const threshold = brandTheme.delivery.freeDeliveryThreshold;
        if (subtotal >= threshold) return 0;
        return threshold - subtotal;
      },
    }),
    {
      name: 'max-sushi-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Зберігаємо в LocalStorage тільки елементи кошика та кількість приборів, щоб модалки не залишалися відкритими при перезавантаженні
      partialize: (state) => ({
        items: state.items,
        personsCount: state.personsCount,
      }),
    }
  )
);
