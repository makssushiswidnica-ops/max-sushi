'use client';

import React from 'react';
import { useI18n } from '@/lib/i18nContext';

export function HeroBanner() {
  const { locale } = useI18n();

  const scrollToMenu = () => {
    // Завжди повертаємо каталог до початкового стану (сітка з папками/зображеннями категорій)
    window.dispatchEvent(new CustomEvent('reset-to-initial-catalog'));

    // Невеликий тайймаут щоб стан у MenuCatalog встиг оновитися і відрендерити categories-folders-grid
    setTimeout(() => {
      const el = document.getElementById('categories-folders-grid') || document.querySelector('section');
      if (el) {
        const headerEl = document.querySelector('header');
        const totalStickyHeight = (headerEl?.offsetHeight || 105) + 15;

        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = Math.max(0, elementPosition - totalStickyHeight);

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 20);
  };

  return (
    <div className="relative overflow-hidden min-h-[500px] sm:min-h-[560px] flex flex-col justify-between border-b border-white/10 pt-12 sm:pt-16 pb-8 sm:pb-10">
      {/* Фонове атмосферне зображення зі свіжими суші-ролами */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero_sushi_bg.jpg"
          alt="Najlepsze Sushi w Świdnicy"
          className="w-full h-full object-cover object-left sm:object-center"
        />
        {/* Збалансоване затемнення: м'яка радіальна та вертикальна віньєтка, що забезпечує ідеальну контрастність тексту по центру */}
        <div className="absolute inset-0 bg-[#09090b]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/20 via-[#09090b]/60 to-[#09090b]/85" />
      </div>

      {/* Верхня частина з заголовком — відцентрована */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-4 sm:pt-6">
        <div className="max-w-5xl mx-auto text-center px-2">
          {/* Заголовок у чистому, бездоганно читабельному Montserrat з повною підтримкою Ś, ę, ą, та кирилиці */}
          <h1 
            style={{ 
              fontFamily: 'var(--font-knewave), "Knewave", cursive, sans-serif',
              WebkitTextStroke: '0.4px #09090b',
              paintOrder: 'stroke fill',
            }}
            className="text-[2.65rem] xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#fdf8f4] tracking-wide leading-[1.12] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] max-w-full break-normal"
          >
            {locale === 'pl' ? (
              <>
                Najlepsze Sushi w{' '}
                <span className="whitespace-nowrap inline-block">
                  <span className="inline-block relative">
                    <span className="inline-block">S</span>
                    <span 
                      aria-hidden="true" 
                      className="absolute -top-[0.22em] left-[0.28em] text-[0.65em] font-black pointer-events-none select-none text-[#fdf8f4]"
                      style={{ transform: 'rotate(18deg)' }}
                    >
                      ˊ
                    </span>
                  </span>
                  widnicy
                </span>
              </>
            ) : (
              <span className="whitespace-nowrap inline-block">
                Найкращі Суші у Свідниці
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Середня частина: Велика акцентна червона кнопка зі скошеними кутами (самурайський стиль) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto py-8 sm:py-12">
        <div className="flex items-center justify-center">
          <button
            onClick={scrollToMenu}
            aria-label={locale === 'pl' ? 'Wybierz rolki' : 'Обрати роли'}
            className="animate-auto-pulse group relative inline-flex items-center justify-center p-[2.5px] sm:p-[3px] hover:scale-105 active:scale-95 cursor-pointer transition-all duration-300 drop-shadow-[0_0_35px_rgba(229,9,20,0.6)]"
            style={{
              clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
            }}
          >
            {/* Обертовий яскравий світлячок по скошеному контуру */}
            <span 
              className="absolute w-[350%] h-[350%] -top-[125%] -left-[125%]"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 200deg, #ff8088 280deg, #ffffff 360deg)',
                animation: 'spinBeam 2s linear infinite',
              }}
            />

            {/* Внутрішнє тіло кнопки: насичений фірмовий червоний фон, збільшений розмір */}
            <span 
              className="relative flex items-center justify-center gap-3 px-8 sm:px-16 py-4 sm:py-5 bg-gradient-to-r from-[#e50914] via-[#f4222d] to-[#b80710] group-hover:brightness-110 transition-all duration-300 w-full h-full shadow-inner"
              style={{
                clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
              }}
            >
              <span className="text-sm sm:text-lg font-black tracking-[0.22em] uppercase text-white select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                {locale === 'pl' ? 'Wybierz rolki' : 'Обрати роли'}
              </span>
              <span className="text-white text-base sm:text-xl font-black group-hover:translate-x-1.5 transition-transform drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                ›
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Нижня частина: плашки промоцій. На мобільних — без рамок і фону, 3 елементи в рядок: кружечок + текст поруч; повний оригінальний текст */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 relative z-10 w-full mt-6 sm:mt-16">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 w-full">
          {/* 10% З нагоди дня народження */}
          <div className="flex flex-row items-center text-left gap-2 sm:gap-3.5 p-0 bg-transparent">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-[#e50914] text-white flex flex-col items-center justify-center font-black leading-none shrink-0 shadow-md shadow-[#e50914]/35">
              <span className="text-[10px] sm:text-sm font-black">10%</span>
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-sm font-bold text-white uppercase tracking-wider leading-tight">
                {locale === 'pl' ? 'Z okazji urodzin' : 'З нагоди дня народження'}
              </div>
              <div className="text-[7.5px] sm:text-[11px] text-zinc-400 sm:text-zinc-300/90 leading-tight mt-0.5">
                {locale === 'pl' ? '*Nie łączy się z innymi rabatami' : '*Не сумується з іншими знижками'}
              </div>
            </div>
          </div>

          {/* 5% Самовивіз */}
          <div className="flex flex-row items-center text-left gap-2 sm:gap-3.5 p-0 bg-transparent">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-[#b80710] text-white flex flex-col items-center justify-center font-black leading-none shrink-0 shadow-md shadow-[#b80710]/35">
              <span className="text-[10px] sm:text-sm font-black">5%</span>
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-sm font-bold text-white uppercase tracking-wider leading-tight">
                {locale === 'pl' ? 'Odbiór własny' : 'Самовивіз із закладу'}
              </div>
              <div className="text-[7.5px] sm:text-[11px] text-zinc-400 sm:text-zinc-300/90 leading-tight mt-0.5">
                {locale === 'pl' ? 'Rabat przy odbiorze' : 'Знижка на все замовлення'}
              </div>
            </div>
          </div>

          {/* Безкоштовна доставка */}
          <div className="flex flex-row items-center text-left gap-2 sm:gap-3.5 p-0 bg-transparent">
            <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-[#e50914] text-white flex flex-col items-center justify-center font-black leading-none shrink-0 shadow-md shadow-[#e50914]/35">
              <span className="text-[8px] sm:text-xs font-black tracking-tight">0 ZŁ</span>
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-sm font-bold text-white uppercase tracking-wider leading-tight">
                {locale === 'pl' ? 'Darmowa dostawa' : 'Безкоштовна доставка'}
              </div>
              <div className="text-[7.5px] sm:text-[11px] text-zinc-400 sm:text-zinc-300/90 leading-tight mt-0.5">
                {locale === 'pl' ? 'Przy zamówieniu powyżej 100 zł' : 'При замовленні від 100 zł'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
