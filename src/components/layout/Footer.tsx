'use client';

import { useI18n } from '@/lib/i18nContext';
import { brandTheme } from '@/config/theme';
import { Phone, MapPin, Clock, Heart } from 'lucide-react';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-white/5">
          {/* Бренд */}
          <div className="space-y-3">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('reset-to-initial-catalog'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
              aria-label="Strona główna Maks Sushi"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#e50914] bg-black shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src={brandTheme.logo}
                  alt={brandTheme.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-baseline gap-1.5 font-brand">
                <span className="text-xl text-[#e50914] leading-none">MAKS</span>
                <span className="text-xl text-white group-hover:text-zinc-200 transition-colors leading-none">SUSHI</span>
              </div>
            </button>
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
            <div className="flex items-start gap-2 text-zinc-300">
              <MapPin className="w-4 h-4 text-[#e50914] shrink-0 mt-0.5" />
              <div>
                <span className="block font-medium">{brandTheme.contacts.address}</span>
                <span className="text-[11px] text-zinc-500">
                  {locale === 'pl' ? 'Odbiór osobisty i dostawa w Świdnicy' : 'Самовивіз та доставка по Свідниці'}
                </span>
              </div>
            </div>

            {/* Соціальні мережі */}
            <div className="pt-2 flex flex-col gap-2 text-xs">
              <a
                href={brandTheme.contacts.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
              >
                <span className="w-5 h-5 rounded-md bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
                  f
                </span>
                <span className="group-hover:text-white font-medium">{brandTheme.contacts.socials.facebookHandle}</span>
              </a>
              <a
                href={brandTheme.contacts.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
              >
                <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#f9ce34]/20 via-[#ee2a7b]/20 to-[#6228d7]/20 border border-[#ee2a7b]/40 text-[#ee2a7b] group-hover:bg-gradient-to-tr group-hover:from-[#f9ce34] group-hover:via-[#ee2a7b] group-hover:to-[#6228d7] group-hover:text-white flex items-center justify-center transition-all p-0.5">
                  <InstagramIcon className="w-3.5 h-3.5" />
                </span>
                <span className="group-hover:text-white font-medium">{brandTheme.contacts.socials.instagramHandle}</span>
              </a>
            </div>
          </div>

          {/* Графік роботи */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#e50914]" />
              <span>{locale === 'pl' ? 'Godziny otwarcia' : 'Графік роботи'}</span>
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {brandTheme.contacts.schedule.map((item, idx) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-white/5">
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
          <div className="flex items-center gap-1">
            <span>Зроблено з любовʼю до якісних суші</span>
            <Heart className="w-3.5 h-3.5 text-[#e50914] fill-[#e50914]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
