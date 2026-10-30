/**
 * Утиліти для адаптивного масштабування фотографій страв
 * Вирішує проблему різного кадрування фотографа (віддалені міні-макі проти макро-супів)
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
  { label: 'Суп / Сет', value: 0.92, desc: '92% — для великих мисок супу та широких сетів' },
  { label: 'Компакт', value: 1.05, desc: '105% — для макро-ролів (Komaki, Azuma)' },
  { label: 'Стандарт', value: 1.22, desc: '122% — оптимально для більшості ролів' },
  { label: 'Максі', value: 1.45, desc: '145% — для міні-макі та дрібних шматочків' },
];

/**
 * Повертає оптимальний коефіцієнт масштабу (zoom) для страви
 */
export function getProductZoom(product?: ProductZoomTarget | null): number {
  if (!product) return 1.0;

  // 1. Ручний зум адміністратора (якщо заданий у nutrition.zoom)
  const manualZoom = Number(product.nutrition?.zoom);
  if (!isNaN(manualZoom) && manualZoom >= 0.7 && manualZoom <= 2.2) {
    return Number(manualZoom.toFixed(2));
  }

  // 2. Специфічні страви, зняті фотографом надто близько або з високими пластівцями
  if (product.id === 'lux-komaki' || product.id === 'komaki') return 1.02;
  if (product.id?.includes('azuma')) return 1.08;

  // 3. Розумні дефолти за категоріями страв
  switch (product.categoryId) {
    case 'mini-maki':
      return 1.45; // Міні-макі зняті здалеку з 80% порожнього фону
    case 'zupy':
      return 0.92; // Миски супів зняті впритик до країв кадру
    case 'zestawy':
      return 1.0;  // Дошки сетів на 30-50 шт мають бути видимі повністю
    case 'sushi-burgery':
      return 1.12;
    case 'poke-bowl':
      return 1.06;
    case 'dodatki':
      return 1.0;
    case 'rolki':
    case 'lux-rolki':
    case 'futomaki':
    case 'pieczone-rolki':
    case 'rolki-tempura':
    default:
      return 1.22; // Ідеальний апетитний розмір без вилазіння за межі
  }
}

