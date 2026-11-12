'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Printer, 
  Sliders, 
  Check, 
  FileText, 
  Loader2, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { AdminOrder } from '@/app/admin/page';
import { Product } from '@/types';
import { products as defaultProducts } from '@/lib/mockData';

interface ReceiptSettings {
  widthMm: number;
  paddingMm: number;
  fontSizePx: number;
}

const DEFAULT_SETTINGS: ReceiptSettings = {
  widthMm: 58, // За замовчуванням 58 мм для сумісності з мобільними принтерами
  paddingMm: 2,
  fontSizePx: 12,
};

interface ReceiptPreviewModalProps {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
}

export function ReceiptPreviewModal({
  order,
  isOpen,
  onClose,
  products = [],
}: ReceiptPreviewModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Завантаження збережених налаштувань ширини з localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('max-sushi-receipt-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({
            widthMm: Number(parsed.widthMm) || DEFAULT_SETTINGS.widthMm,
            paddingMm: typeof parsed.paddingMm === 'number' ? Number(parsed.paddingMm) : DEFAULT_SETTINGS.paddingMm,
            fontSizePx: Number(parsed.fontSizePx) || DEFAULT_SETTINGS.fontSizePx,
          });
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const isPickup = order.delivery_method === 'pickup' || order.deliveryMethod === 'pickup';
  const scheduled = order.scheduled_time || order.scheduledTime;
  const isScheduled = (order.timing_type === 'scheduled' || order.timingType === 'scheduled') && Boolean(scheduled);
  
  const formatScheduledBadgeTime = () => {
    if (!scheduled) return '';
    const timeMatch = scheduled.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return scheduled;
    const timeStr = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(2, '0')}`;
    const isTomorrow =
      order.scheduled_date === 'tomorrow' ||
      order.scheduledDate === 'tomorrow' ||
      /завтра|jutro|tomorrow/i.test(scheduled);

    const targetDate = new Date(order.created_at);
    if (isNaN(targetDate.getTime())) return scheduled;
    if (isTomorrow) targetDate.setDate(targetDate.getDate() + 1);

    const dateStr = `${targetDate.getDate()}.${targetDate.getMonth() + 1}`;
    return `${dateStr}, ${timeStr}`;
  };

  const timingBadge = isScheduled ? `NA GODZINĘ: ${formatScheduledBadgeTime()}` : 'JAK NAJSZYBCIEJ';

  const addressStr = order.address
    ? `${order.address.city && order.address.zone !== 'city' ? `${order.address.city}, ` : ''}ul. ${order.address.street || ''} ${order.address.house || ''}${order.address.apartment ? `, lok. ${order.address.apartment}` : ''}${order.address.floor ? `, piętro ${order.address.floor}` : ''}${order.address.entryCode ? `, kod: ${order.address.entryCode}` : ''}`
    : 'Brak adresu';

  const zoneStr = order.address?.city
    ? order.address.city
    : (order.address?.zone === 'city' ? 'Świdnica' : '');

  const formatReceiptDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Збереження обраної ширини як замовчування
  const handleSaveSettings = () => {
    try {
      localStorage.setItem('max-sushi-receipt-settings', JSON.stringify(settings));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {}
  };

  // Генерація PDF файлу (Blob)
  const generatePdfBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    if (!receiptRef.current) return null;
    setIsGeneratingPdf(true);
    setStatusMessage('Формування PDF...');

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const el = receiptRef.current;
      
      // Створюємо canvas високої чіткості для чіткого друку
      const canvas = await html2canvas(el, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidthMm = settings.widthMm;
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [imgWidthMm, Math.max(50, imgHeightMm + 2)],
      });

      pdf.addImage(imgData, 'PNG', 0, 1, imgWidthMm, imgHeightMm);
      const blob = pdf.output('blob');
      const filename = `Paragon-MS-${order.id}.pdf`;

      return { blob, filename };
    } catch (e: any) {
      console.error('PDF generation error:', e);
      alert('Помилка при формуванні PDF: ' + (e?.message || 'невідома помилка'));
      return null;
    } finally {
      setIsGeneratingPdf(false);
      setStatusMessage(null);
    }
  };

  // 1. Поділитися / надіслати в додаток на телефоні
  const handleShareToApp = async () => {
    const res = await generatePdfBlob();
    if (!res) return;

    const { blob, filename } = res;
    const file = new File([blob], filename, { type: 'application/pdf' });

    // Перевіряємо підтримку Web Share API для передачі файлів
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Paragon #${order.id} - Maks Sushi`,
          text: `Чек замовлення #${order.id}`,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // Користувач просто закрив діалог
        console.warn('Share error, fallback to download:', err);
      }
    }

    // Якщо пристрій не підтримує navigator.share з файлами (наприклад ПК або старий браузер) — завантажуємо або відкриваємо
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // 2. Пряме завантаження PDF
  const handleDownloadPdf = async () => {
    const res = await generatePdfBlob();
    if (!res) return;

    const { blob, filename } = res;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // 3. Звичайний швидкий друк у браузері з цією точною шириною
  const handleDirectPrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      alert('Zezwól na wyskakujące okienka w przeglądarce, aby wydrukować paragon.');
      return;
    }

    const contentHtml = receiptRef.current.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Paragon #${order.id} - Maks Sushi</title>
          <style>
            @page {
              size: ${settings.widthMm}mm auto;
              margin: 0;
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              width: ${settings.widthMm}mm;
              margin: 0 auto;
              padding: 2mm ${settings.paddingMm}mm;
              color: #000;
              background: #fff;
              font-size: ${settings.fontSizePx}px;
              line-height: 1.35;
            }
            @media print {
              body { width: 100%; margin: 0; padding: 1mm ${settings.paddingMm}mm; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 700);
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка модалки */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#12121c]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider truncate">
                Чек замовлення #{order.id}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                PDF для додатку друку та налаштування ширини стрічки
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тіло модалки: Регулятори зліва/зверху + Превʼю чеку по центру */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Панель налаштувань ширини (5 колонок на десктопі) */}
          <div className="lg:col-span-5 space-y-4 bg-[#141420] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Налаштування друку під принтер
              </span>
            </div>

            {/* Швидкі пресети */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
                Готові пресети стрічки:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '50 мм', width: 50, note: 'Компакт' },
                  { label: '58 мм', width: 58, note: 'Вузький' },
                  { label: '80 мм', width: 80, note: 'Широкий' },
                ].map((p) => {
                  const isActive = settings.widthMm === p.width;
                  return (
                    <button
                      key={p.width}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, widthMm: p.width }))}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-sm'
                          : 'bg-[#1b1b2a] border-white/5 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-black">{p.label}</div>
                      <div className="text-[9.5px] text-zinc-400">{p.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Повзунок ширини */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Ширина стрічки:</span>
                <span className="font-mono font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {settings.widthMm} мм
                </span>
              </div>
              <input
                type="range"
                min="45"
                max="80"
                step="1"
                value={settings.widthMm}
                onChange={(e) => setSettings((s) => ({ ...s, widthMm: Number(e.target.value) }))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>45 мм</span>
                <span>58 мм</span>
                <span>80 мм</span>
              </div>
            </div>

            {/* Повзунок бічних відступів (полів) */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Бічні поля (відступи):</span>
                <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {settings.paddingMm} мм
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={settings.paddingMm}
                onChange={(e) => setSettings((s) => ({ ...s, paddingMm: Number(e.target.value) }))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-[10px] text-zinc-400 leading-tight">
                Якщо принтер все ще зрізає 1-2 літери скраю — збільшіть відступ або зменшіть ширину на 2-4 мм.
              </p>
            </div>

            {/* Повзунок розміру шрифту */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Розмір шрифту:</span>
                <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {settings.fontSizePx} px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="14"
                step="1"
                value={settings.fontSizePx}
                onChange={(e) => setSettings((s) => ({ ...s, fontSizePx: Number(e.target.value) }))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Кнопка збереження за замовчуванням */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className={`w-full py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 active:scale-98'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Збережено як замовчування!' : 'Запамʼятати цей розмір'}</span>
              </button>
            </div>
          </div>

          {/* Превʼю чеку (7 колонок на десктопі) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-2 text-xs text-zinc-400 px-1">
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                Живе превʼю: ширина <strong>{settings.widthMm} мм</strong>
              </span>
              <span className="text-[11px] text-zinc-500">
                (масштабовано під екран)
              </span>
            </div>

            {/* Паперовий чек */}
            <div 
              className="bg-white text-black shadow-2xl rounded-sm transition-all duration-150 overflow-hidden select-text border border-zinc-300 max-w-full"
              style={{
                width: `${settings.widthMm}mm`,
                minWidth: '220px',
                padding: `4mm ${settings.paddingMm}mm`,
                fontSize: `${settings.fontSizePx}px`,
                lineHeight: 1.35,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              }}
              ref={receiptRef}
            >
              {/* Шапка чеку */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>MAKS SUSHI</div>
                <div style={{ fontSize: '17px', fontWeight: 900, margin: '3px 0 2px 0' }}>#{order.id}</div>
                <div style={{ fontSize: '10.5px', color: '#444' }}>{formatReceiptDate(order.created_at)}</div>
              </div>

              {/* Плашка часу */}
              <div 
                style={{
                  background: '#000',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 900,
                  padding: '5px',
                  margin: '6px 0',
                  textAlign: 'center',
                  borderRadius: '3px',
                  letterSpacing: '0.5px'
                }}
              >
                ${timingBadge}
              </div>

              {/* Інформація про замовлення */}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontSize: '11.5px' }}>
                <span style={{ fontWeight: 'bold' }}>Sposób:</span>
                <span style={{ fontWeight: 'bold' }}>{isPickup ? 'ODBIÓR OSOBISTY' : 'DOSTAWA KURIEREM'}</span>
              </div>
              {!isPickup && (
                <div style={{ fontSize: '11px', margin: '3px 0 5px 0' }}>
                  <strong>Adres:</strong> {addressStr}
                </div>
              )}
              {(!isPickup && zoneStr) && (
                <div style={{ fontSize: '10.5px', margin: '-2px 0 5px 0', fontWeight: 'bold', color: '#222' }}>
                  📍 Strefa: {zoneStr}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '11px' }}>
                <span>Klient:</span>
                <span style={{ fontWeight: 'bold' }}>{order.customer_name || order.name || 'Klient'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '11px' }}>
                <span>Telefon:</span>
                <span style={{ fontWeight: 'bold' }}>{order.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '11px' }}>
                <span>Liczba osób / pałeczek:</span>
                <span style={{ fontWeight: 'bold' }}>{order.personsCount || 1} szt.</span>
              </div>

              {/* Коментар / Uwagi */}
              {order.comment && (
                <div style={{ border: '2px solid #000', padding: '4px 6px', margin: '6px 0', fontSize: '11px', borderRadius: '3px' }}>
                  <strong style={{ textTransform: 'uppercase' }}>Uwagi:</strong> {order.comment}
                </div>
              )}

              <div style={{ borderTop: '1px dashed #000', margin: '7px 0' }}></div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>
                POZYCJE ({order.items.reduce((s, i) => s + (i.quantity || 1), 0)} szt.):
              </div>

              {/* Таблиця страв */}
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0' }}>
                <tbody>
                  {order.items.map((item, idx) => {
                    const prod = item.product || {};
                    const title = typeof prod.name === 'object' ? (prod.name.pl || prod.name.uk || 'Pozycja') : (prod.name || 'Pozycja');
                    const price = Number(prod.price || 0);

                    const matchedProduct = products.find(
                      (p) =>
                        (prod.id && p.id === prod.id) ||
                        (typeof prod.name === 'object' && ((prod.name.pl && p.name.pl === prod.name.pl) || (prod.name.uk && p.name.uk === prod.name.uk))) ||
                        (typeof prod.name === 'string' && (p.name.pl === prod.name || p.name.uk === prod.name))
                    );
                    const defaultMatched = (defaultProducts as any[]).find(
                      (p: any) =>
                        (prod.id && p.id === prod.id) ||
                        (typeof prod.name === 'object' && ((prod.name.pl && p.name.pl === prod.name.pl) || (prod.name.uk && p.name.uk === prod.name.uk))) ||
                        (typeof prod.name === 'string' && (p.name.pl === prod.name || p.name.uk === prod.name))
                    );
                    const sku =
                      prod.sku ||
                      (prod as any).nutrition?.sku ||
                      matchedProduct?.sku ||
                      (matchedProduct as any)?.nutrition?.sku ||
                      defaultMatched?.sku ||
                      (defaultMatched as any)?.nutrition?.sku ||
                      '';
                    const skuText = sku ? ` ${sku}` : '';
                    const isGift = Boolean(item.isGift);
                    const opts: string[] = [];
                    const optBakedP = prod.bakedPrice ?? (prod as any).nutrition?.bakedPrice ?? 1;
                    const optTempuraP = prod.tempuraPrice ?? (prod as any).nutrition?.tempuraPrice ?? 2;
                    if (item.selectedOptions?.baked) opts.push(`PIECZONA RYBA (+${optBakedP} zł)`);
                    if (item.selectedOptions?.tempura) opts.push(`W TEMPURZE (+${optTempuraP} zł)`);
                    const displayPrice = isGift ? '0 zł' : `${price * item.quantity} zł`;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px dashed #777' }}>
                        <td style={{ padding: '4px 0', fontSize: '14px', fontWeight: 900, width: '28px', verticalAlign: 'top' }}>
                          {item.quantity}×
                        </td>
                        <td style={{ padding: '4px 3px', fontSize: '12px', fontWeight: 'bold', verticalAlign: 'top' }}>
                          <div>
                            {title}{skuText}
                            {isGift && (
                              <span style={{ fontSize: '9px', fontWeight: 900, background: '#000', color: '#fff', padding: '1px 3px', borderRadius: '2px', marginLeft: '3px' }}>
                                GRATIS
                              </span>
                            )}
                          </div>
                          {opts.length > 0 && (
                            <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#000', marginTop: '1px' }}>
                              ➔ {opts.join(', ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '4px 0', fontSize: '11.5px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {displayPrice}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Знижка якщо є */}
              {(order.firstOrderDiscount || order.first_order_discount) ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0 2px 0', fontWeight: 'bold', fontSize: '11px' }}>
                  <span>Zniżka na 1. zamówienie:</span>
                  <span>-{order.firstOrderDiscount || order.first_order_discount} zł</span>
                </div>
              ) : null}

              {/* Разом */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '15px',
                  fontWeight: 900,
                  marginTop: '5px',
                  paddingTop: '5px',
                  borderTop: '2px solid #000',
                }}
              >
                <span>RAZEM:</span>
                <span>{order.total} zł</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
                <span>Płatność:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {order.payment_method === 'cash' || order.paymentMethod === 'cash' ? 'Gotówka' : 'BLIK / Karta'}
                </span>
              </div>
              {(order.changeFrom || (order as any).change_from) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                  <span>Reszta z:</span>
                  <span style={{ fontWeight: 'bold' }}>{order.changeFrom || (order as any).change_from}</span>
                </div>
              )}

              <div style={{ borderTop: '1px dashed #000', marginTop: '8px' }}></div>
              <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '6px', color: '#555' }}>
                Maks Sushi • Smacznego!
              </div>
            </div>
          </div>
        </div>

        {/* Нижня панель дій */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-white/10 bg-[#12121c]">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            {statusMessage ? (
              <span className="text-amber-400 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {statusMessage}
              </span>
            ) : (
              <span>Ширина для PDF: <strong>{settings.widthMm} мм</strong></span>
            )}
          </div>

          <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
            {/* Кнопка 1: Поділитися / Відправити в додаток на телефоні */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleShareToApp}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Відкриває системне меню телефону для відправки в додаток друку"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>В додаток / Поділитися</span>
            </button>

            {/* Кнопка 2: Завантажити PDF */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all border border-white/10 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Зберегти файл .pdf на пристрій"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Зберегти PDF</span>
            </button>

            {/* Кнопка 3: Швидкий друк */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all border border-white/10 active:scale-95 cursor-pointer"
              title="Звичайний друк через браузер"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Друк</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

