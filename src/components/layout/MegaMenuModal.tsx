'use client';

import React from 'react';
import { X, Sparkles, ChevronRight, Layers, Utensils, Fish, PlusCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import { categories } from '@/lib/mockData';
import { categoryGroups } from './MobileMenuDrawer';

interface MegaMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string) => void;
}

const groupIcons: Record<number, React.ReactNode> = {
  0: <Fish className="w-4 h-4 text-[#e50914]" />,
  1: <Layers className="w-4 h-4 text-amber-400" />,
  2: <Utensils className="w-4 h-4 text-emerald-400" />,
  3: <PlusCircle className="w-4 h-4 text-blue-400" />,
};

export function MegaMenuModal({ isOpen, onClose, onSelectCategory }: MegaMenuModalProps) {
  const { locale } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Бекдроп із блюром */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Модальне вікно-каталог (Tokyo Dark Mega Menu) */}
      <div className="relative w-full max-w-4xl bg-[#0e0e14] border border-white/10 rounded-2xl shadow-2xl p-6 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Шапка модального вікна */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e50914] shadow-[0_0_8px_#e50914]" />
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                {locale === 'pl' ? 'Karta Menu — Wszystkie Kategorie' : 'Меню закладу — Всі Категорії'}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {locale === 'pl'
                ? 'Wybierz kategorię, aby natychmiast przejść do listy dań'
                : 'Оберіть категорію для швидкого переходу до переліку страв'}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Колонки категорій за групами */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6">
          {categoryGroups.map((group, groupIdx) => (
            <div
              key={groupIdx}
              className="flex flex-col bg-white/[0.02] border border-white/5 rounded-xl p-3.5 hover:border-white/15 transition-all"
            >
              <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-white/5">
                {groupIcons[groupIdx] || <Sparkles className="w-4 h-4 text-[#e50914]" />}
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wider leading-tight">
                    {group.name[locale]}
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {group.badge[locale]}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {group.ids.map((id) => {
                  const cat = categories.find((c) => c.id === id);
                  if (!cat) return null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        onClose();
                      }}
                      className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#e50914]/15 hover:border-l-2 hover:border-[#e50914] transition-all text-left cursor-pointer"
                    >
                      <span className="truncate">{cat.name[locale]}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#e50914] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Футер модалки з швидкими підказками */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
          <span>{locale === 'pl' ? 'Razem 12 kategorii sushi & dań japońskich' : 'Разом 12 категорій суші та страв'}</span>
          <span className="text-zinc-400">
            {locale === 'pl' ? 'Darmowa dostawa od 100 zł' : 'Безкоштовна доставка від 100 zł'}
          </span>
        </div>
      </div>
    </div>
  );
}
