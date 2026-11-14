import React from 'react';
import type { Metadata } from 'next';
import { Locale } from '@/types';
import { LegalDocumentView } from '@/components/legal/LegalDocumentView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'uk' ? 'uk' : 'pl') as Locale;

  return {
    title:
      locale === 'pl'
        ? 'Polityka Prywatności i Ochrony Danych (RODO) — Maks Sushi Świdnica'
        : 'Політика конфіденційності та захисту даних (RODO) — Maks Sushi Свідниця',
    description:
      locale === 'pl'
        ? 'Zasady przetwarzania i ochrony danych osobowych RODO w serwisie Maks Sushi Świdnica (maks-sushi.pl).'
        : 'Правила обробки та захисту персональних даних RODO / GDPR у сервісі Maks Sushi Свідниця (maks-sushi.pl).',
  };
}

export default async function PolitykaPrywatnosciPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'uk' ? 'uk' : 'pl') as Locale;

  return <LegalDocumentView locale={locale} activeDoc="prywatnosc" />;
}

