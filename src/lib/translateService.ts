/**
 * Сервіс швидкого автоперекладу назв, описів та інгредієнтів страв з польської на українську мову
 */

// Словничок характерних кулінарних термінів суші для ідеального перекладу
const SUSHI_DICT: Record<string, string> = {
  'ŁOSOŚ': 'ЛОСОСЬ',
  'LOSOS': 'ЛОСОСЬ',
  'TUŃCZYK': 'ТУНЕЦЬ',
  'TUNCZYK': 'ТУНЕЦЬ',
  'KREWETKI': 'КРЕВЕТКИ',
  'KREWETKA': 'КРЕВЕТКА',
  'WĘGORZ': 'ВУГОР',
  'WEGORZ': 'ВУГОР',
  'OGÓREK': 'ОГІРОК',
  'OGOREK': 'ОГІРОК',
  'AWOKADO': 'АВОКАДО',
  'SER ŚMIETANKOWY': 'КРЕМ-СИР',
  'SER SMIETANKOWY': 'КРЕМ-СИР',
  'SER TOSTOWY': 'ТОСТОВИЙ СИР',
  'NORI': 'НОРІ',
  'RYŻ': 'РИС',
  'RYZ': 'РИС',
  'SEZAM': 'КУНЖУТ',
  'TYKWA GOTOWANA': 'ТИКВА ВАРЕНА',
  'RZODKIEW MARYNOWANA': 'РЕДЬКА МАРИНОВАНА',
  'RZODKIEW TAKUAN': 'РЕДЬКА ТАКУАН',
  'TEMPURA': 'ТЕМПУРА',
  'SOS UNAGI': 'СОУС УНАГІ',
  'SOS TERIYAKI': 'СОУС ТЕРІЯКІ',
  'SOS SRIRACHA': 'СОУС ШРІРАЧА',
  'SOS PONZU': 'СОУС ПОНЗУ',
  'KRABSTIKI SURIMI': 'КРАБОВІ ПАЛИЧКИ СУРІМІ',
  'KAWIOR MASAGO': 'ІКРА МАСАГО',
  'PŁATKI BONITO': 'ПЛАСТІВЦІ БОНІТО',
  'MANGO': 'МАНГО',
  'KUKURYDZA': 'КУКУРУДЗА',
  'SOJA EDAMAME': 'СОЯ ЕДАМАМЕ',
  'WAKAME': 'ВАКАМЕ',
  'TOFU': 'ТОФУ',
  'GRZYBY SHIITAKE': 'ГРИБИ ШИЇТАКЕ',
  'IMBIR': 'ІМБИР',
  'WASABI': 'ВАСАБІ',
  'SOS SOJOWY': 'СОЄВИЙ СОУС',
};

/**
 * Переклад одного текстового рядка з польської на українську
 */
export async function translateText(text: string): Promise<string> {
  if (!text || !text.trim()) return '';

  const clean = text.trim();

  // 1. Спроба через API швидкого перекладу
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pl&tl=uk&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0].map((item: any) => item[0]).join('');
        if (translated) return translated.trim();
      }
    }
  } catch (err) {
    console.warn('Online translate fallback to local dict:', err);
  }

  // 2. Fallback на словник термінів
  let result = clean;
  for (const [pl, uk] of Object.entries(SUSHI_DICT)) {
    const regex = new RegExp(`\\b${pl}\\b`, 'gi');
    result = result.replace(regex, uk);
  }

  return result;
}

/**
 * Комплексний автопереклад усієї страви з польської на українську
 */
export async function autoTranslateDish(dish: {
  namePl: string;
  descPl: string;
  ingredientsPl: string;
}): Promise<{
  nameUk: string;
  descUk: string;
  ingredientsUk: string;
}> {
  // Паралельний переклад назви та опису
  const [nameUk, descUk] = await Promise.all([
    translateText(dish.namePl),
    translateText(dish.descPl),
  ]);

  // Переклад інгредієнтів через кому
  let ingredientsUk = '';
  if (dish.ingredientsPl.trim()) {
    const items = dish.ingredientsPl.split(',').map((s) => s.trim().toUpperCase());
    const translatedItems = await Promise.all(
      items.map(async (item) => {
        if (!item) return '';
        // Перевіряємо словничок
        if (SUSHI_DICT[item]) return SUSHI_DICT[item];
        // Онлайн-переклад для рідкісних складників
        const t = await translateText(item);
        return t.toUpperCase();
      })
    );
    ingredientsUk = translatedItems.filter(Boolean).join(', ');
  }

  return {
    nameUk: nameUk || dish.namePl,
    descUk: descUk || dish.descPl,
    ingredientsUk: ingredientsUk || dish.ingredientsPl,
  };
}

