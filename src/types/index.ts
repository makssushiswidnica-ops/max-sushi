export type Locale = 'pl' | 'uk';

export interface Nutrition {
  calories: number; // ккал
  proteins: number; // г
  fats: number;     // г
  carbs: number;    // г
}

export type ProductBadge = 'hit' | 'new' | 'spicy' | 'veg' | 'sale';

export interface LocalizedString {
  pl: string;
  uk: string;
}

export interface LocalizedArray {
  pl: string[];
  uk: string[];
}

export interface Product {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number; // в PLN / грн
  weight: number; // грами
  pieces?: number; // кількість шматочків
  categoryId: string;
  image: string;
  images?: string[];
  badge?: ProductBadge;
  ingredients: LocalizedArray;
  nutrition: Nutrition;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: LocalizedString;
  icon: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card_courier' | 'blik_online';

export interface OrderAddress {
  street: string;
  house: string;
  apartment?: string;
  floor?: string;
  entryCode?: string;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  address?: OrderAddress;
  paymentMethod: PaymentMethod;
  comment?: string;
  changeFrom?: string; // решта з купюри
  personsCount: number;
}

export interface Order extends CheckoutFormData {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'in_delivery' | 'delivered';
  createdAt: string;
}
