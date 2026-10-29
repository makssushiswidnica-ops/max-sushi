import pl from '@/dictionaries/pl.json';
import uk from '@/dictionaries/uk.json';
import { Locale } from '@/types';

export type Dictionary = typeof pl;

const dictionaries: Record<Locale, Dictionary> = {
  pl,
  uk,
};

export const getDictionary = (locale: Locale): Dictionary => {
  return dictionaries[locale] || dictionaries.pl;
};

export const defaultLocale: Locale = 'pl';
export const locales: Locale[] = ['pl', 'uk'];
