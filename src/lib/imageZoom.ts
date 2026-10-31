/**
 * Утиліти для адаптивного масштабування фотографій страв
 * Автоматично вирівнює всі страви меню (від міні-макі до супів) за розміром страви
 */

export interface ProductZoomTarget {
  id?: string;
  categoryId?: string;
  nutrition?: {
    zoom?: number | string;
    [key: string]: any;
  } | null;
}

export const ZOOM_PRESETS = [
  { label: 'Суп / Сет', value: 0.88, desc: '88% — для великих мисок супу та широких сетів' },
  { label: 'Компакт', value: 1.05, desc: '105% — для макро-ролів (Komaki, Azuma)' },
  { label: 'Стандарт', value: 1.35, desc: '135% — оптимально для більшості ролів' },
  { label: 'Максі', value: 2.15, desc: '215% — для міні-макі та дрібних шматочків' },
];

export const CALIBRATED_ZOOM_MAP: Record<string, number> = {
  "maki-krewetka": 2.8,
  "maki-losos": 2.65,
  "burger-tecza": 1.14,
  "burger-wege": 1.2,
  "maki-wegorz": 2.8,
  "futomaki-bangkok": 1.8,
  "futomaki-osmiornica": 1.54,
  "futomaki-tokio": 1.86,
  "futomaki-tunczyk": 1.52,
  "futomaki-wegan": 1.96,
  "gyoza-z-kurczakiem": 1.26,
  "rolki-hanami": 2.1,
  "rolki-cheese-light": 2.39,
  "rolki-kalifornia-light": 1.56,
  "lux-okinawa": 1.52,
  "rolki-laguna-red": 1.55,
  "rolki-lawa-losos": 1.52,
  "maki-tempura": 2.17,
  "maki-tunczyk": 2.8,
  "rolki-sakura": 1.48,
  "lux-azuma": 1.51,
  "maki-ogorek": 1.87,
  "lux-mango-fila": 1.3,
  "lux-sunrise": 1.75,
  "pieczone-kamikaze": 1.64,
  "maki-rzodkiew": 2.41,
  "pieczone-lawa-katana": 1.72,
  "tempura-aloha-nami": 1.69,
  "rolki-bonito": 1.14,
  "burger-shrimp": 1.24,
  "futomaki-banzai": 1.76,
  "futomaki-kurama": 2.02,
  "futomaki-losos": 2.15,
  "rolki-kalifornia-masago": 1.58,
  "lux-filadelfia-losos": 1.44,
  "lux-filadelfia-tunczyk": 1.46,
  "lux-favorite": 1.35,
  "lux-fila-lux": 2.01,
  "lux-kanada": 1.4,
  "lux-krolewski-smok": 1.53,
  "lux-mikado": 1.52,
  "lux-zielony-smok": 1.7,
  "lux-zloty-smok": 1.58,
  "rolki-lawa-tunczyk": 1.65,
  "rolki-rock-n-roll": 1.58,
  "lux-komaki": 1.02,
  "lux-matsue": 1.95,
  "rolki-kalifornia-tunczyk-tempura": 1.12,
  "rolki-kalifornia-losos-masago": 1.63,
  "rolki-kalifornia-tunczyk-masago": 1.66,
  "rolki-kalifornia-tunczyk-sezam": 1.76,
  "rolki-miami": 1.79,
  "rolki-miyako": 1.53,
  "rolki-sniezny-krab": 1.82,
  "pieczone-pieczony-krab": 1.84,
  "pieczone-japonia": 1.72,
  "pieczone-lawa-oni": 1.53,
  "pieczone-pieczona-fila": 1.65,
  "tempura-fudzi": 1.72,
  "tempura-krab": 1.77,
  "tempura-losos": 1.67,
  "tempura-tunczyk": 1.64,
  "miso-zupa": 0.88,
  "miso-zupa-krewetki": 0.88,
  "miso-zupa-losos": 0.88,
  "burger-morski": 1.29,
  "burger-salmon": 1.11,
  "burger-tuna": 1.12,
  "duze-spring-rolls": 1.2,
  "poke-krewetki": 1.01,
  "poke-losos": 1.01,
  "poke-tunczyk": 0.96,
  "gyoza-z-miesem": 1.26,
  "maki-awokado": 2.08,
  "maki-tykwa": 2.16,
  "rolki-cheese-ami": 1.75,
  "rolki-czarna-kalifornia": 1.82,
  "rolki-kalifornia-krewetki": 1.58,
  "maki-krab": 2.39
};

/**
 * Повертає оптимальний коефіцієнт масштабу (zoom) для страви
 */
export function getProductZoom(product?: ProductZoomTarget | null): number {
  if (!product) return 1.0;

  // 1. Ручний зум адміністратора (якщо заданий у nutrition.zoom)
  const manualZoom = Number(product.nutrition?.zoom);
  if (!isNaN(manualZoom) && manualZoom >= 0.7 && manualZoom <= 2.8) {
    return Number(manualZoom.toFixed(2));
  }

  // 2. Індивідуальне піксельне калібрування кожного з наявних 79 фото страв
  if (product.id && CALIBRATED_ZOOM_MAP[product.id]) {
    return CALIBRATED_ZOOM_MAP[product.id];
  }

  // 3. Розумні дефолти за категоріями для нових страв
  switch (product.categoryId) {
    case 'mini-maki':
      return 2.25;
    case 'zupy':
      return 0.88;
    case 'zestawy':
      return 1.0;
    case 'sushi-burgery':
      return 1.35;
    case 'poke-bowl':
      return 1.15;
    case 'dodatki':
      return 1.0;
    case 'rolki':
    case 'lux-rolki':
    case 'futomaki':
    case 'pieczone-rolki':
    case 'rolki-tempura':
    default:
      return 1.35;
  }
}
