/**
 * Утиліти маскування, санітизації та валідації полів вводу клієнта
 * (Захист від некоректних символів, емодзі, надмірної довжини тощо)
 */

/**
 * Маска для імені клієнта:
 * - Дозволено: літери (латиниця, польські ą,ć,ę,ł,ń,ó,ś,ź,ż, кирилиця), пробіл, дефіс, апостроф.
 * - Заборонено: цифри, дужки, емодзі, знаки @, &, *, ;, /, тощо.
 * - Максимальна довжина: 40 символів.
 */
export function maskName(val: string): string {
  if (!val) return '';
  // Видаляємо всі символи, які не є літерами, пробілами, дефісами або апострофами
  const cleaned = val.replace(/[^\p{L}\s'-]/gu, '');
  // Прибираємо дефіс/апостроф/пробіл на самому початку
  const trimmedStart = cleaned.replace(/^[\s'-]+/, '');
  // Замінюємо множинні пробіли на один
  const singleSpaced = trimmedStart.replace(/\s{2,}/g, ' ');
  return singleSpaced.slice(0, 40);
}

/**
 * Очищення та форматування номера телефону:
 * - Максимум 9 цифр (польський стандарт мобільних та міських номерів).
 * - Автоматично прибирає +48 або 48 на початку при вставці, якщо номер довгий.
 * - Форматує на льоту у зручний вигляд: XXX XXX XXX (напр. 500 123 456).
 */
export function maskPhone(val: string): string {
  if (!val) return '';
  // Залишаємо виключно цифри
  let digits = val.replace(/\D/g, '');

  // Якщо вставили номер з кодом країни Польщі (+48) і цифр більше 9
  if (digits.length > 9 && digits.startsWith('48')) {
    digits = digits.slice(2);
  }
  // Якщо вставили з кодом України (+380) і цифр більше 9
  if (digits.length > 9 && digits.startsWith('380')) {
    digits = digits.slice(3);
  }

  // Обмежуємо строго 9 цифрами
  digits = digits.slice(0, 9);

  // Форматуємо як XXX XXX XXX
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Повертає чисті 9 цифр номера телефону (без пробілів)
 */
export function getRawPhoneDigits(val: string): string {
  return val.replace(/\D/g, '').slice(0, 9);
}

/**
 * Маска для назви вулиці:
 * - Дозволено: літери, цифри (напр. 3 Maja), пробіли, крапки (напр. gen., św.), дефіси.
 * - Заборонено: спецсимволи @, &, (), *, emojis тощо.
 * - Максимальна довжина: 50 символів.
 */
export function maskStreet(val: string): string {
  if (!val) return '';
  const cleaned = val.replace(/[^\p{L}\d\s.\-]/gu, '');
  const trimmedStart = cleaned.replace(/^[\s.\-]+/, '');
  const singleSpaced = trimmedStart.replace(/\s{2,}/g, ' ');
  return singleSpaced.slice(0, 50);
}

/**
 * Маска для номера будинку:
 * - Дозволено: цифри, літери корпусу (A, B, C...), слеш / або дефіс (напр. 8, 8A, 12/4, 15-B).
 * - Заборонено: символи &, @, emojis, крапки з комою, пробіли тощо.
 * - Максимальна довжина: 10 символів.
 */
export function maskHouse(val: string): string {
  if (!val) return '';
  const cleaned = val.replace(/[^\p{L}\d/\-]/gu, '');
  return cleaned.slice(0, 10);
}

/**
 * Маска для номера квартири / офісу:
 * - Дозволено: цифри, опціональна літера корпусу, слеш / або дефіс (напр. 14, 2B).
 * - Заборонено: крапки з комою (;), emojis, дужки тощо.
 * - Максимальна довжина: 8 символів.
 */
export function maskApartment(val: string): string {
  if (!val) return '';
  const cleaned = val.replace(/[^\p{L}\d/\-]/gu, '');
  return cleaned.slice(0, 8);
}

/**
 * Маска для поверху:
 * - Дозволено: цифри, мінус (-1), літери (parter, p).
 * - Заборонено: emojis (🥺), символи, слеші.
 * - Максимальна довжина: 6 символів.
 */
export function maskFloor(val: string): string {
  if (!val) return '';
  const cleaned = val.replace(/[^\p{L}\d\-]/gu, '');
  return cleaned.slice(0, 6);
}

/**
 * Маска для коду домофону:
 * - Дозволено: цифри, #, *, літери (напр. K1234, 14#, *1234).
 * - Заборонено: слеші (////), emojis, пробіли.
 * - Максимальна довжина: 8 символів.
 */
export function maskEntryCode(val: string): string {
  if (!val) return '';
  const cleaned = val.replace(/[^\d#*Kk\p{L}]/gu, '');
  return cleaned.slice(0, 8);
}

/**
 * Маска для решти з купюри:
 * - Лише цифри. Максимум 5 символів.
 */
export function maskChangeFrom(val: string): string {
  if (!val) return '';
  return val.replace(/\D/g, '').slice(0, 5);
}
