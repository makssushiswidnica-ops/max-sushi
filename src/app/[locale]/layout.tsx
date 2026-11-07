import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/types';
import { I18nProvider } from '@/lib/i18nContext';
import { Header } from '@/components/layout/Header';
import { StickyNav } from '@/components/layout/StickyNav';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CustomerDrawer } from '@/components/customer/CustomerDrawer';
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maks-sushi.pl';

  const title = locale === 'pl'
    ? 'Maks Sushi Świdnica — Najlepsze Sushi z Dostawą i na Wynos'
    : 'Maks Sushi Свідниця — Найкращі Суші з Доставкою та Самовивозом';

  const description = locale === 'pl'
    ? 'Maks Sushi w Świdnicy: wyśmienite rolki, zestawy sushi i dania japońskie. Szybka dostawa pod Twoje drzwi lub odbiór przy ul. Parkowej 8. Zamów online!'
    : 'Maks Sushi у Свідниці: вишукані роли, суші-сети та японські страви. Швидка доставка до дверей або самовивіз на вул. Parkowa 8. Замовляйте онлайн!';

  const keywords = locale === 'pl'
    ? [
        'maks sushi',
        'maks sushi świdnica',
        'sushi świdnica',
        'dostawa sushi świdnica',
        'sushi na dowóz świdnica',
        'sushi na wynos świdnica',
        'rolki świdnica',
        'zestawy sushi świdnica',
        'najlepsze sushi świdnica',
        'jedzenie na dowóz świdnica',
        'japońska restauracja świdnica',
        'sushi parkowa 8',
        'sushi świebodzice',
        'dostawa sushi świebodzice',
        'sushi pszenno',
        'dostawa sushi pszenno',
        'sushi jaworzyna śląska',
        'dostawa sushi jaworzyna śląska',
        'sushi żarów',
        'dostawa sushi żarów',
        'sushi marcinowice',
        'sushi witoszów',
        'sushi bystrzyca',
      ]
    : [
        'maks sushi',
        'maks sushi swidnica',
        'макс суші свідниця',
        'суші свідниця',
        'доставка суші свідниця',
        'суші на виніс свідниця',
        'роли свідниця',
        'сети свідниця',
        'суші бар свідниця',
        'найкращі суші свідниця',
        'їжа з доставкою свідниця',
        'суші свібодзіце',
        'доставка суші свібодзіце',
        'суші пшенно',
        'суші явожина шльонська',
        'суші жарув',
        'суші марчиновіце',
      ];

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'pl-PL': '/pl',
        'uk-UA': '/uk',
        'x-default': '/pl',
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: 'Maks Sushi Świdnica',
      locale: locale === 'pl' ? 'pl_PL' : 'uk_UA',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maks-sushi.pl';

  // Schema.org мікродані для Google (ресторан, гео-координати, адреса, телефон, години роботи)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Maks Sushi Świdnica',
    image: `${baseUrl}/images/hero_sushi_bg.jpg`,
    url: `${baseUrl}/${locale}`,
    telephone: '+48 791 744 048',
    priceRange: '$$',
    servesCuisine: ['Sushi', 'Japanese', 'Asian'],
    currenciesAccepted: 'PLN',
    paymentAccepted: 'Cash, Credit Card, BLIK',
    description: locale === 'pl' 
      ? 'Najlepsze sushi w Świdnicy. Świeże rolki, zestawy, futomaki z szybką dostawą na terenie Świdnicy i okolic.'
      : 'Найкращі суші у Свідниці. Свіжі роли, сети, футомакі зі швидкою доставкою по Свідниці та околицях.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Parkowa 8',
      addressLocality: 'Świdnica',
      postalCode: '58-100',
      addressRegion: 'Dolnośląskie',
      addressCountry: 'PL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 50.8438,
      longitude: 16.4886,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Świdnica' },
      { '@type': 'AdministrativeArea', name: 'Świebodzice' },
      { '@type': 'AdministrativeArea', name: 'Pszenno' },
      { '@type': 'AdministrativeArea', name: 'Jaworzyna Śląska' },
      { '@type': 'AdministrativeArea', name: 'Żarów' },
      { '@type': 'AdministrativeArea', name: 'Marcinowice' },
      { '@type': 'AdministrativeArea', name: 'Witoszów Dolny' },
      { '@type': 'AdministrativeArea', name: 'Bystrzyca Dolna' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Sunday'],
        opens: '12:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Friday', 'Saturday'],
        opens: '12:00',
        closes: '22:00',
      },
    ],
    hasMenu: {
      '@type': 'Menu',
      name: 'Maks Sushi Menu',
      url: `${baseUrl}/${locale}#catalog`,
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
        <CustomerDrawer />
        <ProductModal />
        <CheckoutModal />
      </div>
    </I18nProvider>
  );
}
