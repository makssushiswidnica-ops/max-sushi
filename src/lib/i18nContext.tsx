'use client';

import React, { createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale } from '@/types';
import { Dictionary } from '@/lib/dictionaries';

interface I18nContextType {
  locale: Locale;
  t: Dictionary;
  changeLocale: (newLocale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    // Зберігаємо поточну позицію скролу сторінки
    const currentScrollY = window.scrollY;

    // Замінюємо префікс мови в URL (наприклад, /pl/... на /uk/...)
    const segments = pathname.split('/');
    let newPath = '';
    if (segments[1] === 'pl' || segments[1] === 'uk') {
      segments[1] = newLocale;
      newPath = segments.join('/');
    } else {
      newPath = `/${newLocale}${pathname}`;
    }

    // Переходимо без авто-скролу нагору сторінки
    router.push(newPath, { scroll: false });

    // Підстраховуємо позицію скролу після завершення рендеру нової сторінки
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    });
  };

  return (
    <I18nContext.Provider value={{ locale, t: dictionary, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
