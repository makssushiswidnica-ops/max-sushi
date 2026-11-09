'use client';

import React from 'react';
import { Ticket, Percent, Check, ArrowRight } from 'lucide-react';

interface FirstOrderCouponCardProps {
  locale: 'pl' | 'uk';
  discountPercent?: number;
  isRegistered: boolean;
  isEligible: boolean;
  onLoginClick?: () => void;
}

export function FirstOrderCouponCard({
  locale,
  discountPercent = 10,
  isRegistered,
  isEligible,
  onLoginClick,
}: FirstOrderCouponCardProps) {
  // Якщо клієнт уже зареєстрований і вже використав купон (має попередні замовлення) — не показуємо
  if (isRegistered && !isEligible) {
    return null;
  }

  // 1. Стан: Клієнт зареєстрований і купон активний (0 замовлень)
  if (isRegistered && isEligible) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-[#101915] to-[#12121c] p-3 text-zinc-300 select-none shadow-sm shadow-emerald-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {locale === 'pl' ? 'Kupon powitalny' : 'Вітальний купон'}
                </span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  -{discountPercent}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {locale === 'pl'
                  ? 'Zniżka na 1. zamówienie naliczy się przy kasie'
                  : 'Знижка на 1-ше замовлення нарахується в чеку'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{locale === 'pl' ? 'Aktywny' : 'Активний'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Стан: Користувач не зареєстрований — пропонуємо увійти / зареєструватися для отримання знижки
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[#181615] to-[#14141e] p-3 text-zinc-300 select-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {locale === 'pl' ? 'Zniżka na pierwsze zamówienie' : 'Знижка на перше замовлення'}
              </span>
              <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                -{discountPercent}%
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {locale === 'pl'
                ? 'Dla zarejestrowanych klientów'
                : 'Для зареєстрованих клієнтів'}
            </p>
          </div>
        </div>

        {onLoginClick && (
          <button
            type="button"
            onClick={onLoginClick}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#e50914] hover:bg-[#f4222d] text-white transition-all cursor-pointer shadow-sm shadow-[#e50914]/25 active:scale-95"
          >
            <span>{locale === 'pl' ? 'Zaloguj się' : 'Увійти'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

