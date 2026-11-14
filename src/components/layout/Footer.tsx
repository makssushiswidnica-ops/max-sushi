'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18nContext';
import { brandTheme } from '@/config/theme';
import { Phone, MapPin, Clock, Star, Navigation } from 'lucide-react';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  const { locale, t } = useI18n();

  return (
    <footer className="bg-[#070709] border-t border-white/5 py-12 text-zinc-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10 border-b border-white/5">
          {/* Бренд */}
          <div className="space-y-3">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
              aria-label="Maks Sushi"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#e50914] bg-black shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src={brandTheme.logo}
                  alt="Maks Sushi Świdnica"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-baseline gap-1.5 font-brand">
                <span className="text-xl text-[#e50914] leading-none">MAKS</span>
                <span className="text-xl text-white group-hover:text-zinc-200 transition-colors leading-none">SUSHI</span>
              </div>
            </Link>
            <p className="text-zinc-400 leading-relaxed text-xs">
              {t.footer.about}
            </p>
          </div>

          {/* Контакти та Адреса */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {locale === 'pl' ? 'Kontakt & Adres' : 'Контакти та Адреса'}
            </h4>
            <div className="flex items-center gap-2 text-zinc-300">
              <Phone className="w-4 h-4 text-[#e50914] shrink-0" />
              <a
                href={`tel:${brandTheme.contacts.phoneRaw}`}
                className="hover:text-white transition-colors font-semibold"
              >
                {brandTheme.contacts.phone}
              </a>
            </div>
            <a
              href={brandTheme.contacts.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-zinc-300 hover:text-white transition-colors group cursor-pointer"
              title={locale === 'pl' ? 'Pokaż na Google Maps' : 'Показати на Google Maps'}
            >
              <MapPin className="w-4 h-4 text-[#e50914] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-medium group-hover:underline underline-offset-2">{brandTheme.contacts.address}</span>
                <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400">
                  {locale === 'pl' ? 'Odbiór osobisty i dostawa w Świdnicy' : 'Самовивіз та доставка по Свідниці'}
                </span>
              </div>
            </a>

            {/* Бейдж рейтингу Google 4.9 ★ та кнопка маршруту */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={brandTheme.contacts.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
                title={locale === 'pl' ? 'Zobacz opinie w Google Maps' : 'Переглянути відгуки в Google Maps'}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span className="text-white font-black">4.9</span>
                <span className="text-amber-300/90">
                  {locale === 'pl' ? '(162 opinie w Google)' : '(162 відгуки в Google)'}
                </span>
              </a>

              <a
                href={brandTheme.contacts.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
              >
                <Navigation className="w-3 h-3 text-[#e50914] shrink-0" />
                <span>{locale === 'pl' ? 'Wyznacz trasę' : 'Маршрут на карті'}</span>
              </a>
            </div>

            {/* Соціальні мережі */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                {locale === 'pl' ? 'Nasze social media:' : 'Ми у соцмережах:'}
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href={brandTheme.contacts.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Facebook: Maks Sushi Świdnica"
                  className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-[#1877F2]/15 border border-white/10 hover:border-[#1877F2]/40 text-zinc-400 hover:text-[#1877F2] flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm group"
                >
                  <FacebookIcon className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                </a>
                <a
                  href={brandTheme.contacts.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram: @maks_sushi_swidnica"
                  className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-gradient-to-tr hover:from-[#f9ce34]/15 hover:via-[#ee2a7b]/15 hover:to-[#6228d7]/15 border border-white/10 hover:border-[#ee2a7b]/40 text-zinc-400 hover:text-[#ee2a7b] flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm group"
                >
                  <InstagramIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>
          </div>

          {/* Графік роботи */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#e50914]" />
              <span>{locale === 'pl' ? 'Godziny otwarcia' : 'Графік роботи'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-8 gap-y-1 text-xs">
              {brandTheme.contacts.schedule.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-zinc-400">
                    {locale === 'pl' ? item.dayPl : item.dayUk}:
                  </span>
                  <span className={item.isClosed ? 'text-red-400 font-semibold' : 'text-zinc-200 font-medium'}>
                    {locale === 'pl' ? item.hours : item.hoursUk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} {brandTheme.name}. {t.footer.rights}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-[11px] sm:text-xs text-zinc-400">
            <Link
              href={`/${locale}/regulamin`}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {locale === 'pl' ? 'Regulamin' : 'Правила та умови'}
            </Link>
            <span className="text-zinc-700">•</span>
            <Link
              href={`/${locale}/polityka-prywatnosci`}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {locale === 'pl' ? 'Polityka Prywatności (RODO)' : 'Політика конфіденційності (RODO)'}
            </Link>
            <span className="text-zinc-700">•</span>
            <Link
              href={`/${locale}/polityka-cookies`}
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {locale === 'pl' ? 'Polityka Cookies i Alergeny' : 'Cookies та Алергени'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
