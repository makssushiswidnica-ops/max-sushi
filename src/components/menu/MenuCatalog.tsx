'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { categories as defaultCategories, products as defaultProducts } from '@/lib/mockData';
import { fetchMenuData } from '@/lib/menuService';
import { Category, Product } from '@/types';
import { StickyNav } from '@/components/layout/StickyNav';
import { useI18n } from '@/lib/i18nContext';
import { useCartStore } from '@/store/useCartStore';
import { ProductCard } from '@/components/menu/ProductCard';
import { CategorySection } from '@/components/menu/CategorySection';

// Допоміжна функція для центрування сітки, коли позицій у категорії менше 4
// Класи для адаптивної сітки страв із центруванням неповного останнього ряду
const PRODUCT_CONTAINER_CLASS = 'flex flex-wrap justify-center gap-4 sm:gap-5';
const PRODUCT_ITEM_CLASS = 'w-full sm:w-[calc(50%-10px)] lg:w-[calc((100%-40px)/3)] xl:w-[calc(25%-15px)] max-w-sm sm:max-w-none flex';

export function MenuCatalog() {
  const { locale } = useI18n();
  const setMenuProducts = useCartStore((s) => s.setMenuProducts);
  const setMenuCategories = useCartStore((s) => s.setMenuCategories);

  // Динамічний стан меню з Supabase (з надійним резервним fallback на mockData)
  const [categoriesList, setCategoriesList] = useState<Category[]>(defaultCategories);
  const [productsList, setProductsList] = useState<Product[]>(defaultProducts);

  // Завантаження меню з бази даних при ініціалізації
  useEffect(() => {
    let isMounted = true;
    fetchMenuData().then((data) => {
      if (isMounted) {
        if (data.categories?.length > 0) {
          setCategoriesList(data.categories);
          setMenuCategories(data.categories);
        }
        if (data.products?.length > 0) {
          // Показуємо відвідувачам сайту тільки доступні позиції
          const available = data.products.filter((p) => p.isAvailable !== false);
          setProductsList(available);
          setMenuProducts(available);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setMenuProducts, setMenuCategories]);

  // За замовчуванням відкривається збережена користувачем категорія або перший розділ
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('maks_active_category');
      if (saved) return saved;
    }
    return categoriesList[0]?.id || 'mini-maki';
  });

  // Запам'ятовуємо обрану категорію при переходах по сайту, кошику чи модалках
  useEffect(() => {
    if (selectedCategory && typeof window !== 'undefined') {
      sessionStorage.setItem('maks_active_category', selectedCategory);
    }
  }, [selectedCategory]);
  const [isAllCategories, setIsAllCategories] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const catalogContentRef = useRef<HTMLDivElement>(null);

  // Знаходимо поточну категорію та сусідні для кнопок пагінації та свайпів (повна циклічність)
  const totalCats = categoriesList.length;
  const currentIndex = categoriesList.findIndex((c) => c.id === selectedCategory);
  const validCatIndex = currentIndex >= 0 ? currentIndex : 0;
  const activeCategoryObj = categoriesList[validCatIndex] || categoriesList[0];
  const prevCategory = totalCats > 1 ? categoriesList[(validCatIndex - 1 + totalCats) % totalCats] : null;
  const nextCategory = totalCats > 1 ? categoriesList[(validCatIndex + 1) % totalCats] : null;

  // Обробка жестів свайпу вліво/вправо на екрані для перемикання категорій
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAllCategories || isFiltering) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (isAllCategories || isFiltering) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const duration = Date.now() - touchStartTime.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Свайп: швидкий (< 600ms), довжина > 50px, та чітко горизонтальний (горизонталь переважає вертикаль у 1.4 рази)
    if (duration < 600 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        // Свайп пальцем вліво (<-) -> перехід до наступної категорії
        if (nextCategory) {
          handleSelectCategory(nextCategory.id);
        }
      } else {
        // Свайп пальцем вправо (->) -> перехід до попередньої категорії
        if (prevCategory) {
          handleSelectCategory(prevCategory.id);
        }
      }
    }
  };

  const scrollToCatalogTop = useCallback(() => {
    if (catalogContentRef.current) {
      const headerEl = document.querySelector('header') as HTMLElement | null;
      const stickyNavEl = document.querySelector('.sticky.z-30') as HTMLElement | null;
      const totalStickyHeight = (headerEl?.offsetHeight || 105) + (stickyNavEl?.offsetHeight || 56);
      
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = catalogContentRef.current.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const targetPosition = Math.max(0, elementPosition - totalStickyHeight - 16);

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  // Перемикання сторінки категорії
  const handleSelectCategory = useCallback((catId: string) => {
    setIsAllCategories(false);
    setSelectedCategory(catId);
    setSearchQuery('');
    setTimeout(() => {
      scrollToCatalogTop();
    }, 50);
  }, [scrollToCatalogTop]);

  // Показати всі страви меню разом
  const handleShowAll = useCallback(() => {
    setIsAllCategories(true);
    setSearchQuery('');
    setTimeout(() => {
      scrollToCatalogTop();
    }, 50);
  }, [scrollToCatalogTop]);

  // Згорнути перегляд всього меню назад до поточної категорії
  const handleCollapseToPages = useCallback(() => {
    setIsAllCategories(false);
    setSearchQuery('');
    setTimeout(() => {
      scrollToCatalogTop();
    }, 50);
  }, [scrollToCatalogTop]);

  // Слухач глобальної події скидання каталогу до початкового стану (при кліку на логотип або кнопку Hero)
  useEffect(() => {
    const handleReset = () => {
      setIsAllCategories(false);
      setSearchQuery('');
      setSelectedCategory(categoriesList[0]?.id || 'mini-maki');
    };
    window.addEventListener('reset-to-initial-catalog', handleReset);
    return () => window.removeEventListener('reset-to-initial-catalog', handleReset);
  }, [categoriesList]);

  // Синхронізація активної категорії з модалки перегляду страв (якщо гортав страви і закрив)
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ categoryId: string; productId?: string }>;
      if (customEvent.detail?.categoryId) {
        setIsAllCategories(false);
        setSelectedCategory(customEvent.detail.categoryId);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('maks_active_category', customEvent.detail.categoryId);
        }
        setTimeout(() => {
          if (customEvent.detail.productId) {
            const cardEl = document.getElementById(`product-card-${customEvent.detail.productId}`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
          }
          scrollToCatalogTop();
        }, 120);
      }
    };
    window.addEventListener('sync-category-from-modal', handleSync);
    return () => window.removeEventListener('sync-category-from-modal', handleSync);
  }, [scrollToCatalogTop]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredProducts = useMemo(() => {
    let result = productsList;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = p.name[locale].toLowerCase().includes(query);
        const descMatch = p.description[locale].toLowerCase().includes(query);
        const ingMatch = p.ingredients[locale]?.some((ing) => ing.toLowerCase().includes(query));
        return nameMatch || descMatch || ingMatch;
      });
    }

    return result;
  }, [searchQuery, locale, productsList]);

  const isFiltering = searchQuery.trim().length > 0;
  const currentCategoryProducts = useMemo(() => {
    return productsList.filter((p) => p.categoryId === selectedCategory);
  }, [selectedCategory, productsList]);

  return (
    <div>
      {/* Стікі-навігація завжди закріплена під херо: швидкий вибір розділів та зручний пошук */}
      <StickyNav
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        categoriesList={categoriesList}
      />

      <div
        ref={catalogContentRef}
        id="catalog-active-category"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 touch-pan-y select-auto"
      >
        {/* 1. Результати швидкого пошуку */}
        {isFiltering ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">
                {locale === 'pl' ? 'Wyniki wyszukiwania' : 'Результати пошуку'}
              </h3>
              <span className="text-xs text-zinc-400">
                {locale === 'pl' ? `Znaleziono: ${filteredProducts.length}` : `Знайдено: ${filteredProducts.length}`}
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-base font-semibold">
                  {locale === 'pl' ? 'Nic nie znaleziono dla podanego zapytania' : 'Нічого не знайдено за вашим запитом'}
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  {locale === 'pl' ? 'Wyczyść wyszukiwanie' : 'Скинути пошук'}
                </button>
              </div>
            ) : (
              <div className={PRODUCT_CONTAINER_CLASS}>
                {filteredProducts.map((product) => (
                  <div key={product.id} id={`product-card-${product.id}`} className={PRODUCT_ITEM_CLASS}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isAllCategories ? (
          /* 2. Повний список усіх страв закладу разом */
          <div>
            <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-sm shadow-[#e50914]" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-white">
                  {locale === 'pl' ? 'Pełne menu' : 'Повне меню закладу'}
                </h2>
              </div>
              <button
                onClick={handleCollapseToPages}
                className="text-xs font-bold text-zinc-300 hover:text-white bg-[#16161f] hover:bg-[#20202d] border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                {locale === 'pl' ? 'Wróć do stron kategorii' : 'Повернутись до сторінок'}
              </button>
            </div>

            {categoriesList.map((category) => {
              const categoryProducts = productsList.filter(
                (p) => p.categoryId === category.id
              );
              return (
                <div key={category.id} id={`category-${category.id}`}>
                  <CategorySection
                    category={category}
                    products={categoryProducts}
                  />
                </div>
              );
            })}

            <div className="mt-12 text-center">
              <button
                onClick={handleCollapseToPages}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className="px-6 sm:px-8 py-3 bg-[#13131b] hover:bg-[#1a1a26] border border-white/15 hover:border-[#e50914] text-xs sm:text-sm font-black text-white uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                {locale === 'pl' ? 'ZWIŃ DO KATEGORII' : 'ЗГОРНУТИ ДО КАТЕГОРІЙ'}
              </button>
            </div>
          </div>
        ) : (
          /* 3. Одразу під херо: сторінка активного розділу категорій (Міні Макі, Роли тощо) з підтримкою свайпу */
          <div key={selectedCategory} className="animate-in fade-in duration-300">
            {/* Заголовок поточної активної категорії */}
            <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-sm shadow-[#e50914]" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-white">
                  {activeCategoryObj?.name[locale]}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 bg-[#16161f] border border-white/10 px-3 py-1 rounded-xl shrink-0">
                  {currentCategoryProducts.length} {locale === 'pl' ? 'pozycji' : 'позицій'}
                </span>
              </div>
            </div>

            {/* Сітка товарів вибраної категорії: неповні ряди автоматично центруються */}
            <div className={PRODUCT_CONTAINER_CLASS}>
              {currentCategoryProducts.map((product) => (
                <div key={product.id} id={`product-card-${product.id}`} className={PRODUCT_ITEM_CLASS}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Блок переходу: Кнопка "Переглянути все меню" та номери сторінок категорій */}
            <div className="mt-12 pt-6 border-t border-white/10 flex flex-col items-center gap-5">
              {/* Кнопка "Подивитися все меню" разом у формі самурайського клинка */}
              <button
                onClick={handleShowAll}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-[#13131b] hover:bg-[#1a1a26] border border-white/15 hover:border-[#e50914] text-xs sm:text-sm font-black text-white uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#e50914]/20 active:scale-95 select-none"
              >
                <span>{locale === 'pl' ? 'ZOBACZ CAŁE MENU' : 'ПЕРЕГЛЯНУТИ ВСЕ МЕНЮ'}</span>
              </button>

              {/* Зручна пагінація сторінок категорій < 1 2 3 ... N > */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-1">
                {/* Стрілочка назад < */}
                <button
                  onClick={() => prevCategory && handleSelectCategory(prevCategory.id)}
                  disabled={!prevCategory}
                  aria-label="Попередня категорія"
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer select-none"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Номери сторінок категорій */}
                {categoriesList.map((cat, idx) => {
                  const pageNum = idx + 1;
                  const isActive = cat.id === selectedCategory;
                  const totalPages = categoriesList.length;

                  // Показуємо першу, останню, поточну та сусідні навколо поточної
                  const showPage =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - (currentIndex + 1)) <= 1;

                  if (!showPage) {
                    if (pageNum === 2 && currentIndex + 1 > 3) {
                      return (
                        <span key={`dots-${pageNum}`} className="w-5 sm:w-6 text-center text-zinc-600 font-bold select-none text-xs sm:text-sm">
                          ...
                        </span>
                      );
                    }
                    if (pageNum === totalPages - 1 && currentIndex + 1 < totalPages - 2) {
                      return (
                        <span key={`dots-${pageNum}`} className="w-5 sm:w-6 text-center text-zinc-600 font-bold select-none text-xs sm:text-sm">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      aria-label={cat.name[locale]}
                      title={cat.name[locale]}
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                        isActive
                          ? 'text-white bg-[#e50914]/20 border border-[#e50914]/50 shadow-sm shadow-[#e50914]/20 font-black'
                          : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Стрілочка вперед > */}
                <button
                  onClick={() => nextCategory && handleSelectCategory(nextCategory.id)}
                  disabled={!nextCategory}
                  aria-label="Наступна категорія"
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer select-none"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
