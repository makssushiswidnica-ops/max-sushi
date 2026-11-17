import { NextRequest, NextResponse } from 'next/server';
import { Order, getSauceChoiceLabel } from '@/types';
import { products as defaultProducts } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Захист від спаму та повторної відправки одного й того ж замовлення
const notifiedOrdersCache = new Map<string, number>();
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 хвилина
const MAX_REQUESTS_PER_WINDOW = 5;   // макс. 5 сповіщень за хвилину з одного IP
const ORDER_DEDUP_TTL_MS = 30 * 60_000; // 30 хвилин пам'яті ID замовлень

function cleanupCaches(now: number) {
  for (const [id, ts] of notifiedOrdersCache.entries()) {
    if (now - ts > ORDER_DEDUP_TTL_MS) {
      notifiedOrdersCache.delete(id);
    }
  }
  for (const [ip, entry] of ipRateLimitMap.entries()) {
    if (now > entry.resetAt) {
      ipRateLimitMap.delete(ip);
    }
  }
}

function checkRateLimit(ip: string, now: number): boolean {
  const existing = ipRateLimitMap.get(ip);
  if (!existing || now > existing.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  existing.count += 1;
  return true;
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function findCatalogProduct(prod: any) {
  if (!prod) return undefined;
  return defaultProducts.find(
    (p) =>
      (prod.id && p.id === prod.id) ||
      (typeof prod.name === 'object' &&
        ((prod.name.pl && p.name.pl === prod.name.pl) ||
          (prod.name.uk && p.name.uk === prod.name.uk))) ||
      (typeof prod.name === 'string' &&
        (p.name.pl === prod.name || p.name.uk === prod.name))
  );
}

function resolveProductSku(prod: any): string {
  if (!prod) return '';
  if (prod.sku) return String(prod.sku);
  if (prod.nutrition?.sku) return String(prod.nutrition.sku);

  const matched = findCatalogProduct(prod);
  if (matched?.sku) return String(matched.sku);
  if ((matched as any)?.nutrition?.sku) return String((matched as any).nutrition.sku);
  return '';
}

function formatTelegramOrderMessage(order: Order): string {
  const isPickup = order.deliveryMethod === 'pickup';
  const rawPhone = (order.phone || '').replace(/\s+/g, '');
  const phoneFormatted = rawPhone.startsWith('+') ? rawPhone : `+48${rawPhone.replace(/^\+?48/, '')}`;

  const deliveryHeader = isPickup
    ? '🏪 <b>Самовивіз</b> (ul. Parkowa 8)'
    : '🚗 <b>Доставка курʼєром</b>';

  let addressBlock = '';
  if (!isPickup && order.address) {
    const city = order.address.city || 'Świdnica';
    const street = order.address.street || '';
    const house = order.address.house || '';
    const apt = order.address.apartment ? `, кв. ${order.address.apartment}` : '';
    const floor = order.address.floor ? `, поверх ${order.address.floor}` : '';
    const code = order.address.entryCode ? ` (код: ${order.address.entryCode})` : '';
    const fullAddr = `${city}, ul. ${street} ${house}${apt}${floor}${code}`;
    const mapsQuery = encodeURIComponent(`${city}, ${street} ${house}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    addressBlock = `📍 <b>Адреса:</b> ${escapeHtml(fullAddr)}\n🗺 <a href="${mapsUrl}">Відкрити на Google Maps</a>\n`;
  }

  // Час замовлення
  let timingText = '⚡ Якнайшвидше (ASAP)';
  if (order.timingType === 'scheduled' && order.scheduledTime) {
    const dayLabel = order.scheduledDate === 'tomorrow' ? 'ЗАВТРА' : 'Сьогодні';
    timingText = `🕒 <b>На час: ${escapeHtml(order.scheduledTime)} (${dayLabel})</b>`;
  }

  // Спосіб оплати
  let paymentLabel = '💵 Готівка';
  if (order.paymentMethod === 'blik_online' || order.paymentMethod === 'card_courier') {
    paymentLabel = '💳 BLIK / Картка';
  }
  if (order.changeFrom) {
    paymentLabel += ` (Решта з: <b>${escapeHtml(order.changeFrom)} zł</b>)`;
  }

  // Перевірка цілісності суми та формування списку позицій
  let calculatedRawItemsSum = 0;

  const itemLines = (order.items || []).slice(0, 50).map((item, idx) => {
    const prod: any = item.product || {};
    const qty = Math.max(1, Number(item.quantity || 1));
    const prodName =
      typeof prod.name === 'object'
        ? prod.name.pl || prod.name.uk || 'Pozycja'
        : String(prod.name || 'Pozycja');

    const sku = resolveProductSku(prod);
    const skuBadge = sku ? ` <b>[#${escapeHtml(sku)}]</b>` : '';

    const catalogItem = findCatalogProduct(prod);
    const optBakedP = prod.bakedPrice ?? prod.nutrition?.bakedPrice ?? catalogItem?.bakedPrice ?? 1;
    const optTempuraP = prod.tempuraPrice ?? prod.nutrition?.tempuraPrice ?? catalogItem?.tempuraPrice ?? 2;

    const badges: string[] = [];
    if (item.selectedOptions?.sauce) {
      badges.push(`🥣 ${getSauceChoiceLabel(item.selectedOptions.sauce, 'pl')}`);
    }
    if (item.selectedOptions?.baked) badges.push(`🔥 Печена риба (+${optBakedP} zł)`);
    if (item.selectedOptions?.tempura) badges.push(`🍤 У темпурі (+${optTempuraP} zł)`);
    if (item.isGift) badges.push('🎁 ПОДАРУНОК (0 zł)');

    const extraPrice =
      (item.selectedOptions?.baked ? Number(optBakedP) : 0) +
      (item.selectedOptions?.tempura ? Number(optTempuraP) : 0);
    const unitPrice = item.isGift ? 0 : Number(prod.price || 0) + extraPrice;
    const lineTotal = unitPrice * qty;

    if (!item.isGift) {
      const refBasePrice = catalogItem ? Number(catalogItem.price) : Number(prod.price || 0);
      calculatedRawItemsSum += (refBasePrice + extraPrice) * qty;
    }

    const badgeStr = badges.length > 0 ? `\n   ➔ <i>${badges.join(', ')}</i>` : '';
    return `${idx + 1}. <b>${qty}×</b> ${escapeHtml(prodName)}${skuBadge} — <b>${lineTotal} zł</b>${badgeStr}`;
  });

  // Додаткові рядки суми
  const summaryExtras: string[] = [];
  if (!isPickup) {
    summaryExtras.push(
      `🚚 Доставка: <b>${order.deliveryFee && order.deliveryFee > 0 ? `${order.deliveryFee} zł` : 'Безкоштовно (0 zł)'}</b>`
    );
  }
  const isBirthday = Boolean(order.isBirthday || order.birthdayDiscount || /URODZINY/i.test(order.comment || ''));
  if (order.birthdayDiscount && order.birthdayDiscount > 0) {
    summaryExtras.push(`🎂 <b>Знижка День народження (-10%): -${order.birthdayDiscount} zł</b>`);
  }
  if (order.firstOrderDiscount && order.firstOrderDiscount > 0) {
    summaryExtras.push(`🎉 Вітальна знижка (-10%): <b>-${order.firstOrderDiscount} zł</b>`);
  }

  // Перевірка на підозріле заниження ціни через DevTools (допускаємо до 35% сумарних акцій/знижок)
  const minExpectedTotal = Math.floor(calculatedRawItemsSum * 0.65);
  const isPriceSuspicious =
    calculatedRawItemsSum > 0 && Number(order.total || 0) < minExpectedTotal;

  // Очищуємо коментар від службових тегів, якщо вони вже виведені вище
  const cleanComment = (order.comment || '')
    .replace(/\[🎂\s*URODZINY[^\]]*\]/gi, '')
    .replace(/\[НА ЗАВТРА[^\]]*\]/gi, '')
    .replace(/\[НА ЧАС[^\]]*\]/gi, '')
    .replace(/\[ПАЛИЧКИ[^\]]*\]/gi, '')
    .trim();

  const chopsticksLabel =
    order.personsCount === 0
      ? 'Без паличок (Bez pałeczek)'
      : `${order.personsCount ?? 1} компл.`;

  const lines = [
    `🍣 <b>НОВЕ ЗАМОВЛЕННЯ #${escapeHtml(order.id)}</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    isBirthday ? `🎂 <b>ДЕНЬ НАРОДЖЕННЯ (-10%) — ПЕРЕВІРИТИ ДОКУМЕНТ!</b>` : null,
    `👤 <b>Клієнт:</b> ${escapeHtml(order.name || 'Гість')}`,
    `📞 <b>Телефон:</b> <a href="tel:${escapeHtml(phoneFormatted)}">${escapeHtml(phoneFormatted)}</a>`,
    deliveryHeader,
    addressBlock ? addressBlock.trimEnd() : null,
    timingText,
    `🥢 <b>Палички:</b> ${chopsticksLabel}`,
    cleanComment ? `💬 <b>Коментар:</b> <i>${escapeHtml(cleanComment)}</i>` : null,
    `━━━━━━━━━━━━━━━━━━`,
    `🍱 <b>СКЛАД ЗАМОВЛЕННЯ:</b>`,
    ...itemLines,
    `━━━━━━━━━━━━━━━━━━`,
    ...summaryExtras,
    `💳 <b>Оплата:</b> ${paymentLabel}`,
    `💰 <b>РАЗОМ ДО СПЛАТИ: ${order.total} zł</b>`,
    isPriceSuspicious ? `⚠️ <b>УВАГА: Перевірте ціни страв в адмінці!</b>` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

async function discoverChatIdsFromUpdates(token: string): Promise<string[]> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.result)) return [];

    const discovered = new Set<string>();
    for (const update of data.result) {
      const chat =
        update.message?.chat ||
        update.edited_message?.chat ||
        update.my_chat_member?.chat ||
        update.channel_post?.chat;
      if (chat?.id) {
        discovered.add(String(chat.id));
      }
      if (update.message?.migrate_to_chat_id) {
        discovered.add(String(update.message.migrate_to_chat_id));
      }
    }
    return Array.from(discovered);
  } catch (err) {
    console.error('Telegram getUpdates discovery error:', err);
    return [];
  }
}

async function resolveTargetChatIds(token: string): Promise<string[]> {
  const envChatIds = (process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (envChatIds.length > 0) {
    return envChatIds;
  }

  return discoverChatIdsFromUpdates(token);
}

export async function POST(req: NextRequest) {
  try {
    const now = Date.now();
    cleanupCaches(now);

    // 1. Захист Rate Limit за IP-адресою
    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    if (!checkRateLimit(clientIp, now)) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' },
        { status: 200 }
      );
    }

    const body = await req.json();
    const order: Order | undefined = body?.order;
    if (
      !order ||
      !order.id ||
      order.id === '__settings__' ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return NextResponse.json({ ok: false, error: 'Invalid order payload' }, { status: 400 });
    }

    const orderIdStr = String(order.id).trim();

    // 2. Анти-дубль: не дозволяємо відправляти одне й те саме замовлення двічі
    if (notifiedOrdersCache.has(orderIdStr)) {
      return NextResponse.json({ ok: true, skipped: 'Order already notified' });
    }

    // 3. Перевірка, що замовлення реально створене в базі Supabase (захист від фейкових POST-запитів)
    if (isSupabaseConfigured) {
      const { data: dbOrder, error: dbErr } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderIdStr)
        .maybeSingle();

      if (!dbErr && !dbOrder) {
        return NextResponse.json(
          { ok: false, error: 'Order not found in database' },
          { status: 403 }
        );
      }
    }

    notifiedOrdersCache.set(orderIdStr, now);

    const chatIds = await resolveTargetChatIds(token);
    if (chatIds.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No TELEGRAM_CHAT_ID found. Send /start to @MaksSushiOrdersBot in your Telegram group.',
        },
        { status: 200 }
      );
    }

    const text = formatTelegramOrderMessage(order);

    const results = await Promise.all(
      chatIds.map(async (chatId) => {
        const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        });
        const data = await resp.json();

        // Якщо група автоматично оновилась до супергрупи (наприклад, після видачі прав адміна),
        // автоматично відправляємо на новий ID супергрупи
        const migratedId = data?.parameters?.migrate_to_chat_id;
        if (!data?.ok && migratedId) {
          const retryResp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: migratedId,
              text,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            }),
          });
          return retryResp.json();
        }

        // Додатковий захист: якщо старий ID групи більше не дійсний, шукаємо актуальний ID через getUpdates
        if (!data?.ok) {
          const discoveredIds = await discoverChatIdsFromUpdates(token);
          const fallbackId = discoveredIds.find((id) => id !== String(chatId) && id.startsWith('-100'));
          if (fallbackId) {
            const fallbackResp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: fallbackId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
              }),
            });
            return fallbackResp.json();
          }
        }

        return data;
      })
    );

    return NextResponse.json({ ok: true, chatIds, results });
  } catch (error: any) {
    console.error('Telegram notification error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Telegram notify error' },
      { status: 200 }
    );
  }
}
