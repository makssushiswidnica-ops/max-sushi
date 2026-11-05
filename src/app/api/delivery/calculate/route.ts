import { NextResponse } from 'next/server';

// Точні координати Maks Sushi: ul. Parkowa 8, 58-100 Świdnica
const RESTAURANT_COORDS = { lat: 50.8433, lon: 16.4882 };
const TOWN_RADIUS_KM = 4.5; // Орієнтовний радіус меж міста Свідниця від закладу

// Точні координати центрів населених пунктів Свідницького повіту (швидкий та надійний фолбек)
const TOWN_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'świdnica': { lat: 50.8433, lon: 16.4882 },
  'swidnica': { lat: 50.8433, lon: 16.4882 },
  'pszenno': { lat: 50.8524, lon: 16.5458 },
  'witoszów dolny': { lat: 50.8258, lon: 16.4367 },
  'witoszow dolny': { lat: 50.8258, lon: 16.4367 },
  'witoszów górny': { lat: 50.8122, lon: 16.4189 },
  'witoszow gorny': { lat: 50.8122, lon: 16.4189 },
  'bystrzyca dolna': { lat: 50.8167, lon: 16.4950 },
  'bystrzyca górna': { lat: 50.7789, lon: 16.4678 },
  'bystrzyca gorna': { lat: 50.7789, lon: 16.4678 },
  'słotwina': { lat: 50.8356, lon: 16.4422 },
  'slotwina': { lat: 50.8356, lon: 16.4422 },
  'komorów': { lat: 50.8322, lon: 16.4589 },
  'komorow': { lat: 50.8322, lon: 16.4589 },
  'mokrzeszów': { lat: 50.8344, lon: 16.3667 },
  'mokrzeszow': { lat: 50.8344, lon: 16.3667 },
  'boleścin': { lat: 50.8189, lon: 16.5567 },
  'bolescin': { lat: 50.8189, lon: 16.5567 },
  'grodziszcze': { lat: 50.7933, lon: 16.5833 },
  'panków': { lat: 50.8789, lon: 16.5311 },
  'pankow': { lat: 50.8789, lon: 16.5311 },
  'zawiszów': { lat: 50.8644, lon: 16.4789 },
  'zawiszow': { lat: 50.8644, lon: 16.4789 },
  'jagodnik': { lat: 50.8444, lon: 16.5578 },
  'miłochów': { lat: 50.8667, lon: 16.5167 },
  'milochow': { lat: 50.8667, lon: 16.5167 },
  'niegoszów': { lat: 50.8711, lon: 16.5422 },
  'niegoszow': { lat: 50.8711, lon: 16.5422 },
  'lutomia dolna': { lat: 50.7678, lon: 16.5511 },
  'lutomia górna': { lat: 50.7511, lon: 16.5389 },
  'lutomia gorna': { lat: 50.7511, lon: 16.5389 },
  'burkatów': { lat: 50.7978, lon: 16.4889 },
  'burkatow': { lat: 50.7978, lon: 16.4889 },
  'makowice': { lat: 50.8033, lon: 16.5422 },
  'opoczka': { lat: 50.8089, lon: 16.5689 },
  'jakubów': { lat: 50.8578, lon: 16.5789 },
  'jakubow': { lat: 50.8578, lon: 16.5789 },
  'wilków': { lat: 50.8611, lon: 16.5889 },
  'wilkow': { lat: 50.8611, lon: 16.5889 },
  'świebodzice': { lat: 50.8600, lon: 16.3200 },
  'swiebodzice': { lat: 50.8600, lon: 16.3200 },
  'jaworzyna śląska': { lat: 50.9100, lon: 16.4300 },
  'jaworzyna slaska': { lat: 50.9100, lon: 16.4300 },
  'żarów': { lat: 50.9400, lon: 16.4900 },
  'zarow': { lat: 50.9400, lon: 16.4900 },
  'strzegom': { lat: 50.9600, lon: 16.3500 },
  'dzierżoniów': { lat: 50.7300, lon: 16.6500 },
  'dzierzoniow': { lat: 50.7300, lon: 16.6500 },
};

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c * 1.3).toFixed(1)); // 1.3 реальний коефіцієнт звивистості автодоріг
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { street, house, city, address } = body;

    const rawCity = (city || '').trim();
    const isExplicitlyOutTown =
      Boolean(rawCity) &&
      !['świdnica', 'swidnica'].includes(rawCity.toLowerCase());

    const fullStreet = (street || address || '').trim();
    const fullHouse = (house || '').trim();

    // Визначаємо рівень деталізації: будинок -> вулиця -> центр населеного пункту
    const precisionLevel: 'city' | 'street' | 'house' = fullHouse
      ? 'house'
      : fullStreet
      ? 'street'
      : 'city';

    // Якщо ні міста, ні вулиці не вказано — базова доставка по Свідниці
    if (!fullStreet && !rawCity) {
      return NextResponse.json({
        distanceKm: 0,
        deliveryPrice: 5,
        isOutTown: false,
        precisionLevel: 'city',
        cityName: 'Świdnica',
        message: 'Стандартна доставка по Свідниці (5 zł)',
      });
    }

    // 1. Формуємо пошуковий запит для геокодингу
    const addressParts: string[] = [];
    if (fullStreet) {
      addressParts.push(fullHouse ? `${fullStreet} ${fullHouse}` : fullStreet);
    }
    addressParts.push(rawCity || 'Świdnica');
    addressParts.push('powiat świdnicki');
    addressParts.push('Dolnośląskie');
    addressParts.push('Polska');

    const query = encodeURIComponent(addressParts.join(', '));
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=pl`;

    let clientLat: number | null = null;
    let clientLon: number | null = null;
    let displayName = '';

    try {
      const geoRes = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'MaksSushiDeliveryCalc/1.0 (contact@maks-sushi.pl)',
          'Accept-Language': 'pl,uk,en',
        },
        signal: AbortSignal.timeout(4000), // таймаут 4 сек
      });

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          clientLat = parseFloat(geoData[0].lat);
          clientLon = parseFloat(geoData[0].lon);
          displayName = geoData[0].display_name || '';
        }
      }
    } catch (e) {
      console.warn('Nominatim geocode timeout or error:', e);
    }

    // Якщо геокодинг нічого не дав, перевіряємо координати центру міста з нашої бази
    const cityKey = (rawCity || 'świdnica').toLowerCase();
    if (clientLat === null && TOWN_COORDINATES[cityKey]) {
      clientLat = TOWN_COORDINATES[cityKey].lat;
      clientLon = TOWN_COORDINATES[cityKey].lon;
      displayName = `${rawCity || 'Świdnica'}, powiat świdnicki`;
    }

    // 2. Якщо точка визначена — рахуємо кілометраж через OSRM
    let distanceKm: number | null = null;
    if (clientLat !== null && clientLon !== null) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_COORDS.lon},${RESTAURANT_COORDS.lat};${clientLon},${clientLat}?overview=false`;
        const routeRes = await fetch(osrmUrl, {
          signal: AbortSignal.timeout(3500),
        });

        if (routeRes.ok) {
          const routeData = await routeRes.json();
          if (routeData.routes && routeData.routes.length > 0) {
            const meters = routeData.routes[0].distance;
            distanceKm = Number((meters / 1000).toFixed(1));
          }
        }
      } catch (e) {
        console.warn('OSRM routing timeout or error:', e);
      }

      // Якщо публічний OSRM тимчасово недоступний — рахуємо надійну автодистанцію за формулою Haversine
      if (distanceKm === null) {
        distanceKm = haversineDistanceKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lon, clientLat, clientLon);
      }
    }

    // 3. Тарифікація за правилами ресторану:
    // По місту Свідниця (до 4.5 км): 5 zł (від 150 zł безкоштовно)
    // За місто: від 9 zł + 1 zł за кожен наступний км понад 4.5 км
    let isOutTown = isExplicitlyOutTown;
    if (distanceKm !== null && distanceKm > TOWN_RADIUS_KM) {
      isOutTown = true;
    }

    let deliveryPrice = 5;
    if (isOutTown) {
      if (distanceKm !== null) {
        const extraKm = Math.max(0, Math.ceil(distanceKm - TOWN_RADIUS_KM));
        deliveryPrice = 9 + extraKm * 1;
      } else {
        deliveryPrice = 9;
      }
    }

    return NextResponse.json({
      distanceKm: distanceKm ?? 5.0,
      deliveryPrice,
      isOutTown,
      precisionLevel,
      cityName: rawCity || 'Świdnica',
      streetName: fullStreet || undefined,
      houseNumber: fullHouse || undefined,
      formattedAddress: displayName || undefined,
      isFallback: distanceKm === null,
    });
  } catch (error: any) {
    return NextResponse.json({
      distanceKm: 5.0,
      deliveryPrice: 9,
      isOutTown: true,
      precisionLevel: 'city',
      isFallback: true,
      error: error?.message || 'Помилка прорахунку',
    });
  }
}

