-- ==============================================================================
-- 🛡️ АРХІВНИЙ ЗАПОБІЖНИК ВІД ВИПАДКОВОГО ВИДАЛЕННЯ МЕНЮ (categories & products)
-- ==============================================================================
-- Як виконати:
-- 1. Відкрийте Supabase -> SQL Editor -> New Query
-- 2. Вставте цей SQL та натисніть "Run"
-- Після цього будь-який видалений рядок із products або categories автоматично
-- збережеться в таблиці public.menu_archive!
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.menu_archive (
  archive_id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by TEXT DEFAULT current_user
);

ALTER TABLE public.menu_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access menu_archive" ON public.menu_archive;
CREATE POLICY "Admin full access menu_archive"
  ON public.menu_archive
  FOR ALL
  TO authenticated
  USING (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com')
  WITH CHECK (lower(auth.jwt() ->> 'email') = 'makssushiswidnica@gmail.com');

CREATE OR REPLACE FUNCTION public.archive_deleted_menu_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.menu_archive (table_name, record_id, record_data, deleted_by)
  VALUES (
    TG_TABLE_NAME,
    OLD.id::text,
    to_jsonb(OLD),
    COALESCE(auth.jwt() ->> 'email', current_user)
  );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_archive_deleted_product ON public.products;
CREATE TRIGGER trg_archive_deleted_product
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.archive_deleted_menu_row();

DROP TRIGGER IF EXISTS trg_archive_deleted_category ON public.categories;
CREATE TRIGGER trg_archive_deleted_category
  BEFORE DELETE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.archive_deleted_menu_row();

