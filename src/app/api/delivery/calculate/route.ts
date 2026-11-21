import { NextResponse } from 'next/server';
import { fetchStoreSettings } from '@/lib/supabase';

// Точні координати Maks Sushi: ul. Parkowa 8, 58-100 Świdnica
const RESTAURANT_COORDS = { lat: 50.8433, lon: 16.4882 };
const TOWN_RADIUS_KM = 4.5; // Орієнтовний радіус меж міста Свідниця від закладу
const MAX_DELIVERY_KM = 10;  // Максимальний радіус кур'єрської доставки ресторану

function normalizeKey(str: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');
}

// Точні координати центрів населених пунктів Свідницького повіту та прилеглих міст (швидкий та надійний фолбек)
const TOWN_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'swidnica': { lat: 50.8433, lon: 16.4882 },
  'pszenno': { lat: 50.8524, lon: 16.5458 },
  'witoszow dolny': { lat: 50.8258, lon: 16.4367 },
  'witoszow gorny': { lat: 50.8122, lon: 16.4189 },
  'bystrzyca dolna': { lat: 50.8167, lon: 16.4950 },
  'bystrzyca gorna': { lat: 50.7789, lon: 16.4678 },
  'bojanice': { lat: 50.7686, lon: 16.4897 },
  'burkatow': { lat: 50.7978, lon: 16.4889 },
  'bolescin': { lat: 50.8189, lon: 16.5567 },
  'grodziszcze': { lat: 50.7933, lon: 16.5833 },
  'krzczonow': { lat: 50.8033, lon: 16.6033 },
  'krzyzowa': { lat: 50.7967, lon: 16.5367 },
  'lubachow': { lat: 50.7667, lon: 16.4500 },
  'lutomia dolna': { lat: 50.7678, lon: 16.5511 },
  'lutomia gorna': { lat: 50.7511, lon: 16.5389 },
  'lutomia mala': { lat: 50.7611, lon: 16.5450 },
  'makowice': { lat: 50.8033, lon: 16.5422 },
  'milochow': { lat: 50.8667, lon: 16.5167 },
  'modliszow': { lat: 50.7911, lon: 16.3889 },
  'mokrzeszow': { lat: 50.8344, lon: 16.3667 },
  'niegoszow': { lat: 50.8711, lon: 16.5422 },
  'opoczka': { lat: 50.8089, lon: 16.5689 },
  'pankow': { lat: 50.8789, lon: 16.5311 },
  'pogorzala': { lat: 50.8111, lon: 16.3889 },
  'radziechow': { lat: 50.8789, lon: 16.4889 },
  'slotwina': { lat: 50.8356, lon: 16.4422 },
  'stachowice': { lat: 50.8389, lon: 16.5789 },
  'stachowiczki': { lat: 50.8344, lon: 16.5889 },
  'sulislawice': { lat: 50.8411, lon: 16.5889 },
  'wieruszow': { lat: 50.8222, lon: 16.5889 },
  'wilkow': { lat: 50.8611, lon: 16.5889 },
  'wisniowa': { lat: 50.8389, lon: 16.5222 },
  'zawiszow': { lat: 50.8644, lon: 16.4789 },
  'komorow': { lat: 50.8322, lon: 16.4589 },
  'gogolow': { lat: 50.8489, lon: 16.6222 },
  'jakubow': { lat: 50.8578, lon: 16.5789 },
  'bagieniec': { lat: 50.8922, lon: 16.4689 },
  'boleslawice': { lat: 50.8789, lon: 16.4422 },
  'czechy': { lat: 50.8956, lon: 16.4222 },
  'milikowice': { lat: 50.8856, lon: 16.3889 },
  'nowice': { lat: 50.9156, lon: 16.4589 },
  'nowy jaworow': { lat: 50.9056, lon: 16.4389 },
  'pasieczna': { lat: 50.9022, lon: 16.4689 },
  'pastuchow': { lat: 50.9322, lon: 16.4389 },
  'piotrowek': { lat: 50.9189, lon: 16.4222 },
  'stary jaworow': { lat: 50.8989, lon: 16.4456 },
  'tomkowa': { lat: 50.8856, lon: 16.4656 },
  'witkow': { lat: 50.8722, lon: 16.3989 },
  'swiebodzice': { lat: 50.8600, lon: 16.3200 },
  'jaworzyna slaska': { lat: 50.9100, lon: 16.4300 },
  'zarow': { lat: 50.9400, lon: 16.4900 },
  'strzegom': { lat: 50.9600, lon: 16.3500 },
  'marcinowice': { lat: 50.8456, lon: 16.6500 },
  'dobromierz': { lat: 50.9100, lon: 16.2400 },
  'stanowice': { lat: 50.9250, lon: 16.3750 },
  'dzierzoniow': { lat: 50.7300, lon: 16.6500 },
  'walbrzych': { lat: 50.7714, lon: 16.2843 },
};

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c * 1.3).toFixed(1)); // 1.3 реальний коефіцієнт звивистості автодоріг
}

async function getOsrmDrivingDistanceKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): Promise<number> {
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
    const routeRes = await fetch(osrmUrl, {
      signal: AbortSignal.timeout(3500),
    });

    if (routeRes.ok) {
      const routeData = await routeRes.json();
      if (routeData.routes && routeData.routes.length > 0) {
        const meters = routeData.routes[0].distance;
        return Number((meters / 1000).toFixed(1));
      }
    }
  } catch (e) {
    console.warn('OSRM routing timeout or error:', e);
  }
  return haversineDistanceKm(from.lat, from.lon, to.lat, to.lon);
}

async function runGeocode(parts: string[]): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const query = encodeURIComponent(parts.filter(Boolean).join(', '));
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=pl`;
  try {
    const geoRes = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MaksSushiDeliveryCalc/2.0 (contact@maks-sushi.pl)',
        'Accept-Language': 'pl,uk,en',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (Array.isArray(geoData) && geoData.length > 0) {
        return {
          lat: parseFloat(geoData[0].lat),
          lon: parseFloat(geoData[0].lon),
          displayName: String(geoData[0].display_name || ''),
        };
      }
    }
  } catch (e) {
    console.warn('Nominatim geocode timeout or error:', e);
  }
  return null;
}

export async function POST(req: Request) {
  let fallbackSuburbBasePrice = 9;
  try {
    const body = await req.json().catch(() => ({}));
    const { street, house, city, address, zoneIsSuburb, baseSuburbFee, cityFee, cityFreeThreshold } = body;

    // Отримуємо актуальні тарифи доставки з переданих параметрів та безпосередньо з Supabase
    const clientSuburbPrice = typeof baseSuburbFee === 'number' && baseSuburbFee >= 0 ? baseSuburbFee : null;
    const clientCityPrice = typeof cityFee === 'number' && cityFee >= 0 ? cityFee : null;
    const clientFreeThreshold = typeof cityFreeThreshold === 'number' && cityFreeThreshold >= 0 ? cityFreeThreshold : null;

    let dbSuburbPrice: number | null = null;
    let dbCityPrice: number | null = null;
    let dbFreeThreshold: number | null = null;

    try {
      const storeSettings = await fetchStoreSettings();
      if (storeSettings) {
        if (typeof storeSettings.suburb10kmFee === 'number') {
          dbSuburbPrice = storeSettings.suburb10kmFee;
        }
        if (typeof storeSettings.cityStandardFee === 'number') {
          dbCityPrice = storeSettings.cityStandardFee;
        }
        if (typeof storeSettings.cityFreeThreshold === 'number') {
          dbFreeThreshold = storeSettings.cityFreeThreshold;
        }
      }
    } catch (e) {
      console.warn('Failed to load store settings in delivery calculate route:', e);
    }

    // Якщо клієнт ще не встиг гідруватися і передав дефолтні 9 zł, а в БД вже стоїть інша ціна — беремо з БД.
    // Якщо клієнт передав оновлену ціну (відмінну від дефолтних 9 zł) — беремо її.
    const finalSuburbBasePrice =
      clientSuburbPrice !== null && clientSuburbPrice !== 9
        ? clientSuburbPrice
        : (dbSuburbPrice ?? clientSuburbPrice ?? 9);
    fallbackSuburbBasePrice = finalSuburbBasePrice;

    const finalCityStandardPrice =
      clientCityPrice !== null && clientCityPrice !== 5
        ? clientCityPrice
        : (dbCityPrice ?? clientCityPrice ?? 5);

    const finalFreeThreshold =
      clientFreeThreshold !== null && clientFreeThreshold !== 150
        ? clientFreeThreshold
        : (dbFreeThreshold ?? clientFreeThreshold ?? 150);

    const rawCity = (city || '').trim();
    const cityNorm = normalizeKey(rawCity);
    const fullStreet = (street || address || '').trim();
    const fullHouse = (house || '').trim();

    // Перевіряємо, чи це Свідниця
    const isSwidnica =
      !rawCity ||
      cityNorm === 'swidnica' ||
      cityNorm === 'm. swidnica' ||
      cityNorm === 'miasto swidnica';

    if (isSwidnica && !zoneIsSuburb) {
      return NextResponse.json({
        distanceKm: 0,
        deliveryPrice: finalCityStandardPrice,
        isOutTown: false,
        isOutOfRange: false,
        maxDeliveryKm: MAX_DELIVERY_KM,
        precisionLevel: 'city',
        cityName: 'Świdnica',
        message: `Стандартна доставка по Свідниці (${finalCityStandardPrice} zł, від ${finalFreeThreshold} zł безкоштовно)`,
      });
    }

    // 1. КРОК 1: Знаходимо координати центру населеного пункту (села / містечка повіту)
    let cityCoords: { lat: number; lon: number } | null = null;
    let cityDisplayName = `${rawCity}, powiat świdnicki`;

    if (TOWN_COORDINATES[cityNorm]) {
      cityCoords = TOWN_COORDINATES[cityNorm];
    } else {
      // Шукаємо в Nominatim по повіту або воєводству
      let geoCity = await runGeocode([rawCity, 'powiat świdnicki', 'Dolnośląskie', 'Polska']);
      if (!geoCity) {
        geoCity = await runGeocode([rawCity, 'Dolnośląskie', 'Polska']);
      }
      if (geoCity) {
        cityCoords = { lat: geoCity.lat, lon: geoCity.lon };
        cityDisplayName = geoCity.displayName;
      }
    }

    // Якщо населений пункт не знайдено ні в базі, ні через Nominatim — кур'єрська доставка блокується (тільки самовивіз)
    if (!cityCoords) {
      return NextResponse.json({
        distanceKm: null,
        deliveryPrice: 0,
        isOutTown: true,
        isOutOfRange: true,
        cityNotFound: true,
        precisionLevel: 'city',
        cityName: rawCity,
        message: 'Не вдалося знайти вказаний населений пункт на карті. Доставка курʼєром неможлива, доступний лише самовивіз.',
      });
    }

    // Розраховуємо відстань та вартість доставки ДО ЦЕНТРУ знайденого населеного пункту
    const centerDistanceKm = await getOsrmDrivingDistanceKm(RESTAURANT_COORDS, cityCoords);
    const centerExtraKm = Math.max(0, Math.ceil(centerDistanceKm - TOWN_RADIUS_KM));
    const centerDeliveryPrice = finalSuburbBasePrice + centerExtraKm * 1;
    const centerIsOutOfRange = centerDistanceKm > MAX_DELIVERY_KM;

    // 2. КРОК 2: Якщо вказано вулицю або будинок — пробуємо знайти точну адресу на карті цього села
    if (fullStreet || fullHouse) {
      const streetPart = fullHouse ? `${fullStreet} ${fullHouse}` : fullStreet;
      let exactGeo = await runGeocode([streetPart, rawCity, 'powiat świdnicki', 'Dolnośląskie', 'Polska']);
      if (!exactGeo) {
        exactGeo = await runGeocode([streetPart, rawCity, 'Dolnośląskie', 'Polska']);
      }

      if (exactGeo) {
        // Точну адресу знайдено на карті — рахуємо відстань до конкретного будинку / вулиці
        const exactDistanceKm = await getOsrmDrivingDistanceKm(RESTAURANT_COORDS, {
          lat: exactGeo.lat,
          lon: exactGeo.lon,
        });
        const exactExtraKm = Math.max(0, Math.ceil(exactDistanceKm - TOWN_RADIUS_KM));
        const exactDeliveryPrice = finalSuburbBasePrice + exactExtraKm * 1;
        const isOutOfRange = exactDistanceKm > MAX_DELIVERY_KM;

        return NextResponse.json({
          distanceKm: exactDistanceKm,
          deliveryPrice: exactDeliveryPrice,
          isOutTown: true,
          isOutOfRange,
          maxDeliveryKm: MAX_DELIVERY_KM,
          precisionLevel: fullHouse ? 'house' : 'street',
          cityName: rawCity,
          streetName: fullStreet || undefined,
          houseNumber: fullHouse || undefined,
          formattedAddress: exactGeo.displayName,
          isFallback: false,
        });
      }

      // ОСНОВНЕ ПРАВИЛО: Якщо апішка НЕ знаходить вказану вулицю/будинок на карті села —
      // беремо в ціну розраховану відстань ДО ЦЕНТРУ цього населеного пункту (замість базових 9 zł)!
      return NextResponse.json({
        distanceKm: centerDistanceKm,
        deliveryPrice: centerDeliveryPrice,
        isOutTown: true,
        isOutOfRange: centerIsOutOfRange,
        maxDeliveryKm: MAX_DELIVERY_KM,
        precisionLevel: 'city',
        streetNotFoundOnMap: true,
        cityName: rawCity,
        streetName: fullStreet || undefined,
        houseNumber: fullHouse || undefined,
        formattedAddress: cityDisplayName,
        isFallback: false,
        message: 'Вулицю не знайдено на карті села. Вартість доставки розраховано до центру населеного пункту.',
      });
    }

    // Якщо вулицю ще не вказано — повертаємо розрахунок до центру
    return NextResponse.json({
      distanceKm: centerDistanceKm,
      deliveryPrice: centerDeliveryPrice,
      isOutTown: true,
      isOutOfRange: centerIsOutOfRange,
      maxDeliveryKm: MAX_DELIVERY_KM,
      precisionLevel: 'city',
      cityName: rawCity,
      formattedAddress: cityDisplayName,
      isFallback: false,
    });
  } catch (error: unknown) {
    console.error('Delivery calculation API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Помилка прорахунку';
    return NextResponse.json({
      distanceKm: 5.0,
      deliveryPrice: fallbackSuburbBasePrice,
      isOutTown: true,
      isOutOfRange: false,
      precisionLevel: 'city',
      isFallback: true,
      error: errorMessage,
    });
  }
}
