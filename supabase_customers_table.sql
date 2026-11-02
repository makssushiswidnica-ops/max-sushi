-- ========================================================
-- ТАБЛИЦЯ ЗАРЕЄСТРОВАНИХ КЛІЄНТІВ (MAKS SUSHI)
-- ========================================================
-- Скопіюйте цей код та виконайте його в Supabase:
-- SQL Editor -> New Query -> Вставити -> Run (Ctrl+Enter)

CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  password TEXT,
  address JSONB,
  language TEXT DEFAULT 'pl',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Індекси для швидкого пошуку за номером або e-mail
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Налаштування прав доступу (Row Level Security)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Дозволити читання, створення та оновлення профілів клієнтів
DROP POLICY IF EXISTS "Allow public read customers" ON public.customers;
CREATE POLICY "Allow public read customers" ON public.customers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
CREATE POLICY "Allow public insert customers" ON public.customers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update customers" ON public.customers;
CREATE POLICY "Allow public update customers" ON public.customers
  FOR UPDATE USING (true);

