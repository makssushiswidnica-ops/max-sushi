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
        ? 'Polityka Plików Cookies i Informacje o Alergenach — Maks Sushi Świdnica'
        : 'Політика файлів Cookies та Інформація про алергени — Maks Sushi Свідниця',
    description:
      locale === 'pl'
        ? 'Informacje o plikach cookies oraz wykaz alergenów pokarmowych w Maks Sushi Świdnica (maks-sushi.pl).'
        : 'Інформація про файли cookies та перелік харчових алергенів у Maks Sushi Свідниця (maks-sushi.pl).',
  };
}

export default async function PolitykaCookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'uk' ? 'uk' : 'pl') as Locale;

  return <LegalDocumentView locale={locale} activeDoc="cookies" />;
}

