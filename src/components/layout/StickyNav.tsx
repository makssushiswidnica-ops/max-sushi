'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, ChevronDown, Check, Search, X } from 'lucide-react';
import { categories, products } from '@/lib/mockData';
import { useI18n } from '@/lib/i18nContext';
import { useCartStore } from '@/store/useCartStore';
import { cn } from '@/lib/utils';

import { Category } from '@/types';

interface StickyNavProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  categoriesList?: Category[];
}

export function StickyNav({
  searchQuery = '',
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categoriesList,
}: StickyNavProps) {
  const categoriesData = categoriesList && categoriesList.length > 0 ? categoriesList : categories;
  const { locale } = useI18n();
  const setIsMenuOpenStore = useCartStore((s) => s.setIsMenuOpen);
  const [internalCategory, setInternalCategory] = useState<string>(categoriesData[0]?.id || 'mini-maki');
  const activeCategory = selectedCategory !== undefined ? selectedCategory : internalCategory;
  const setActiveCategory = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      setInternalCategory(catId);
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронізуємо стан відкритості меню зі сховищем в useEffect (захист від setState during render)
  useEffect(() => {
    if (isDropdownOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsMenuOpenStore(true);
    } else {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setIsMenuOpenStore(false);
      }, 350);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isDropdownOpen, setIsMenuOpenStore]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const isUserClicking = useRef(false);

  // Підрахунок кількості товарів у кожній категорії для випадаючого меню
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categoriesData) {
      counts[cat.id] = products.filter((p) => p.categoryId === cat.id).length;
    }
    return counts;
  }, [categoriesData]);

  // Відкриття та фокус на інпуті
  const toggleSearch = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  // Закриття пошуку при кліку поза ним, якщо поле пусте
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        if (!searchQuery) {
          setIsSearchOpen(false);
        }
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, searchQuery]);

  // Закриття дропдауну при кліку поза ним або по клавіші Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const scrollToCategory = (categoryId: string) => {
    isUserClicking.current = true;
    setActiveCategory(categoryId);
    setIsDropdownOpen(false);
    
    // Якщо компонент працює в режимі окремої сторінки під категорію (onSelectCategory передано)
    const element = document.getElementById(`category-${categoryId}`) || document.getElementById('catalog-active-category');
    if (element) {
      // Вимірюємо точну сумарну висоту зафіксованих панелей (Header + StickyNav)
      const headerEl = document.querySelector('header') as HTMLElement | null;
      const stickyNavEl = document.querySelector('.sticky.z-30') as HTMLElement | null;
      const totalStickyHeight = (headerEl?.offsetHeight || 105) + (stickyNavEl?.offsetHeight || 56);
      
      // Додаємо 20px комфортного повітря над заголовком розділу
      const safetyMargin = 20;
      const totalOffset = totalStickyHeight + safetyMargin;

      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = Math.max(0, elementPosition - totalOffset);

      // Миттєвий чіткий перехід без прокрутки та смикання
      window.scrollTo({
        top: offsetPosition,
        behavior: 'instant',
      });
    }
    setTimeout(() => {
      isUserClicking.current = false;
    }, 200);
  };

  // Слухач скролу сторінки: визначає поточну категорію (якщо на сторінці відображаються всі категорії одночасно)
  useEffect(() => {
    if (onSelectCategory) return; // У режимі окремої сторінки категорії скрол не змінює активну вкладку
    const handleScroll = () => {
      if (isUserClicking.current) return;
      const isDesktop = window.innerWidth >= 640;
      const scrollPosition = window.scrollY + (isDesktop ? 210 : 150);

      for (let i = categories.length - 1; i >= 0; i--) {
        const cat = categories[i];
        const el = document.getElementById(`category-${cat.id}`);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onSelectCategory]);

  // Обчислення циклічного списку для мобільного: активний елемент по центру
  const activeIndex = categoriesData.findIndex((c) => c.id === activeCategory);
  const validIndex = activeIndex >= 0 ? activeIndex : 0;
  const total = categoriesData.length;

  // Формуємо циклічний зріз для мобільного
  const halfRange = 5;
  const cyclicItems: { category: (typeof categoriesData)[0]; offset: number }[] = [];
  if (total > 0) {
    for (let offset = -halfRange; offset <= halfRange; offset++) {
      const index = (validIndex + offset + total * 10) % total;
      cyclicItems.push({ category: categoriesData[index], offset });
    }
  }

  const isCartOpen = useCartStore((s) => s.isOpen);
  const selectedProduct = useCartStore((s) => s.selectedProduct);

  // Надійне центрування активної категорії на мобільному телефоні
  const centerMobileCategory = useCallback((instant = false) => {
    if (navRef.current) {
      const centerBtn = navRef.current.querySelector<HTMLElement>('[data-is-center="true"]');
      if (centerBtn) {
        const container = navRef.current;
        const left = centerBtn.offsetLeft - container.offsetWidth / 2 + centerBtn.offsetWidth / 2;
        container.scrollTo({
          left,
          behavior: instant ? 'instant' : (isUserClicking.current ? 'instant' : 'smooth'),
        });
      }
    }
  }, []);

  // 1. Центрування при зміні активної категорії
  useEffect(() => {
    centerMobileCategory(false);
  }, [activeCategory, centerMobileCategory]);

  // 2. Центрування при монтуванні та оновленні категорій
  useEffect(() => {
    const timer1 = setTimeout(() => centerMobileCategory(true), 60);
    const timer2 = setTimeout(() => centerMobileCategory(true), 250);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [categoriesData, activeCategory, centerMobileCategory]);

  // 3. Відновлення положення при закритті кошика або модалки товару
  const prevModalState = useRef({ cart: false, product: false });
  useEffect(() => {
    const wasOpen = prevModalState.current.cart || prevModalState.current.product;
    const isNowOpen = isCartOpen || Boolean(selectedProduct);

    if (wasOpen && !isNowOpen) {
      setTimeout(() => centerMobileCategory(true), 50);
      setTimeout(() => centerMobileCategory(true), 200);
    }

    prevModalState.current = { cart: isCartOpen, product: Boolean(selectedProduct) };
  }, [isCartOpen, selectedProduct, centerMobileCategory]);

  // 4. Відновлення при поверненні на екран (visibility change / focus / resize)
  useEffect(() => {
    const handleRestore = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => centerMobileCategory(true), 50);
      }
    };
    document.addEventListener('visibilitychange', handleRestore);
    window.addEventListener('focus', handleRestore);
    window.addEventListener('resize', handleRestore);
    return () => {
      document.removeEventListener('visibilitychange', handleRestore);
      window.removeEventListener('focus', handleRestore);
      window.removeEventListener('resize', handleRestore);
    };
  }, [centerMobileCategory]);

  const stepCategory = (direction: 'prev' | 'next') => {
    if (total === 0) return;
    const newIndex = direction === 'next' 
      ? (validIndex + 1) % total 
      : (validIndex - 1 + total) % total;
    scrollToCategory(categoriesData[newIndex].id);
  };

  // Точне динамічне вимірювання висоти хедера для ідеального позиціонування sticky nav
  const [headerHeight, setHeaderHeight] = useState(105);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  return (
    <div
      style={{ top: `${headerHeight}px` }}
      className="sticky z-30 w-full bg-[#07070a]/95 backdrop-blur-xl border-b border-white/10 transition-all shadow-md shadow-black/40"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 relative flex items-center justify-between min-h-14 md:min-h-[66px] py-1 md:py-2">
        {/* Кнопка випадаючого списку категорій: збільшена, зручна для пальців */}
        <div className="relative shrink-0 z-50 flex items-center my-auto" ref={dropdownRef}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDropdownOpen((prev) => !prev);
            }}
            aria-expanded={isDropdownOpen}
            title={locale === 'pl' ? 'Kategorie menu' : 'Категорії меню'}
            style={{
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
            className={cn(
              'relative z-50 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] w-[96px] sm:w-[116px] text-sm sm:text-base font-black shrink-0 mr-2 sm:mr-3 transition-all duration-200 cursor-pointer shadow-sm group select-none active:scale-95',
              isDropdownOpen
                ? 'bg-[#18181f] text-white border border-white/20 hover:border-[#e50914]'
                : 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/40 hover:bg-[#f4222d]'
            )}
          >
            <LayoutGrid className={cn('w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200', isDropdownOpen ? 'rotate-90 text-[#e50914]' : 'text-white')} />
            <span className="tracking-wide text-white">
              {locale === 'pl' ? 'Menu' : 'Меню'}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 group-hover:text-white transition-transform duration-200', isDropdownOpen ? 'rotate-180' : '')} />
          </button>

          {/* Прозорий повнорозмірний бекдроп для закриття меню при кліку поза ним */}
          {isDropdownOpen && (
            <div
              className="fixed inset-0 z-40 bg-transparent cursor-default touch-none"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDropdownOpen(false);
              }}
            />
          )}

          {/* Випадаючий акуратний список категорій у формі клинка */}
          {isDropdownOpen && (
            <div
              style={{
                clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
              }}
              className="absolute left-0 top-full mt-2 w-72 sm:w-84 max-h-[75vh] p-[1px] bg-white/20 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div
                style={{
                  clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                }}
                className="w-full h-full max-h-[75vh] overflow-y-auto bg-[#0d0d12] backdrop-blur-2xl p-2.5 flex flex-col no-scrollbar"
              >
                <div className="px-3 py-2 border-b border-white/10 mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                    {locale === 'pl' ? 'Wybierz kategorię' : 'Оберіть категорію'}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {categoriesData.length} {locale === 'pl' ? 'sekcji' : 'розділів'}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {categoriesData.map((cat) => {
                    const isActive = cat.id === activeCategory;
                    const count = categoryCounts[cat.id] || 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        style={{
                          clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-all cursor-pointer group select-none',
                          isActive
                            ? 'bg-gradient-to-r from-[#e50914]/25 to-[#e50914]/10 border-l-2 border-[#e50914] text-white font-extrabold shadow-sm'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10'
                        )}
                      >
                        <span
                          className={cn(
                            'truncate shrink-0 transition-all',
                            isActive ? 'text-sm sm:text-base font-extrabold text-white' : 'text-xs sm:text-sm font-semibold'
                          )}
                        >
                          {cat.name[locale]}
                        </span>

                        {/* Елегантна пунктирна лінія-заповнювач між назвою та кількістю */}
                        <span
                          className={cn(
                            'flex-1 border-b border-dotted transition-colors min-w-4',
                            isActive ? 'border-[#e50914]/50' : 'border-white/15 group-hover:border-white/30'
                          )}
                        />

                        {/* Кількість позицій із підписом поз. */}
                        <span
                          className={cn(
                            'text-xs sm:text-sm font-bold tracking-tight shrink-0 transition-colors',
                            isActive ? 'text-red-300 font-extrabold' : 'text-zinc-400 group-hover:text-zinc-200'
                          )}
                        >
                          {count} {locale === 'pl' ? 'poz.' : 'поз.'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Розділювач біля кнопки меню (десктоп) */}
        <div className="h-6 w-[1px] bg-white/10 mx-2 shrink-0 hidden md:block" />

        {/* ДЕСКТОПНИЙ ВИГЛЯД: Усі категорії у 2 компактні рядки (hidden md:flex) */}
        <div className="hidden md:flex flex-1 flex-wrap items-center justify-center gap-x-2 lg:gap-x-3.5 gap-y-1 sm:gap-y-1.5 py-1 px-1 min-w-0">
          {categoriesData.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToCategory(category.id)}
                className={cn(
                  'relative px-2.5 lg:px-3 py-1 text-xs lg:text-[13px] font-bold tracking-wide uppercase whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center gap-1',
                  isActive
                    ? 'text-white font-black scale-105'
                    : 'text-zinc-400 hover:text-white hover:scale-102'
                )}
              >
                <span>{category.name[locale]}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_10px_#e50914]" />
                )}
              </button>
            );
          })}
        </div>

        {/* МОБІЛЬНИЙ ВИГЛЯД: Циклічна горизонтальна стрічка (flex md:hidden) */}
        <div className={cn(
          "relative flex-1 min-w-0 items-center transition-all flex md:hidden",
          isSearchOpen ? "hidden" : "flex"
        )}>
          {/* М'які градієнтні маски виключно над стрічкою категорій */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#07070a] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#07070a] to-transparent z-10" />

          {/* Циклічна стрічка категорій на мобільному */}
          <div
            ref={navRef}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-2 w-full px-2 touch-pan-x select-none"
            aria-label="Категорії меню"
          >
            {cyclicItems.map(({ category, offset }) => {
              const isCenter = offset === 0;
              return (
                <button
                  key={`${category.id}-${offset}`}
                  data-is-center={isCenter ? 'true' : 'false'}
                  onClick={() => scrollToCategory(category.id)}
                  className={cn(
                    'relative px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-all duration-300 ease-out cursor-pointer shrink-0 select-none active:scale-95',
                    isCenter
                      ? 'text-white scale-105'
                      : 'text-zinc-500 opacity-60 scale-100'
                  )}
                >
                  <span className="relative z-10 transition-colors duration-300">{category.name[locale]}</span>

                  {/* Неонова рубінова лінія підкреслення під центральним активним розділом */}
                  <span
                    className={cn(
                      'absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full transition-all duration-300 ease-out',
                      isCenter
                        ? 'bg-gradient-to-r from-[#e50914] via-[#ff4d58] to-[#e50914] shadow-[0_0_12px_#e50914] opacity-100 scale-x-100'
                        : 'opacity-0 scale-x-50 pointer-events-none'
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Розділювач біля пошуку (десктоп) */}
        {!isSearchOpen && (
          <div className="h-6 w-[1px] bg-white/10 mx-2 shrink-0 hidden md:block" />
        )}

        {/* Прозорий безпечний бекдроп для мобільного пошуку: при тапі за межами інпуту просто згортає пошук */}
        {isSearchOpen && (
          <div
            className="sm:hidden fixed inset-0 z-10 bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!searchQuery) {
                setIsSearchOpen(false);
              }
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
          />
        )}

        {/* Пошук у стікі нав: за замовчуванням відображається кнопка-лупа однакової ширини з кнопкою меню, при кліку розгортається інпут */}
        {onSearchChange && (
          <div
            className={cn(
              "relative z-20 flex items-center transition-all duration-200 ml-2 sm:ml-3",
              isSearchOpen ? "flex-1 sm:flex-initial min-w-0" : "shrink-0"
            )}
            ref={searchBoxRef}
          >
            {/* Поле вводу пошуку: з'являється при кліку на іконку лупи */}
            <div className={cn(
              'items-center animate-in fade-in zoom-in-95 duration-200 w-full relative',
              isSearchOpen ? 'flex' : 'hidden'
            )}>
              <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (!searchQuery) {
                      setIsSearchOpen(false);
                    } else {
                      onSearchChange('');
                    }
                  }
                }}
                placeholder={locale === 'pl' ? 'Szukaj w menu...' : 'Пошук у меню...'}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className="w-full sm:w-64 md:w-80 min-h-[44px] pl-10 pr-9 py-2 bg-[#13131a] border border-[#e50914]/70 text-sm sm:text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#e50914] shadow-md shadow-black/50"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 text-zinc-400 hover:text-white text-xs cursor-pointer p-0.5"
                  title={locale === 'pl' ? 'Wyczyść' : 'Очистити'}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer p-0.5"
                  title={locale === 'pl' ? 'Zamknij' : 'Закрити'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Компактна кнопка пошуку: точно така ж ширина й самурайський клин, як у кнопки меню зліва */}
            {!isSearchOpen && (
              <button
                type="button"
                onClick={toggleSearch}
                aria-label="Пошук у меню"
                title={locale === 'pl' ? 'Szukaj w menu' : 'Пошук у меню'}
                style={{
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
                className="flex items-center justify-center w-[96px] sm:w-[116px] min-h-[44px] bg-[#18181f] hover:bg-[#22222b] text-zinc-300 hover:text-white border border-white/15 hover:border-[#e50914] transition-all cursor-pointer shadow-sm group select-none active:scale-95 shrink-0"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#e50914] group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
