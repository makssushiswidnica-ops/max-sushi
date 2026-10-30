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

  // Schema.org мікродані для Google (рейтинг ресторану, кухня, ціни та місто Świdnica)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Maks Sushi Świdnica',
    description: locale === 'pl' 
      ? 'Najlepsze sushi w Świdnicy. Świeże rolki, zestawy, futomaki z szybką dostawą na terenie Świdnicy.'
      : 'Найкращі суші у Свідниці. Свіжі роли, сети, футомакі зі швидкою доставкою по Свідниці.',
    servesCuisine: ['Sushi', 'Japanese', 'Asian'],
    priceRange: '$$',
    currenciesAccepted: 'PLN',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Świdnica',
      addressRegion: 'Dolnośląskie',
      addressCountry: 'PL',
    },
    hasMenu: {
      '@type': 'Menu',
      name: 'Maks Sushi Menu',
      hasMenuItemSection: [
        { '@type': 'MenuSection', name: 'Mini Maki' },
        { '@type': 'MenuSection', name: 'Futomaki' },
        { '@type': 'MenuSection', name: 'Rolki' },
        { '@type': 'MenuSection', name: 'Lux Rolki' },
        { '@type': 'MenuSection', name: 'Zestawy' },
      ],
    },
  };

  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
