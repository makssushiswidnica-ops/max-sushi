-- ==============================================================================
-- 🔒 ПОВНИЙ ЗАХИСТ БАЗИ ДАНИХ ТА СХОВИЩА (RLS LOCKDOWN) ДЛЯ MAKS-SUSHI.PL
-- ==============================================================================
-- Як виконати:
-- 1. Відкрийте панель керування Supabase -> SQL Editor -> New Query
-- 2. Вставте весь цей код та натисніть "Run" (Ctrl + Enter)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ЗАХИСТ ТАБЛИЦІ КАТЕГОРІЙ (public.categories)
-- Читати можуть усі відвідувачі сайту.
-- Створювати, редагувати та видаляти — ТІЛЬКИ адміністратор.
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
DROP POLICY IF EXISTS "Allow all for categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full access categories" ON public.categories;

CREATE POLICY "Allow public read categories"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admin full access categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com');


-- ------------------------------------------------------------------------------
-- 2. ЗАХИСТ ТАБЛИЦІ СТРАВ / МЕНЮ (public.products)
-- Читати можуть усі відвідувачі сайту.
-- Додавати страви, змінювати ціни та видаляти — ТІЛЬКИ адміністратор.
-- ------------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Allow all for products" ON public.products;
DROP POLICY IF EXISTS "Admin full access products" ON public.products;

CREATE POLICY "Allow public read products"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Admin full access products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com');


-- ------------------------------------------------------------------------------
-- 3. ЗАХИСТ ТАБЛИЦІ ЗАМОВЛЕНЬ ТА СИСТЕМНИХ НАЛАШТУВАНЬ (public.orders)
-- Клієнти можуть оформлювати нові замовлення (INSERT, крім системного '__settings__')
-- та перевіряти статус замовлення.
-- Змінювати статуси, видаляти замовлення або міняти налаштування '__settings__'
-- може ТІЛЬКИ авторизований адміністратор!
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;

-- Читання замовлень та налаштувань магазину
CREATE POLICY "Allow public read orders"
  ON public.orders
  FOR SELECT
  USING (true);

-- Створення нових замовлень клієнтами (заборонено підміняти системний рядок '__settings__')
CREATE POLICY "Allow public insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (id <> '__settings__');

-- Повний доступ (UPDATE, DELETE, INSERT включно з '__settings__') виключно для адміністратора
CREATE POLICY "Admin full access orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com');


-- ------------------------------------------------------------------------------
-- 4. ЗАХИСТ ТАБЛИЦІ КЛІЄНТІВ (public.customers)
-- Забороняємо видалення клієнтів будь-кому, крім адміністратора.
-- ------------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public delete customers" ON public.customers;
DROP POLICY IF EXISTS "Admin delete customers" ON public.customers;

CREATE POLICY "Admin delete customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com');


-- ------------------------------------------------------------------------------
-- 5. ЗАХИСТ ФОТОГРАФІЙ МЕНЮ В STORAGE (bucket: menu-images)
-- Переглядати фото можуть усі, завантажувати/видаляти — ТІЛЬКИ адміністратор.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete menu images" ON storage.objects;

CREATE POLICY "Admin upload menu images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-images'
    AND lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com'
  );

CREATE POLICY "Admin update menu images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com'
  );

CREATE POLICY "Admin delete menu images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com'
  );
