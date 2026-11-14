import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTelegramOrderMessage(order: Order): string {
  const isPickup = order.deliveryMethod === 'pickup';
  const rawPhone = (order.phone || '').replace(/\s+/g, '');
  const phoneFormatted = rawPhone.startsWith('+') ? rawPhone : `+48${rawPhone.replace(/^\+?48/, '')}`;

  const deliveryHeader = isPickup
    ? '🏪 <b>Самовивіз / Odbiór osobisty</b> (ul. Parkowa 8)'
    : '🚗 <b>Доставка / Dostawa</b>';

  let addressBlock = '';
  if (!isPickup && order.address) {
    const city = order.address.city || 'Świdnica';
    const street = order.address.street || '';
    const house = order.address.house || '';
    const apt = order.address.apartment ? `, кв./m. ${order.address.apartment}` : '';
    const floor = order.address.floor ? `, поверх/piętro ${order.address.floor}` : '';
    const code = order.address.entryCode ? ` (домофон/kod: ${order.address.entryCode})` : '';
    const fullAddr = `${city}, ul. ${street} ${house}${apt}${floor}${code}`;
    const mapsQuery = encodeURIComponent(`${city}, ${street} ${house}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    addressBlock = `📍 <b>Адреса:</b> ${escapeHtml(fullAddr)}\n🗺 <a href="${mapsUrl}">Відкрити на Google Maps</a>\n`;
  }

  // Час замовлення
  let timingText = '⚡ Якнайшвидше (ASAP)';
  if (order.timingType === 'scheduled' && order.scheduledTime) {
    const dayLabel = order.scheduledDate === 'tomorrow' ? 'ЗАВТРА / JUTRO' : 'Сьогодні / Dzisiaj';
    timingText = `🕒 <b>На час: ${escapeHtml(order.scheduledTime)} (${dayLabel})</b>`;
  }

  // Спосіб оплати
  let paymentLabel = '💵 Готівка / Gotówka';
  if (order.paymentMethod === 'blik_online' || order.paymentMethod === 'card_courier') {
    paymentLabel = '💳 BLIK / Картка (Термінал)';
  }
  if (order.changeFrom) {
    paymentLabel += ` (Решта з / Reszta z: <b>${escapeHtml(order.changeFrom)} zł</b>)`;
  }

  // Список позицій
  const itemLines = (order.items || []).map((item, idx) => {
    const prodName =
      typeof item.product?.name === 'object'
        ? `${item.product.name.pl}${item.product.name.uk && item.product.name.uk !== item.product.name.pl ? ` / ${item.product.name.uk}` : ''}`
        : String(item.product?.name || 'Позиція');

    const badges: string[] = [];
    if (item.selectedOptions?.baked) badges.push('🔥 Печений / Pieczona (+4 zł)');
    if (item.selectedOptions?.tempura) badges.push('🍤 Темпура / Tempura (+5 zł)');
    if (item.isGift) badges.push('🎁 ПОДАРУНОК / PREZENT');

    const extraPrice = (item.selectedOptions?.baked ? 4 : 0) + (item.selectedOptions?.tempura ? 5 : 0);
    const unitPrice = item.isGift ? 0 : (item.product?.price || 0) + extraPrice;
    const lineTotal = unitPrice * item.quantity;

    const badgeStr = badges.length > 0 ? `\n   <i>${badges.join(', ')}</i>` : '';
    return `${idx + 1}. <b>${item.quantity}x</b> ${escapeHtml(prodName)} — <b>${lineTotal} zł</b>${badgeStr}`;
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
    `🍣 <b>НОВЕ ЗАМОВЛЕННЯ ${escapeHtml(order.id)}</b>`,
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

async function resolveTargetChatIds(token: string): Promise<string[]> {
  const envChatIds = (process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (envChatIds.length > 0) {
    return envChatIds;
  }

  // Якщо TELEGRAM_CHAT_ID ще не заданий у .env, автоматично шукаємо активні групи/чати бота через getUpdates
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
    }
    return Array.from(discovered);
  } catch (err) {
    console.error('Telegram getUpdates discovery error:', err);
    return [];
  }
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

        // Якщо група автоматично оновилась до супергрупи (migrate_to_chat_id), повторюємо відправку на новий ID
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
