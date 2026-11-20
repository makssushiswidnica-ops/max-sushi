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

export type AllergenKey =
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soy'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export interface AllergenDef {
  key: AllergenKey;
  name: { pl: string; uk: string };
  short: { pl: string; uk: string };
}

export const ALLERGENS: AllergenDef[] = [
  { key: 'gluten', name: { pl: 'Zboża (zawierające gluten)', uk: 'Злаки (з вмістом глютену)' }, short: { pl: 'Zboża', uk: 'Злаки' } },
  { key: 'crustaceans', name: { pl: 'Skorupiaki i produkty pochodne', uk: 'Ракоподібні та продукти з них' }, short: { pl: 'Skorupiaki', uk: 'Ракоподібні' } },
  { key: 'eggs', name: { pl: 'Jaja i produkty pochodne', uk: 'Яйця та продукти з них' }, short: { pl: 'Jaja', uk: 'Яйця' } },
  { key: 'fish', name: { pl: 'Ryby i produkty pochodne', uk: 'Риба та продукти з неї' }, short: { pl: 'Ryby', uk: 'Риба' } },
  { key: 'peanuts', name: { pl: 'Orzeszki ziemne (arachidowe)', uk: 'Арахіс та продукти з нього' }, short: { pl: 'Orzeszki ziemne', uk: 'Арахіс' } },
  { key: 'soy', name: { pl: 'Soja i produkty pochodne', uk: 'Соя та продукти з неї' }, short: { pl: 'Soja', uk: 'Соя' } },
  { key: 'milk', name: { pl: 'Mleko i produkty pochodne', uk: 'Молоко та молочні продукти' }, short: { pl: 'Mleko', uk: 'Молоко' } },
  { key: 'nuts', name: { pl: 'Orzechy (migdały, laskowe, włoskie, nerkowca)', uk: 'Горіхи (мигдаль, лісові, волоські, кешʼю)' }, short: { pl: 'Orzechy', uk: 'Горіхи' } },
  { key: 'celery', name: { pl: 'Seler i produkty pochodne', uk: 'Селера та продукти з неї' }, short: { pl: 'Seler', uk: 'Селера' } },
  { key: 'mustard', name: { pl: 'Gorczyca i produkty pochodne', uk: 'Гірчиця та продукти з неї' }, short: { pl: 'Gorczyca', uk: 'Гірчиця' } },
  { key: 'sesame', name: { pl: 'Nasiona sezamu i produkty pochodne', uk: 'Насіння кунжуту та продукти з нього' }, short: { pl: 'Nasiona sezamu', uk: 'Насіння кунжуту' } },
  { key: 'sulphites', name: { pl: 'Dwutlenek siarki i siarczyny (E220-E228)', uk: 'Діоксид сірки та сульфіти (E220-E228)' }, short: { pl: 'Dwutlenek siarki', uk: 'Діоксид сірки' } },
  { key: 'lupin', name: { pl: 'Łubin i produkty pochodne', uk: 'Люпин та продукти з нього' }, short: { pl: 'Łubin', uk: 'Люпин' } },
  { key: 'molluscs', name: { pl: 'Mięczaki i produkty pochodne', uk: 'Молюски та продукти з них' }, short: { pl: 'Mięczaki', uk: 'Молюски' } },
];

export interface ComboSubItem {
  id: string;
  name: LocalizedString;
  image: string;
  pieces?: number;
  price: number;
  sauce?: SauceChoiceKey;
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
  canBeBaked?: boolean;   // Дозволена опція "Печена риба"
  bakedPrice?: number;    // Ціна за печену рибу (за замовчуванням 1 zł)
  canBeTempura?: boolean; // Дозволена опція "У темпурі"
  tempuraPrice?: number;  // Ціна за темпуру (за замовчуванням 2 zł)
  allergens?: AllergenKey[]; // Список алергенів
  comboItems?: ComboSubItem[]; // Окремі позиції всередині акційного набору
  comboOriginalPrice?: number; // Повна сума набору без знижки
  comboDiscountPercent?: number; // Відсоток знижки набору
  comboEventName?: LocalizedString; // Назва акційної події з адмінки (напр. BLACK FRIDAY)
}

export interface Category {
  id: string;
  name: LocalizedString;
  icon: string;
  image?: string;
  sort_order?: number;
}

