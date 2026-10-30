import fs from 'fs';

// Прочитаємо mockData.ts як текст і розпарсимо дані
const content = fs.readFileSync('src/lib/mockData.ts', 'utf8');

// Знаходимо масиви categories і products через eval у безпечному контексті
const catMatch = content.match(/export const categories: Category\[\] = (\[[\s\S]*?\n\];)/);
const prodMatch = content.match(/export const products: Product\[\] = (\[[\s\S]*?\n\];)/);

if (catMatch && prodMatch) {
  const cleanCat = catMatch[1].replace(/;\s*$/, '');
  const cleanProd = prodMatch[1].replace(/;\s*$/, '');

  const categories = eval(cleanCat);
  const products = eval(cleanProd);

  let sql = '-- 1. Заповнення 12 категорій\n';
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const nameJson = JSON.stringify(c.name).replace(/'/g, "''");
    sql += `INSERT INTO public.categories (id, name, icon, image, sort_order) VALUES ('${c.id}', '${nameJson}'::jsonb, '${c.icon || 'CircleDot'}', '', ${i}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;\n`;
  }

  sql += '\n-- 2. Заповнення 107 страв (без фото - фото будуть завантажені через адмінку)\n';
  for (const p of products) {
    const nameJson = JSON.stringify(p.name).replace(/'/g, "''");
    const descJson = JSON.stringify(p.description).replace(/'/g, "''");
    const ingJson = JSON.stringify(p.ingredients).replace(/'/g, "''");
    const nutJson = JSON.stringify(p.nutrition || { calories: 0, proteins: 0, fats: 0, carbs: 0 });
    const badgeVal = p.badge ? `'${p.badge}'` : 'NULL';
    const piecesVal = p.pieces ? p.pieces : 'NULL';

    sql += `INSERT INTO public.products (id, category_id, name, description, price, weight, pieces, image, images, badge, ingredients, nutrition, is_available) VALUES ('${p.id}', '${p.categoryId}', '${nameJson}'::jsonb, '${descJson}'::jsonb, ${p.price}, ${p.weight}, ${piecesVal}, '', '[]'::jsonb, ${badgeVal}, '${ingJson}'::jsonb, '${nutJson}'::jsonb, true) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, weight = EXCLUDED.weight, pieces = EXCLUDED.pieces, badge = EXCLUDED.badge, ingredients = EXCLUDED.ingredients;\n`;
  }

  fs.writeFileSync('supabase_seed_menu.sql', sql, 'utf8');
  console.log(`Generated supabase_seed_menu.sql: ${categories.length} categories, ${products.length} products.`);
} else {
  console.error('Could not match categories or products in mockData.ts');
}

