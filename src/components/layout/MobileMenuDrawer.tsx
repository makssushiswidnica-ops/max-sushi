'use client';

import React from 'react';
import { X, Phone, MapPin, Clock, ExternalLink, ChevronRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import { brandTheme, getStoreStatus } from '@/config/theme';
import { categories } from '@/lib/mockData';

interface CategoryGroup {
  name: { pl: string; uk: string };
  badge: { pl: string; uk: string };
  ids: string[];
}

export const categoryGroups: CategoryGroup[] = [
  {
    name: { pl: 'Rolki & Maki', uk: 'Роли та Макі' },
    badge: { pl: '6 rodzajów', uk: '6 видів' },
    ids: ['mini-maki', 'futomaki', 'rolki', 'lux-rolki', 'pieczone-rolki', 'rolki-tempura'],
  },
  {
    name: { pl: 'Zestawy Sushi', uk: 'Суші Сети' },
    badge: { pl: 'Duże porcje', uk: 'Великі порції' },
    ids: ['zestawy'],
  },
  {
    name: { pl: 'Ciepłe dania & Przekąski', uk: 'Гарячі страви та Закуски' },
    badge: { pl: 'Kuchnia azjatycka', uk: 'Азійська кухня' },
    ids: ['zupy', 'sushi-burgery', 'poke-bowl', 'przekaski'],
  },
  {
    name: { pl: 'Dodatki & Sosy', uk: 'Додатки та Соуси' },
    badge: { pl: 'Do sushi', uk: 'До суші' },
    ids: ['dodatki'],
  },
];

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string) => void;
  onScrollToFooter: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  onSelectCategory,
  onScrollToFooter,
}: MobileMenuDrawerProps) {
  const { locale, changeLocale } = useI18n();
  const storeStatus = getStoreStatus(locale);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:hidden">
      {/* Темний матовий бекдроп */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      />

      {/* Шторка меню */}
      <div className="relative w-[85%] max-w-[340px] h-full bg-[#0d0d12] border-r border-white/10 shadow-2xl flex flex-col z-10 overflow-y-auto no-scrollbar animate-in slide-in-from-left duration-300">
        {/* Шапка шторки з логотипом та кнопкою закриття */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#07070a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e50914] bg-black shrink-0">
              <img
                src={brandTheme.logo}
                alt={brandTheme.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-baseline gap-1 font-brand">
              <span className="text-lg text-[#e50914] leading-none">MAKS</span>
              <span className="text-lg text-white leading-none">SUSHI</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Zamknij menu"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Статус закладу та перемикач мови */}
        <div className="p-3.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              {storeStatus.isOpen ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              )}
            </span>
            <span className={storeStatus.isOpen ? 'text-emerald-400 font-semibold text-[11px]' : 'text-amber-400 font-semibold text-[11px]'}>
              {storeStatus.isOpen ? (locale === 'pl' ? 'Otwarte teraz' : 'Відчинено зараз') : (locale === 'pl' ? 'Zamknięte' : 'Зачинено')}
            </span>
          </div>

          {/* Перемикач мови */}
          <div className="flex items-center bg-[#181820] border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => changeLocale('pl')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                locale === 'pl' ? 'bg-[#e50914] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              PL
            </button>
            <button
              onClick={() => changeLocale('uk')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                locale === 'uk' ? 'bg-[#e50914] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              UA
            </button>
          </div>
        </div>

        {/* Згрупований перелік категорій меню */}
        <div className="p-3.5 flex-1 space-y-4">
          <div className="text-[10px] font-black tracking-widest uppercase text-zinc-500 px-1">
            {locale === 'pl' ? 'Karta Menu (Kategorie)' : 'Меню закладу (Категорії)'}
          </div>

          <div className="space-y-3">
            {categoryGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="rounded-xl bg-white/[0.03] border border-white/5 p-2">
                <div className="flex items-center justify-between px-1.5 py-1 mb-1">
                  <span className="text-xs font-black uppercase text-white tracking-wider">
                    {group.name[locale]}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
                    {group.badge[locale]}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-0.5">
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
                        className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 active:bg-[#e50914]/20 transition-all text-left"
                      >
                        <span>{cat.name[locale]}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Блок контактів та адреси внизу */}
        <div className="p-4 bg-[#07070a] border-t border-white/10 space-y-2.5">
          <button
            onClick={() => {
              onScrollToFooter();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-200 transition-colors"
          >
            <span>{locale === 'pl' ? 'Wszystkie kontakty & Informacje' : 'Всі контакти та Інформація'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#e50914]" />
          </button>

          <a
            href={`tel:${brandTheme.contacts.phoneRaw}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#e50914] text-white text-xs font-bold shadow-md shadow-[#e50914]/30"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{brandTheme.contacts.phone}</span>
          </a>

          <div className="flex items-start gap-2 px-1 text-[11px] text-zinc-400">
            <MapPin className="w-3 h-3 text-[#e50914] shrink-0 mt-0.5" />
            <span>{brandTheme.contacts.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
