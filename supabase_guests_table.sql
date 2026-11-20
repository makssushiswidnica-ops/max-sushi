-- ==============================================================================
-- 👥 ТАБЛИЦЯ ГОСТЕЙ (НЕЗАРЕЄСТРОВАНИХ КЛІЄНТІВ З ІСТОРІЄЮ ЗАМОВЛЕНЬ) — MAKS SUSHI
-- ==============================================================================
-- Головна мітка — мобільний номер телефону (9 цифр).
-- Якщо гість уже робив замовлення без реєстрації, а пізніше вирішить зареєструватися,
-- система звіряє його номер із цією таблицею:
--   1) Акція "-10% на перше замовлення" для нього вже недоступна.
--   2) Його адреса доставки автоматично підтягується у створений профіль.
--
-- Як виконати:
-- 1. Відкрийте Supabase -> SQL Editor -> New Query
-- 2. Вставте весь цей код та натисніть "Run" (Ctrl + Enter)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.guests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address JSONB,
  orders_count INTEGER DEFAULT 1,
  last_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Індекс для миттєвого пошуку гостя за мобільним номером
CREATE INDEX IF NOT EXISTS idx_guests_phone ON public.guests(phone);

-- Налаштування прав доступу (Row Level Security)
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read guests" ON public.guests;
CREATE POLICY "Allow public read guests"
  ON public.guests
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert guests" ON public.guests;
CREATE POLICY "Allow public insert guests"
  ON public.guests
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update guests" ON public.guests;
CREATE POLICY "Allow public update guests"
  ON public.guests
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Admin delete guests" ON public.guests;
CREATE POLICY "Admin delete guests"
  ON public.guests
  FOR DELETE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com');

-- ==============================================================================
-- 1. ДОДАВАННЯ ВСІХ ПОТОЧНИХ НЕЗАРЕЄСТРОВАНИХ ГОСТЕЙ З ТАБЛИЦІ ORDERS
-- (Перевірено: клієнт 511734897 Oleksandra вже зареєстрована в customers,
--  інші 6 клієнтів із замовлень ще не зареєстровані — додаємо їх із адресами та іменами)
-- ==============================================================================
INSERT INTO public.guests (id, phone, name, address, orders_count, last_order_id, created_at, updated_at)
VALUES
  (
    'guest_721363530',
    '721363530',
    'Viktoriia',
    '{"city": "Świdnica", "zone": "city", "floor": "1", "house": "29/1a", "street": "Ul.Długa", "apartment": "1", "entryCode": "11"}'::jsonb,
    1,
    'MS-582430',
    '2026-11-19T15:20:52.260Z',
    NOW()
  ),
  (
    'guest_731321704',
    '731321704',
    'Milana ch',
    '{"city": "Świdnica", "zone": "city", "floor": "1", "house": "24", "street": "Wałbrzyska"}'::jsonb,
    1,
    'MS-407889',
    '2026-11-19T13:28:05.736Z',
    NOW()
  ),
  (
    'guest_576470955',
    '576470955',
    'Yelizaveta Mosina',
    '{"city": "Świdnica", "zone": "city", "floor": "1", "house": "9", "street": "Zamkowa", "apartment": "7"}'::jsonb,
    1,
    'MS-859834',
    '2026-11-18T18:55:38.474Z',
    NOW()
  ),
  (
    'guest_605056180',
    '605056180',
    'Виктория Турченко',
    '{"city": "Świdnica", "zone": "city", "house": "25", "street": "ul. Saperów", "apartment": "17"}'::jsonb,
    1,
    'MS-500652',
    '2026-11-18T14:31:50.824Z',
    NOW()
  ),
  (
    'guest_722298426',
    '722298426',
    'Alina Marchenko',
    '{"city": "Świdnica", "zone": "city", "house": "9", "street": "Zamkowa"}'::jsonb,
    1,
    'MS-411826',
    '2026-11-17T13:56:10.114Z',
    NOW()
  ),
  (
    'guest_692989602',
    '692989602',
    'Анна Харченко',
    '{"city": "Świdnica", "zone": "city", "floor": "4", "house": "21", "street": "Bogusza Stęczyńskiego", "apartment": "20", "entryCode": "20"}'::jsonb,
    1,
    'MS-556541',
    '2026-11-17T10:06:33.695Z',
    NOW()
  )
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  address = COALESCE(EXCLUDED.address, public.guests.address),
  last_order_id = COALESCE(EXCLUDED.last_order_id, public.guests.last_order_id),
  updated_at = NOW();

-- ==============================================================================
-- 2. АВТОМАТИЧНА ДИНАМІЧНА СИНХРОНІЗАЦІЯ БУДЬ-ЯКИХ ІНШИХ НЕЗАРЕЄСТРОВАНИХ ГОСТЕЙ ІЗ ORDERS
-- ==============================================================================
INSERT INTO public.guests (id, phone, name, address, orders_count, last_order_id, created_at, updated_at)
SELECT
  'guest_' || sub.clean_phone AS id,
  sub.clean_phone AS phone,
  sub.customer_name AS name,
  sub.address AS address,
  sub.orders_cnt AS orders_count,
  sub.last_id AS last_order_id,
  sub.first_created AS created_at,
  NOW() AS updated_at
FROM (
  SELECT DISTINCT ON (right(regexp_replace(o.phone, '\D', '', 'g'), 9))
    right(regexp_replace(o.phone, '\D', '', 'g'), 9) AS clean_phone,
    TRIM(COALESCE(o.customer_name, 'Гість')) AS customer_name,
    o.address AS address,
    o.id AS last_id,
    o.created_at AS first_created,
    COUNT(*) OVER (PARTITION BY right(regexp_replace(o.phone, '\D', '', 'g'), 9)) AS orders_cnt
  FROM public.orders o
  WHERE o.id <> '__settings__'
    AND o.status <> 'cancelled'
    AND length(regexp_replace(COALESCE(o.phone, ''), '\D', '', 'g')) >= 9
    AND NOT EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE right(regexp_replace(COALESCE(c.phone, ''), '\D', '', 'g'), 9) = right(regexp_replace(o.phone, '\D', '', 'g'), 9)
    )
  ORDER BY right(regexp_replace(o.phone, '\D', '', 'g'), 9), (o.address IS NOT NULL) DESC, o.created_at DESC
) sub
ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  address = COALESCE(EXCLUDED.address, public.guests.address),
  orders_count = GREATEST(public.guests.orders_count, EXCLUDED.orders_count),
  last_order_id = COALESCE(EXCLUDED.last_order_id, public.guests.last_order_id),
  updated_at = NOW();