export type SauceChoiceKey =
  | 'unagi'
  | 'teriyaki'
  | 'mango-jalapeno'
  | 'sweet-chili'
  | 'sriracha-mayo';

export const TEMPURA_SAUCE_CHOICES: {
  key: SauceChoiceKey;
  name: { pl: string; uk: string };
}[] = [
  { key: 'unagi', name: { pl: 'Sos Unagi', uk: 'Соус Унагі' } },
  { key: 'teriyaki', name: { pl: 'Sos Teriyaki', uk: 'Соус Теріякі' } },
  { key: 'sriracha-mayo', name: { pl: 'Sos Sriracha Mayo', uk: 'Соус Шрірача Майо' } },
  { key: 'sweet-chili', name: { pl: 'Sos Słodkie Chili', uk: 'Соус Солодкий Чилі' } },
  { key: 'mango-jalapeno', name: { pl: 'Sos Mango Jalapeño', uk: 'Соус Манго Халапеньйо' } },
];

export function requiresSauceSelection(
  product?: { id?: string; name?: { pl?: string; uk?: string } | string } | null
): boolean {
  if (!product) return false;
  if (product.id === 'krewetki-tempurze' || product.id === 'kalmar-tempurze') return true;
  const plName = typeof product.name === 'object' ? product.name.pl || '' : String(product.name || '');
  const ukName = typeof product.name === 'object' ? product.name.uk || '' : '';
  return (
    /krewetki w tempurze|kalmar w tempurze/i.test(plName) ||
    /креветки в темпурі|кальмар у темпурі/i.test(ukName)
  );
}

export function getSauceChoiceLabel(key?: SauceChoiceKey, locale: 'pl' | 'uk' = 'pl'): string {
  if (!key) return '';
  const found = TEMPURA_SAUCE_CHOICES.find((s) => s.key === key);
  return found ? found.name[locale] : key;
}

export interface SelectedProductOptions {
  baked?: boolean;
  tempura?: boolean;
  sauce?: SauceChoiceKey;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isGift?: boolean;
  selectedOptions?: SelectedProductOptions;
}

export type DeliveryZoneId = 'city' | 'suburb' | 'suburb_5km' | 'suburb_10km';

export interface FirstOrderPromo {
  enabled: boolean;
  discountPercent: number; // Наприклад 10%
}

export interface BirthdayPromo {
  enabled: boolean;
  discountPercent: number; // Наприклад 10%
}

export interface PromoComboSlot {
  /** Список ID страв у цьому віконці. Якщо > 1, клієнт на сайті обирає одну з них ("на вибір") */
  productIds: string[];
}

export interface PromoComboItem {
  id: string;
  /** Опціональна власна назва комбо (PL / UK). Якщо порожня — генерується зі страв */
  title?: LocalizedString;
  /** Від 2 до 5 позицій у наборі (1 + 1 ... до 5) */
  slots: PromoComboSlot[];
  /** Відсоток знижки на набір (наприклад 10 або 15) */
  discountPercent: number;
}

export interface EventCombosPromo {
  enabled: boolean;
  /** Назва події / категорії в меню (наприклад "BLACK FRIDAY") */
  eventName: LocalizedString;
  combos: PromoComboItem[];
}

export interface StoreSettings {
  cityFreeThreshold: number;
  cityStandardFee: number;
  suburb10kmFee: number;
  suburb5kmFee?: number;
  isOrdersPaused?: boolean;
  giftPromo: {
    enabled: boolean;
    minAmount: number;
    productId: string;
  };
  firstOrderPromo?: FirstOrderPromo;
  birthdayPromo?: BirthdayPromo;
  eventCombosPromo?: EventCombosPromo;
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
  firstOrderDiscount?: number;
  isBirthday?: boolean;
  birthdayDiscount?: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'in_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  birthDate?: string; // YYYY-MM-DD
  birthdayUsedYear?: number;
  hadGuestOrders?: boolean; // Чи мав замовлення як гість до реєстрації
  defaultAddress?: OrderAddress;
  preferredLanguage?: 'pl' | 'uk';
  savedAt: string;
}

export interface GuestProfile {
  id: string;
  phone: string;
  name: string;
  address?: OrderAddress;
  ordersCount?: number;
  lastOrderId?: string;
  createdAt: string;
  updatedAt: string;
}
