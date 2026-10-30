'use client';

import React from 'react';
import { Category, Product } from '@/types';
import { ProductCard } from '@/components/menu/ProductCard';
import { useI18n } from '@/lib/i18nContext';

interface CategorySectionProps {
  category: Category;
  products: Product[];
}

export function CategorySection({ category, products }: CategorySectionProps) {
  const { locale } = useI18n();

  if (products.length === 0) return null;

  return (
    <section id={`category-${category.id}`} className="scroll-mt-36 sm:scroll-mt-52 mb-14">
      {/* Заголовок категорії з автентичною червоною крапкою та лініями як на фото меню */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2 flex-1 max-w-[80px] sm:max-w-[140px]">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-zinc-600" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-sm shadow-[#e50914]" />
        </div>
        
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-widest text-white whitespace-nowrap">
          {category.name[locale]}
        </h2>

        <div className="h-[2px] flex-1 bg-gradient-to-r from-zinc-700 via-zinc-800 to-transparent" />

        <span className="text-xs font-bold text-zinc-400 bg-[#16161f] border border-white/5 px-2.5 py-1 rounded-lg">
          {products.length} {locale === 'pl' ? 'pozycji' : 'позицій'}
        </span>
      </div>

      {/* Сітка меню: якщо позицій менше 4 — центруємо відображення */}
      <div
        className={
          products.length === 1
            ? 'grid grid-cols-1 max-w-sm mx-auto gap-4 sm:gap-5'
            : products.length === 2
            ? 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-4 sm:gap-5'
            : products.length === 3
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto gap-4 sm:gap-5'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
        }
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
