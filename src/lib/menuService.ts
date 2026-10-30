import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Category, Product } from '@/types';
import { categories as defaultCategories, products as defaultProducts } from '@/lib/mockData';

export interface MenuData {
  categories: Category[];
  products: Product[];
}

/**
 * Отримує всі категорії та страви з бази даних Supabase.
 * Якщо база порожня або недоступна, безпечно повертає локальні default mock-дані.
 */
export async function fetchMenuData(): Promise<MenuData> {
  if (!isSupabaseConfigured) {
    return { categories: defaultCategories, products: defaultProducts };
  }

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('*').order('id', { ascending: true }),
    ]);

    if (categoriesRes.error || productsRes.error) {
      console.warn('Supabase menu fetch warning:', categoriesRes.error?.message || productsRes.error?.message);
      return { categories: defaultCategories, products: defaultProducts };
    }

    // Якщо в базі поки немає категорій чи товарів, повертаємо mockData
    if (!categoriesRes.data?.length || !productsRes.data?.length) {
      return { categories: defaultCategories, products: defaultProducts };
    }

    const categories: Category[] = categoriesRes.data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'CircleDot',
      image: cat.image || '',
    }));

    const products: Product[] = productsRes.data.map((prod: any) => ({
      id: prod.id,
      categoryId: prod.category_id,
      name: prod.name,
      description: prod.description,
      price: Number(prod.price),
      weight: Number(prod.weight),
      pieces: prod.pieces ? Number(prod.pieces) : undefined,
      image: prod.image || '',
      images: prod.images || [],
      badge: prod.badge || undefined,
      ingredients: prod.ingredients || { pl: [], uk: [] },
      nutrition: prod.nutrition || { calories: 0, proteins: 0, fats: 0, carbs: 0 },
      isAvailable: Boolean(prod.is_available),
    }));

    return { categories, products };
  } catch (err) {
    console.warn('Error fetching menu from Supabase, falling back to mockData:', err);
    return { categories: defaultCategories, products: defaultProducts };
  }
}

/**
 * Автоматично виявляє об'єкт їжі на темному фоні та обрізає зайві порожні чорні поля,
 * щоб усі страви (від міні-макі до великих сетів) займали гармонійну однакову площу (~70-75% кадру)
 */
function autoTrimBlackBorders(canvas: HTMLCanvasElement): HTMLCanvasElement {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    if (width < 100 || height < 100) return canvas;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Вимірюємо колір фону по 4 кутах
    const corners = [
      0,
      (width - 1) * 4,
      ((height - 1) * width) * 4,
      ((height - 1) * width + (width - 1)) * 4,
    ];
    let bgR = 0, bgG = 0, bgB = 0;
    for (const c of corners) {
      bgR += data[c];
      bgG += data[c + 1];
      bgB += data[c + 2];
    }
    bgR /= 4;
    bgG /= 4;
    bgB /= 4;

    // Якщо фон не чорний/темний, не обрізаємо
    if (bgR > 50 || bgG > 50 || bgB > 50) return canvas;

    // Скануємо межі об'єкта їжі з кроком 2px для швидкості
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasSubject = false;
    const step = 2;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const diff = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
        if (diff > 26 || r > 40 || g > 40 || b > 40) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasSubject = true;
        }
      }
    }

    if (!hasSubject || maxX <= minX || maxY <= minY) return canvas;

    const objW = maxX - minX;
    const objH = maxY - minY;

    // Якщо об'єкт уже займає понад 82% кадру (як миска супу або макро-рол), залишаємо без змін
    if (objW > width * 0.82 && objH > height * 0.82) return canvas;

    const centerX = minX + objW / 2;
    const centerY = minY + objH / 2;
    const maxDim = Math.max(objW, objH);

    // Додаємо 38% повітря навколо страви для ідеального центрування та безпечних відступів
    const cropSize = Math.min(width, height, Math.round(maxDim * 1.38));
    const cropX = Math.max(0, Math.min(width - cropSize, Math.round(centerX - cropSize / 2)));
    const cropY = Math.max(0, Math.min(height - cropSize, Math.round(centerY - cropSize / 2)));

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropSize;
    croppedCanvas.height = cropSize;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return canvas;

    croppedCtx.drawImage(canvas, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
    return croppedCanvas;
  } catch (e) {
    return canvas;
  }
}

/**
 * Оптимізує та стискає зображення перед завантаженням (WebP/JPEG, макс. 1200px, якість 85%)
 * Зменшує розмір важких фото з камер і смартфонів (4-12 MB) до 100-250 KB без втрати візуальної чіткості
 */
async function compressImage(file: File, maxDimension: number = 1200, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Розумне кадрування: автоматично прибираємо зайвий пустий чорний простір
      const trimmedCanvas = autoTrimBlackBorders(canvas);

      trimmedCanvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Завантаження фотографії страви у бакет "products" сховища Supabase Storage
 * З автоматичною оптимізацією розміру та довготривалим кешуванням для максимальної швидкості сайту
 */
export async function uploadProductImage(file: File, productId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const compressedBlob = await compressImage(file, 1200, 0.85);
    const cleanId = productId.replace(/[^a-zA-Z0-9-_]/g, '');
    const isWebP = compressedBlob.type === 'image/webp';
    const fileExt = isWebP ? 'webp' : (file.name.split('.').pop()?.toLowerCase() || 'jpg');
    const fileName = `${cleanId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, compressedBlob, {
        contentType: compressedBlob.type || 'image/jpeg',
        cacheControl: '31536000', // 1 рік кешування в браузері та CDN
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Не вдалося завантажити зображення' };
  }
}

/**
 * Оновлення даних конкретної страви
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.weight !== undefined) payload.weight = updates.weight;
    if (updates.pieces !== undefined) payload.pieces = updates.pieces;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.badge !== undefined) payload.badge = updates.badge || null;
    if (updates.ingredients !== undefined) payload.ingredients = updates.ingredients;
    if (updates.nutrition !== undefined) payload.nutrition = updates.nutrition;
    if (updates.isAvailable !== undefined) payload.is_available = updates.isAvailable;

    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Створення нової страви
 */
export async function createProduct(product: Product): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .insert([
        {
          id: product.id,
          category_id: product.categoryId,
          name: product.name,
          description: product.description,
          price: product.price,
          weight: product.weight,
          pieces: product.pieces || null,
          image: product.image || '',
          images: product.images || [],
          badge: product.badge || null,
          ingredients: product.ingredients,
          nutrition: product.nutrition,
          is_available: product.isAvailable,
        },
      ]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Видалення страви
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

