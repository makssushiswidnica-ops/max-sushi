export type Locale = 'pl' | 'uk';

export interface Nutrition {
  calories: number; // ккал
  proteins: number; // г
  fats: number;     // г
  carbs: number;    // г
  sku?: string;
  discountPercent?: number;
  zoom?: number;
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
  sku?: string; // Артикул / номер страви на касі (PLU)
  discountPercent?: 0 | 10 | 15; // Знижка 0, 10 або 15%
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
  canBeBaked?: boolean;   // Дозволена опція "Печена риба" (+1 zł)
  canBeTempura?: boolean; // Дозволена опція "У темпурі" (+2 zł)
}

export interface Category {
  id: string;
  name: LocalizedString;
  icon: string;
  image?: string;
  sort_order?: number;
}

export interface SelectedProductOptions {
  baked?: boolean;
  tempura?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isGift?: boolean;
  selectedOptions?: SelectedProductOptions;
}

export type DeliveryZoneId = 'city' | 'suburb' | 'suburb_5km' | 'suburb_10km';

export interface StoreSettings {
  cityFreeThreshold: number;
  cityStandardFee: number;
  suburb10kmFee: number;
  suburb5kmFee?: number;
  giftPromo: {
    enabled: boolean;
    minAmount: number;
    productId: string;
  };
  soundNotificationsEnabled: boolean;
}

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card_courier' | 'blik_online';
export type OrderTimingType = 'asap' | 'scheduled';

export interface OrderAddress {
  zone?: DeliveryZoneId;
  city?: string;
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
  timingType?: OrderTimingType;
  scheduledDate?: 'today' | 'tomorrow';
  scheduledTime?: string; // e.g. "18:30" or ISO
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

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  defaultAddress?: OrderAddress;
  preferredLanguage?: 'pl' | 'uk';
  savedAt: string;
}
