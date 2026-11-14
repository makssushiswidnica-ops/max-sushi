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
        ? 'Regulamin Sklepu i Zamówień Online — Maks Sushi Świdnica'
        : 'Правила та умови замовлень (Regulamin) — Maks Sushi Свідниця',
    description:
      locale === 'pl'
        ? 'Regulamin składania zamówień online, dostawy, płatności i reklamacji w Maks Sushi Świdnica (maks-sushi.pl).'
        : 'Правила оформлення онлайн-замовлень, доставки, оплати та рекламацій у Maks Sushi Свідниця (maks-sushi.pl).',
  };
}

export default async function RegulaminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'uk' ? 'uk' : 'pl') as Locale;

  return <LegalDocumentView locale={locale} activeDoc="regulamin" />;
}

