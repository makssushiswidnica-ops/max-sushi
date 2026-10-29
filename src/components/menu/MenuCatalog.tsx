'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { categories, products } from '@/lib/mockData';
import { StickyNav } from '@/components/layout/StickyNav';
import { useI18n } from '@/lib/i18nContext';
import { ProductCard } from '@/components/menu/ProductCard';
import { CategorySection } from '@/components/menu/CategorySection';

export function MenuCatalog() {
  const { locale } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || 'mini-maki');
  const [isInsideCategory, setIsInsideCategory] = useState<boolean>(false);
  const [isAllCategories, setIsAllCategories] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const catalogContentRef = useRef<HTMLDivElement>(null);

  // Підрахунок кількості товарів та мінімальної ціни у кожній категорії
  const { categoryCounts, categoryMinPrices } = useMemo(() => {
    const counts: Record<string, number> = {};
    const minPrices: Record<string, number> = {};
    for (const cat of categories) {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      counts[cat.id] = catProducts.length;
      if (catProducts.length > 0) {
        minPrices[cat.id] = Math.min(...catProducts.map((p) => p.price));
      }
    }
    return { categoryCounts: counts, categoryMinPrices: minPrices };
  }, []);

  // Знаходимо поточну категорію та сусідні для кнопок "Попередня / Наступна"
  const currentIndex = categories.findIndex((c) => c.id === selectedCategory);
  const activeCategoryObj = categories[currentIndex] || categories[0];
  const prevCategory = currentIndex > 0 ? categories[currentIndex - 1] : null;
  const nextCategory = currentIndex < categories.length - 1 ? categories[currentIndex + 1] : null;

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
        behavior: 'instant',
      });
    }
  }, []);

  // Відкриття конкретної категорії (вхід всередину каталогу страв)
  const handleSelectCategory = useCallback((catId: string) => {
    setIsInsideCategory(true);
    setIsAllCategories(false);
    setSelectedCategory(catId);
    setSearchQuery('');
    setTimeout(() => {
      scrollToCatalogTop();
    }, 50);
  }, [scrollToCatalogTop]);

  // Повернення до сітки папок-категорій
  const handleBackToFolders = useCallback(() => {
    setIsInsideCategory(false);
    setIsAllCategories(false);
    setSearchQuery('');
    const el = document.getElementById('categories-folders-grid');
    if (el) {
      const headerEl = document.querySelector('header') as HTMLElement | null;
      const totalStickyHeight = (headerEl?.offsetHeight || 105) + 16;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({
        top: Math.max(0, elementPosition - totalStickyHeight),
        behavior: 'smooth',
      });
    }
  }, []);

  const handleShowAll = useCallback(() => {
    setIsInsideCategory(true);
    setIsAllCategories(true);
    setSearchQuery('');
    setTimeout(() => {
      scrollToCatalogTop();
    }, 50);
  }, [scrollToCatalogTop]);

  // Слухач глобальної події скидання каталогу до початкового стану (наприклад, при кліку на логотип)
  useEffect(() => {
    const handleReset = () => {
      setIsInsideCategory(false);
      setIsAllCategories(false);
      setSearchQuery('');
      setSelectedCategory('sets');
    };
    window.addEventListener('reset-to-initial-catalog', handleReset);
    return () => window.removeEventListener('reset-to-initial-catalog', handleReset);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsInsideCategory(true);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = p.name[locale].toLowerCase().includes(query);
        const descMatch = p.description[locale].toLowerCase().includes(query);
        const ingMatch = p.ingredients[locale].some((ing) => ing.toLowerCase().includes(query));
        return nameMatch || descMatch || ingMatch;
      });
    }

    return result;
  }, [searchQuery, locale]);

  const isFiltering = searchQuery.trim().length > 0;
  const currentCategoryProducts = useMemo(() => {
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [selectedCategory]);

  return (
    <div>
      {/* Стікі панель показується лише коли ми всередині каталогу або під час пошуку */}
      {(isInsideCategory || isFiltering) && (
        <StickyNav
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onBackToFolders={handleBackToFolders}
          isInsideCategory={isInsideCategory}
        />
      )}

      {/* Якщо користувач на головній і не вибрав категорію — показуємо соковиту сітку папок категорій */}
      {!isInsideCategory && !isFiltering && (
        <section id="categories-folders-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
            <h2 
              style={{ 
                fontFamily: 'var(--font-knewave), "Knewave", cursive, sans-serif',
              }}
              className="text-2xl sm:text-4xl md:text-5xl font-normal text-white uppercase tracking-wider mb-3"
            >
              {locale === 'pl' ? 'MENU' : 'МЕНЮ'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md font-medium">
              {locale === 'pl' 
                ? 'Wybierz kategorię, aby odkryć wyjątkowe rolki i japońskie specjały' 
                : 'Оберіть категорію, щоб переглянути наші фірмові роли та японські страви'}
            </p>
          </div>

          {/* Сітка карток-папок категорій: 4 колонки десктоп, 3 планшет, 2 мобільні */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {categories.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const minPrice = categoryMinPrices[cat.id];
              return (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  style={{
                    clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
                  }}
                  className="group relative p-[1px] bg-white/10 hover:bg-[#e50914]/60 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#e50914]/20 cursor-pointer select-none active:scale-[0.98]"
                >
                  <div
                    style={{
                      clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                    }}
                    className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center transition-colors duration-300"
                  >
                    {/* Зображення категорії на чистішому глибокому чорному фоні */}
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name[locale]}
                        loading="lazy"
                        className="w-full h-full object-contain p-2 sm:p-3 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)] group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-3xl text-[#e50914] font-black">+</div>
                    )}

                    {/* Плашка кількості позицій у правому верхньому кутку */}
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-black text-white bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 shadow-sm z-10">
                      {count} {locale === 'pl' ? 'poz.' : 'поз.'}
                    </span>

                    {/* Напівпрозорий плавний градієнт знизу для ідеальної читабельності */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none" />

                    {/* Текстовий блок поверх зображення внизу: Назва категорії + Ціна "від ... zł" */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5 z-10 text-left">
                      <h3 className="text-xs sm:text-base font-black tracking-wide text-white group-hover:text-[#e50914] transition-colors leading-tight line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {cat.name[locale]}
                      </h3>
                      {minPrice !== undefined && (
                        <p className="text-[10px] sm:text-xs font-semibold text-zinc-300/90 mt-0.5 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {locale === 'pl' ? `od ${minPrice.toFixed(0)} zł` : `від ${minPrice.toFixed(0)} zł`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Кнопка "Переглянути все меню разом" під папками */}
          <div className="mt-10 sm:mt-14 text-center">
            <button
              onClick={handleShowAll}
              style={{
                clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              }}
              className="px-8 sm:px-12 py-3.5 sm:py-4 bg-[#181824] hover:bg-[#202030] border border-white/15 hover:border-[#e50914] text-xs sm:text-sm font-black text-white uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#e50914]/20 active:scale-95 select-none"
            >
              <span>{locale === 'pl' ? 'ZOBACZ WSZYSTKIE POZYCJE (PEŁNE MENU)' : 'ПЕРЕГЛЯНУТИ ВСІ СТРАВИ (ПОВНЕ МЕНЮ)'}</span>
            </button>
          </div>
        </section>
      )}

      <div ref={catalogContentRef} id="catalog-active-category" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Результати фільтрації або сторінка поточної вибраної категорії або повне меню */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : isAllCategories ? (
          <div>
            <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-sm shadow-[#e50914]" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-white">
                  {locale === 'pl' ? 'Pełne menu' : 'Повне меню закладу'}
                </h2>
              </div>
            </div>

            {categories.map((category) => {
              const categoryProducts = products.filter(
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
          </div>
        ) : isInsideCategory ? (
          <div>
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

            {/* Сітка товарів: 4 колонки на великих екранах, 3 на лептопах, 2 на планшетах, 1 на смартфонах */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {currentCategoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Блок переходу: Спочатку кнопка "Подивитися все меню" у формі клинка, а під нею номери сторінок */}
            <div className="mt-12 pt-6 border-t border-white/10 flex flex-col items-center gap-5">
              {/* Кнопка "Подивитися все меню" разом у формі клинка (як у Hero) */}
              <button
                onClick={handleShowAll}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
                className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-[#13131b] hover:bg-[#1a1a26] border border-white/15 hover:border-[#e50914] text-xs sm:text-sm font-black text-white uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#e50914]/20 active:scale-95 select-none"
              >
                <span>{locale === 'pl' ? 'ZOBACZ CAŁE MENU' : 'ПЕРЕГЛЯНУТИ ВСЕ МЕНЮ'}</span>
              </button>

              {/* Мінімалістична пагінація сторінок категорій < 1 2 3 ... N > */}
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
                {categories.map((cat, idx) => {
                  const pageNum = idx + 1;
                  const isActive = cat.id === selectedCategory;
                  const totalPages = categories.length;

                  // Показуємо першу, останню, поточну та сусідні навколо поточної
                  const showPage =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - (currentIndex + 1)) <= 1;

                  if (!showPage) {
                    // Виводимо крапки "..." лише один раз для пропущених діапазонів
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
        ) : null}
      </div>
    </div>
  );
}
