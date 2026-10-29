/**
 * Централізована конфігурація теми, бренду та кольорової палітри «Max Sushi»
 * Будь-які зміни кольорів тут одразу впливають на дизайн додатку.
 */

export const brandTheme = {
  name: 'Maks Sushi',
  logo: '/images/logo.jpg',
  slogan: {
    pl: 'Tradycja spotyka perfekcję smaku',
    uk: 'Традиція зустрічає бездоганний смак',
  },
  logoSymbol: '鮨', // Японський ієрогліф "Суші"
  
  // Кольорова палітра (Dark Asian Premium)
  colors: {
    // Основні фони
    background: '#09090b',       // Глибокий темний обсидіан
    backgroundSecondary: '#111116', // Фоновий відтінок для секцій
    surface: '#18181f',          // Поверхня карток
    surfaceHover: '#22222c',     // Стан при наведенні
    surfaceBorder: '#2e2e3a',    // Межі карток та розділювачі

    // Акцентні кольори (Червоний / Crimson)
    primary: '#e50914',          // Яскравий червоний бренд-колір
    primaryHover: '#f4222d',     // Світліший червоний при hover
    primaryDark: '#b80710',      // Темніший червоний для активних станів
    primaryGlow: 'rgba(229, 9, 20, 0.35)', // Неонове світіння червоного

    // Допоміжні кольори
    accentGold: '#eab308',       // Золотий для бейджів «Хіт» та зірок
    accentGreen: '#22c55e',      // Зелений для індикатора «Відчинено» / успіху
    accentOrange: '#f97316',     // Помаранчевий для гострого «Spicy»

    // Текстові кольори
    textPrimary: '#ffffff',      // Основний білий текст
    textSecondary: '#a1a1aa',    // Сірий текст описів (висока читабельність)
    textMuted: '#71717a',        // Приглушений сірий для дрібних підписів
  },

  // Налаштування доставки та замовлень
  delivery: {
    minOrderAmount: 40,          // Мінімальне замовлення (PLN)
    freeDeliveryThreshold: 100,  // Поріг безкоштовної доставки (PLN) з меню
    deliveryFee: 12,             // Вартість стандартної доставки (PLN)
    estimatedDeliveryTime: '30-45', // Хвилини
    estimatedPickupTime: '15-20',   // Хвилини
    pickupDiscountPercent: 5,    // Знижка на самовивіз (5%) з меню
    currency: {
      pl: 'zł',
      uk: 'грн', // або zł при замовленні в Польщі для українців
    },
  },

  // Контакти закладу
  contacts: {
    city: 'Świdnica',
    phone: '+48 791 744 048',
    phoneRaw: '791744048',
    address: 'ul. Parkowa 8, 58-100 Świdnica',
    shortAddress: 'Parkowa 8, Świdnica',
    workingHours: '12:00 - 21:00 / 22:00',
    schedule: [
      { dayPl: 'Poniedziałek', dayUk: 'Понеділок', hours: 'Zamknięte', hoursUk: 'Зачинено', isClosed: true },
      { dayPl: 'Wtorek', dayUk: 'Вівторок', hours: '12:00 – 21:00', hoursUk: '12:00 – 21:00', isClosed: false },
      { dayPl: 'Środa', dayUk: 'Середа', hours: '12:00 – 21:00', hoursUk: '12:00 – 21:00', isClosed: false },
      { dayPl: 'Czwartek', dayUk: 'Четвер', hours: '12:00 – 21:00', hoursUk: '12:00 – 21:00', isClosed: false },
      { dayPl: 'Piątek', dayUk: 'Пʼятниця', hours: '12:00 – 22:00', hoursUk: '12:00 – 22:00', isClosed: false },
      { dayPl: 'Sobota', dayUk: 'Субота', hours: '12:00 – 22:00', hoursUk: '12:00 – 22:00', isClosed: false },
      { dayPl: 'Niedziela', dayUk: 'Неділя', hours: '12:00 – 21:00', hoursUk: '12:00 – 21:00', isClosed: false },
    ],
    socials: {
      facebook: 'https://facebook.com/MaksSushiSwidnicaPL',
      facebookHandle: 'MaksSushiSwidnicaPL',
      instagram: 'https://instagram.com/makssushi_swidnica',
      instagramHandle: '@makssushi_swidnica',
    },
    isOpen: true,
  },
};

/**
 * Перевірка статусу ресторану (відчинено / зачинено зараз)
 */
export function getStoreStatus(locale: 'pl' | 'uk' = 'pl') {
  const now = new Date();
  const day = now.getDay(); // 0 = Неділя, 1 = Понеділок, ...
  const hour = now.getHours();

  // Понеділок - вихідний
  if (day === 1) {
    return {
      isOpen: false,
      text: locale === 'pl' ? 'Dzisiaj nieczynne (Poniedziałek)' : 'Сьогодні вихідний (Понеділок)',
      todayHours: locale === 'pl' ? 'Zamknięte' : 'Зачинено',
    };
  }

  // П'ятниця та субота: 12:00 - 22:00, інші дні 12:00 - 21:00
  const closingHour = (day === 5 || day === 6) ? 22 : 21;
  const isOpenNow = hour >= 12 && hour < closingHour;

  if (isOpenNow) {
    return {
      isOpen: true,
      text: locale === 'pl' ? `Otwarte teraz (do ${closingHour}:00)` : `Відчинено зараз (до ${closingHour}:00)`,
      todayHours: `12:00 – ${closingHour}:00`,
    };
  } else {
    return {
      isOpen: false,
      text: locale === 'pl' ? 'Teraz zamknięte (otwarcie o 12:00)' : 'Зараз зачинено (відкриття о 12:00)',
      todayHours: `12:00 – ${closingHour}:00`,
    };
  }
}

export type BrandTheme = typeof brandTheme;
