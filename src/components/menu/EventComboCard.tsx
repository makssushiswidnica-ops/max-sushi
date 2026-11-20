'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Check, ShoppingBag } from 'lucide-react';
import {
  Product,
  PromoComboItem,
  LocalizedString,
  SauceChoiceKey,
  TEMPURA_SAUCE_CHOICES,
  requiresSauceSelection,
  getSauceChoiceLabel,
  AllergenKey,
} from '@/types';
import { useI18n } from '@/lib/i18nContext';
import { useCartStore } from '@/store/useCartStore';
import { cn, formatPrice } from '@/lib/utils';

interface EventComboCardProps {
  combo: PromoComboItem;
  comboIndex: number;
  eventName: LocalizedString;
  productsList: Product[];
}

export function EventComboCard({
  combo,
  comboIndex,
  eventName,
  productsList,
}: EventComboCardProps) {
  const { locale } = useI18n();
  const addItem = useCartStore((s) => s.addItem);
  const setSelectedProduct = useCartStore((s) => s.setSelectedProduct);

  // Обов'язковий вибір безкоштовного соусу для страв, які цього потребують (за замовчуванням не обрано)
  const [saucesBySlot, setSaucesBySlot] = useState<Record<number, SauceChoiceKey>>({});
  const [sauceError, setSauceError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Кожна ячейка — це 1 конкретна позиція з меню (1 + 1 + ...)
  const resolvedSlots = useMemo(() => {
    return (combo.slots || [])
      .map((slot, slotIdx) => {
        const firstId = slot.productIds?.[0];
        if (!firstId) return null;
        const activeProduct = productsList.find((p) => p.id === firstId);
        if (!activeProduct) return null;

        const needsSauce = requiresSauceSelection(activeProduct);
        const activeSauce: SauceChoiceKey | undefined = saucesBySlot[slotIdx];

        return {
          slotIdx,
          activeProduct,
          needsSauce,
          activeSauce,
        };
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [combo.slots, productsList, saucesBySlot]);

  // Підрахунок вартості та знижки
  const originalTotal = resolvedSlots.reduce((sum, s) => sum + (s.activeProduct.price || 0), 0);
  const discountPercent = Math.max(1, Math.min(90, Number(combo.discountPercent) || 10));
  const discountedTotal = Math.round(originalTotal * (1 - discountPercent / 100));
  const totalWeight = resolvedSlots.reduce((sum, s) => sum + (s.activeProduct.weight || 0), 0);
  const totalPieces = resolvedSlots.reduce((sum, s) => sum + (s.activeProduct.pieces || 0), 0);

  // Формуємо опис складу набору
  const comboDisplayTitle = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const s of resolvedSlots) {
      const id = s.activeProduct.id;
      const name = s.activeProduct.name[locale] || s.activeProduct.name.pl;
      const prev = counts.get(id);
      if (prev) {
        prev.count += 1;
      } else {
        counts.set(id, { name, count: 1 });
      }
    }

    return Array.from(counts.values())
      .map((item) => (item.count > 1 ? `${item.count}× ${item.name}` : item.name))
      .join(' + ');
  }, [locale, resolvedSlots]);

  if (resolvedSlots.length < 2) {
    return null;
  }

  const universalEventTitle = (eventName[locale] || eventName.pl || 'BLACK FRIDAY').trim();

  const handleAddCombo = () => {
    // Блокуємо додавання в кошик, якщо є позиція з обов'язковим соусом і соус ще не обрано
    const hasMissingSauce = resolvedSlots.some((s) => s.needsSauce && !s.activeSauce);
    if (hasMissingSauce) {
      setSauceError(true);
      return;
    }

    const buildLocalizedComboName = (lang: 'pl' | 'uk') => {
      const evTitle = (eventName[lang] || eventName.pl || 'COMBO').toUpperCase();
      const parts = resolvedSlots.map((s) => {
        const baseName = s.activeProduct.name[lang] || s.activeProduct.name.pl;
        const skuTag = s.activeProduct.sku ? ` #${s.activeProduct.sku}` : '';
        const sauceTag = s.needsSauce && s.activeSauce
          ? ` (${getSauceChoiceLabel(s.activeSauce, lang)})`
          : '';
        return `${baseName}${skuTag}${sauceTag}`;
      });
      return `${evTitle} (-${discountPercent}%): ${parts.join(' + ')}`;
    };

    const combinedSku = resolvedSlots
      .map((s) => s.activeProduct.sku || '')
      .filter(Boolean)
      .join('+');

    const combinedIngredientsPl = Array.from(
      new Set(resolvedSlots.flatMap((s) => s.activeProduct.ingredients?.pl || []))
    );
    const combinedIngredientsUk = Array.from(
      new Set(resolvedSlots.flatMap((s) => s.activeProduct.ingredients?.uk || []))
    );
    const combinedAllergens = Array.from(
      new Set(resolvedSlots.flatMap((s) => s.activeProduct.allergens || []))
    ) as AllergenKey[];

    const variantSignature = resolvedSlots
      .map((s) => `${s.activeProduct.id}${s.needsSauce && s.activeSauce ? `-${s.activeSauce}` : ''}`)
      .join('__');

    const bundledProduct: Product = {
      id: `combo-${combo.id}-${variantSignature}`,
      sku: combinedSku || `COMBO-${comboIndex + 1}`,
      discountPercent: 0,
      name: {
        pl: buildLocalizedComboName('pl'),
        uk: buildLocalizedComboName('uk'),
      },
      description: {
        pl: resolvedSlots.map((s) => s.activeProduct.name.pl).join(' + '),
        uk: resolvedSlots.map((s) => s.activeProduct.name.uk).join(' + '),
      },
      price: discountedTotal,
      weight: totalWeight,
      pieces: totalPieces > 0 ? totalPieces : undefined,
      categoryId: 'event-promos',
      image: resolvedSlots[0]?.activeProduct.image || '',
      badge: 'sale',
      ingredients: {
        pl: combinedIngredientsPl,
        uk: combinedIngredientsUk,
      },
      nutrition: {
        calories: resolvedSlots.reduce((acc, s) => acc + (s.activeProduct.nutrition?.calories || 0), 0),
        proteins: resolvedSlots.reduce((acc, s) => acc + (s.activeProduct.nutrition?.proteins || 0), 0),
        fats: resolvedSlots.reduce((acc, s) => acc + (s.activeProduct.nutrition?.fats || 0), 0),
        carbs: resolvedSlots.reduce((acc, s) => acc + (s.activeProduct.nutrition?.carbs || 0), 0),
        sku: combinedSku || `COMBO-${comboIndex + 1}`,
      },
      isAvailable: true,
      allergens: combinedAllergens,
      comboItems: resolvedSlots.map((s) => ({
        id: s.activeProduct.id,
        name: s.activeProduct.name,
        image: s.activeProduct.image,
        pieces: s.activeProduct.pieces,
        price: s.activeProduct.price,
        sauce: s.needsSauce ? s.activeSauce : undefined,
      })),
      comboOriginalPrice: originalTotal,
      comboDiscountPercent: discountPercent,
      comboEventName: eventName,
    };

    addItem(bundledProduct, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1300);
  };

  const slotsCount = resolvedSlots.length;
  const slotsNeedingSauce = resolvedSlots.filter((s) => s.needsSauce);

  return (
    <div
      style={{
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      }}
      className="group relative w-full h-full p-[1px] bg-white/10 hover:bg-[#e50914]/50 shadow-lg hover:shadow-2xl hover:shadow-[#e50914]/15 transition-all duration-300 flex flex-col"
    >
      <div
        style={{
          clipPath: 'polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)',
        }}
        className="w-full h-full bg-[#0d0d12] group-hover:bg-[#13131c] transition-colors duration-300 p-3.5 sm:p-5 flex flex-col justify-between gap-3.5"
      >
        <div className="space-y-3.5">
          {/* Горизонтальна червона стрічка вгорі картки з відступом (у стилі акційних стрічок) */}
          <div
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
            className="w-full py-2 px-3.5 bg-gradient-to-r from-[#e50914] via-[#85050b] to-[#0a0a10] border border-[#e50914]/60 shadow-md shadow-black/80 flex items-center justify-between gap-2 select-none"
          >
            <div className="flex items-center gap-1.5 min-w-0 text-white text-xs sm:text-sm font-black uppercase tracking-wider truncate">
              <span className="truncate">{universalEventTitle}</span>
              <span className="text-white/50">•</span>
              <span className="shrink-0">
                {locale === 'pl' ? `Zestaw #${comboIndex + 1}` : `Набір #${comboIndex + 1}`}
              </span>
            </div>

            <span className="text-white text-xs sm:text-sm font-black tracking-wider shrink-0 drop-shadow">
              -{discountPercent}%
            </span>
          </div>

          {/* Візуальний колаж страв набору (1 + 1 ... до 5) */}
          <div
            className={cn(
              'relative grid gap-2 sm:gap-2.5 items-stretch',
              slotsCount === 2
                ? 'grid-cols-2'
                : slotsCount === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
            )}
          >
            {resolvedSlots.map((slot) => {
              const prod = slot.activeProduct;
              return (
                <div
                  key={`${slot.slotIdx}-${prod.id}`}
                  className="relative group/img overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08)_0%,_#07070b_70%)] border border-white/10 hover:border-[#e50914]/50 transition-all flex flex-col justify-between aspect-[4/3]"
                >
                  {/* Фото страви (клік відкриває модалку деталей страви) */}
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(prod)}
                    title={locale === 'pl' ? 'Zobacz szczegóły dania' : 'Переглянути деталі страви'}
                    className="w-full h-full relative overflow-hidden cursor-pointer text-left"
                  >
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name[locale]}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#12121c] text-2xl">
                        🍣
                      </div>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Декоративні знаки "+" між віконцями для 2 або 3 позицій */}
            {slotsCount === 2 && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e50914] text-white font-black text-base flex items-center justify-center shadow-[0_0_15px_#e50914] border-2 border-[#0d0d12]">
                +
              </div>
            )}
            {slotsCount === 3 && (
              <>
                <div className="pointer-events-none absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#e50914] text-white font-black text-sm flex items-center justify-center shadow-[0_0_12px_#e50914] border-2 border-[#0d0d12]">
                  +
                </div>
                <div className="pointer-events-none absolute left-2/3 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#e50914] text-white font-black text-sm flex items-center justify-center shadow-[0_0_12px_#e50914] border-2 border-[#0d0d12]">
                  +
                </div>
              </>
            )}
          </div>

          {/* Опис складу набору (не жирним шрифтом, однакова мінімальна висота для рівних карток без соусів) */}
          <p className="text-sm sm:text-[15px] font-medium text-zinc-200 leading-snug min-h-[2.6rem] flex items-center">
            {comboDisplayTitle}
          </p>

          {/* Обовʼязковий вибір безкоштовного соусу (точно як у звичайних картках позицій) */}
          {slotsNeedingSauce.map((slot) => {
            const selectedSauce = slot.activeSauce;
            const isSlotMissingSauce = sauceError && !selectedSauce;

            return (
              <div
                key={slot.slotIdx}
                className={cn(
                  'pt-3 border-t space-y-2 transition-colors',
                  isSlotMissingSauce ? 'border-red-500/50' : 'border-white/10'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-bold text-zinc-300 uppercase tracking-wider">
                    {locale === 'pl' ? 'Wybierz 1 sos (wymagane):' : 'Оберіть 1 соус (обовʼязково):'}
                  </span>
                  {isSlotMissingSauce && (
                    <span className="text-[10.5px] font-black text-[#ff4d58] animate-pulse">
                      {locale === 'pl' ? 'Wymagany wybór!' : 'Обовʼязковий вибір!'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {TEMPURA_SAUCE_CHOICES.map((sauce, idx) => {
                    const isChosen = selectedSauce === sauce.key;
                    const isLastFullWidth = idx === TEMPURA_SAUCE_CHOICES.length - 1;
                    return (
                      <button
                        key={sauce.key}
                        type="button"
                        onClick={() => {
                          setSaucesBySlot((prev) => {
                            const next = { ...prev, [slot.slotIdx]: sauce.key };
                            const stillMissing = slotsNeedingSauce.some(
                              (s) => !(s.slotIdx === slot.slotIdx ? sauce.key : next[s.slotIdx])
                            );
                            if (!stillMissing) {
                              setSauceError(false);
                            }
                            return next;
                          });
                        }}
                        style={{
                          clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                        }}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-none border transition-all cursor-pointer text-left select-none',
                          isLastFullWidth && 'sm:col-span-2',
                          isChosen
                            ? 'bg-[#e50914]/15 border-[#e50914]/70 text-white shadow-sm shadow-red-500/20'
                            : isSlotMissingSauce
                              ? 'bg-red-500/10 border-red-500/50 text-zinc-200 hover:border-red-400'
                              : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/10'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              'w-4 h-4 rounded-xs border flex items-center justify-center transition-colors shrink-0',
                              isChosen
                                ? 'bg-[#e50914] border-red-400 text-white'
                                : isSlotMissingSauce
                                  ? 'border-red-400/70 bg-transparent'
                                  : 'border-white/30 bg-transparent'
                            )}
                          >
                            {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span className="text-xs font-bold leading-tight truncate">
                            {sauce.name[locale]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Нижній блок: Ціна зі знижкою (без кількості і грамів над нею) + Кнопка "Додати набір" */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {formatPrice(discountedTotal, locale)}
            </span>
            <span className="text-xs sm:text-sm text-zinc-500 line-through font-bold">
              {formatPrice(originalTotal, locale)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddCombo}
            style={{
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
            className={cn(
              'px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 select-none active:scale-95 shrink-0 shadow-lg',
              isAdded
                ? 'bg-emerald-500 text-black shadow-emerald-500/40'
                : 'bg-[#e50914] hover:bg-[#f4222d] text-white shadow-[#e50914]/40'
            )}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{locale === 'pl' ? 'Dodano!' : 'Додано!'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{locale === 'pl' ? 'Dodaj zestaw' : 'Додати набір'}</span>
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
