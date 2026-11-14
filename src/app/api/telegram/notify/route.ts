import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types';
import { products as defaultProducts } from '@/lib/mockData';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveProductSku(prod: any): string {
  if (!prod) return '';
  if (prod.sku) return String(prod.sku);
  if (prod.nutrition?.sku) return String(prod.nutrition.sku);

  const matched = defaultProducts.find(
    (p) =>
      (prod.id && p.id === prod.id) ||
      (typeof prod.name === 'object' &&
        ((prod.name.pl && p.name.pl === prod.name.pl) ||
          (prod.name.uk && p.name.uk === prod.name.uk))) ||
      (typeof prod.name === 'string' &&
        (p.name.pl === prod.name || p.name.uk === prod.name))
  );

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

  // Список позицій (назва польською без дублювання + код терміналу #SKU як у чеку адмінки)
  const itemLines = (order.items || []).map((item, idx) => {
    const prod: any = item.product || {};
    const prodName =
      typeof prod.name === 'object'
        ? prod.name.pl || prod.name.uk || 'Pozycja'
        : String(prod.name || 'Pozycja');

    const sku = resolveProductSku(prod);
    const skuBadge = sku ? ` <b>[#${escapeHtml(sku)}]</b>` : '';

    const optBakedP = prod.bakedPrice ?? prod.nutrition?.bakedPrice ?? 1;
    const optTempuraP = prod.tempuraPrice ?? prod.nutrition?.tempuraPrice ?? 2;

    const badges: string[] = [];
    if (item.selectedOptions?.baked) badges.push(`🔥 Печена риба (+${optBakedP} zł)`);
    if (item.selectedOptions?.tempura) badges.push(`🍤 У темпурі (+${optTempuraP} zł)`);
    if (item.isGift) badges.push('🎁 ПОДАРУНОК (0 zł)');

    const extraPrice =
      (item.selectedOptions?.baked ? Number(optBakedP) : 0) +
      (item.selectedOptions?.tempura ? Number(optTempuraP) : 0);
    const unitPrice = item.isGift ? 0 : Number(prod.price || 0) + extraPrice;
    const lineTotal = unitPrice * item.quantity;

    const badgeStr = badges.length > 0 ? `\n   ➔ <i>${badges.join(', ')}</i>` : '';
    return `${idx + 1}. <b>${item.quantity}×</b> ${escapeHtml(prodName)}${skuBadge} — <b>${lineTotal} zł</b>${badgeStr}`;
  });

  // Додаткові рядки суми
  const summaryExtras: string[] = [];
  if (!isPickup) {
    summaryExtras.push(
      `🚚 Доставка: <b>${order.deliveryFee && order.deliveryFee > 0 ? `${order.deliveryFee} zł` : 'Безкоштовно (0 zł)'}</b>`
    );
  }
  if (order.firstOrderDiscount && order.firstOrderDiscount > 0) {
    summaryExtras.push(`🎉 Вітальна знижка (-10%): <b>-${order.firstOrderDiscount} zł</b>`);
  }

  // Очищуємо коментар від службових тегів, якщо вони вже виведені вище
  const cleanComment = (order.comment || '')
    .replace(/\[НА ЗАВТРА[^\]]*\]/gi, '')
    .replace(/\[НА ЧАС[^\]]*\]/gi, '')
    .trim();

  const lines = [
    `🍣 <b>НОВЕ ЗАМОВЛЕННЯ #${escapeHtml(order.id)}</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `👤 <b>Клієнт:</b> ${escapeHtml(order.name || 'Гість')}`,
    `📞 <b>Телефон:</b> <a href="tel:${escapeHtml(phoneFormatted)}">${escapeHtml(phoneFormatted)}</a>`,
    deliveryHeader,
    addressBlock ? addressBlock.trimEnd() : null,
    timingText,
    `🥢 <b>Палички (персон):</b> ${order.personsCount || 1}`,
    cleanComment ? `💬 <b>Коментар:</b> <i>${escapeHtml(cleanComment)}</i>` : null,
    `━━━━━━━━━━━━━━━━━━`,
    `🍱 <b>СКЛАД ЗАМОВЛЕННЯ:</b>`,
    ...itemLines,
    `━━━━━━━━━━━━━━━━━━`,
    ...summaryExtras,
    `💳 <b>Оплата:</b> ${paymentLabel}`,
    `💰 <b>РАЗОМ ДО СПЛАТИ: ${order.total} zł</b>`,
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
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' },
        { status: 200 }
      );
    }

    const body = await req.json();
    const order: Order | undefined = body?.order;
    if (!order || !order.id) {
      return NextResponse.json({ ok: false, error: 'Invalid order payload' }, { status: 400 });
    }

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
