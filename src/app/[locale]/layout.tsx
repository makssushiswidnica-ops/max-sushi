import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/types';
import { I18nProvider } from '@/lib/i18nContext';
import { Header } from '@/components/layout/Header';
import { StickyNav } from '@/components/layout/StickyNav';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductModal } from '@/components/menu/ProductModal';
import { CheckoutModal } from '@/components/checkout/CheckoutModal';
import { Footer } from '@/components/layout/Footer';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'uk' ? 'uk' : 'pl') as Locale;
  const dict = getDictionary(locale);

  return {
    title: `${dict.brand.name} — ${dict.brand.slogan}`,
    description: dict.hero.subtitle,
    openGraph: {
      title: `${dict.brand.name} — ${dict.brand.slogan}`,
      description: dict.hero.subtitle,
      locale: locale === 'pl' ? 'pl_PL' : 'uk_UA',
      type: 'website',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  
  if (!locales.includes(rawLocale as Locale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const dictionary = getDictionary(locale);

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <div suppressHydrationWarning className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        
        {/* Глобальні модальні вікна та шторки */}
        <CartDrawer />
        <ProductModal />
        <CheckoutModal />
      </div>
    </I18nProvider>
  );
}
