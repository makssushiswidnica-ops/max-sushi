#!/usr/bin/env node
/**
 * Повний резервний бекап Supabase (таблиці + Storage-бакет menu-images)
 * Запуск локально: npm run backup
 * Запуск у GitHub Actions: автоматично за розкладом або вручну
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Завантажуємо змінні з .env.local, якщо скрипт запущено локально
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czjqvocewhucknsrnese.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Не знайдено NEXT_PUBLIC_SUPABASE_URL або ключ Supabase.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️ УВАГА: Використовується ANON KEY замість SUPABASE_SERVICE_ROLE_KEY. ' +
      'Якщо увімкнено суворий RLS, деякі таблиці (напр. customers/orders) можуть бути неповними.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABLES = ['categories', 'products', 'orders', 'customers', 'guests'];
const BUCKETS = ['menu-images'];

const today = new Date().toISOString().slice(0, 10);
const backupRoot = path.resolve(process.cwd(), 'backups', today);
const dbDir = path.join(backupRoot, 'db');
const storageDir = path.join(backupRoot, 'storage');

fs.mkdirSync(dbDir, { recursive: true });
fs.mkdirSync(storageDir, { recursive: true });

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const json = JSON.stringify(val).replace(/'/g, "''");
    return `'${json}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function buildUpsertSql(tableName, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return `-- Таблиця ${tableName}: 0 записів\n`;
  }
  const lines = [`-- Автоматичний бекап таблиці public.${tableName} (${rows.length} записів)`];
  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map((c) => sqlEscape(row[c]));
    const updates = cols
      .filter((c) => c !== 'id')
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(', ');
    lines.push(
      `INSERT INTO public."${tableName}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT ("id") DO UPDATE SET ${updates};`
    );
  }
  return lines.join('\n') + '\n';
}

async function fetchAllRows(tableName) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) {
      throw new Error(`Помилка читання ${tableName}: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function listBucketFilesRecursively(bucket, prefix = '') {
  const collected = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });
  if (error) {
    throw new Error(`Помилка списку файлів бакета ${bucket}/${prefix}: ${error.message}`);
  }
  for (const item of data || []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (!item.id) {
      // Це папка
      const nested = await listBucketFilesRecursively(bucket, itemPath);
      collected.push(...nested);
    } else {
      collected.push(itemPath);
    }
  }
  return collected;
}

async function main() {
  console.log(`📦 Старт резервного копіювання Supabase у ${backupRoot}...`);
  const summary = {
    createdAt: new Date().toISOString(),
    tables: {},
    buckets: {},
  };

  let menuRestoreSql = `-- ============================================================\n`;
  menuRestoreSql += `-- Відновлення меню Maks Sushi (${today})\n`;
  menuRestoreSql += `-- ============================================================\n\n`;

  for (const table of TABLES) {
    try {
      const rows = await fetchAllRows(table);
      fs.writeFileSync(
        path.join(dbDir, `${table}.json`),
        JSON.stringify(rows, null, 2),
        'utf8'
      );
      summary.tables[table] = rows.length;
      console.log(`  ✓ ${table}: ${rows.length} записів`);

      if (table === 'categories' || table === 'products') {
        menuRestoreSql += buildUpsertSql(table, rows) + '\n';
      }
    } catch (err) {
      console.error(`  ✗ ${table}: ${err.message}`);
      summary.tables[table] = `ERROR: ${err.message}`;
    }
  }

  fs.writeFileSync(path.join(dbDir, 'menu_restore.sql'), menuRestoreSql, 'utf8');

  for (const bucket of BUCKETS) {
    try {
      const files = await listBucketFilesRecursively(bucket);
      let downloaded = 0;
      for (const filePath of files) {
        const { data, error } = await supabase.storage.from(bucket).download(filePath);
        if (error || !data) {
          console.warn(`  ⚠️ Не вдалося скачати ${bucket}/${filePath}: ${error?.message}`);
          continue;
        }
        const destPath = path.join(storageDir, bucket, filePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const buffer = Buffer.from(await data.arrayBuffer());
        fs.writeFileSync(destPath, buffer);
        downloaded++;
      }
      summary.buckets[bucket] = { listed: files.length, downloaded };
      console.log(`  ✓ bucket "${bucket}": скачано ${downloaded}/${files.length} файлів`);
    } catch (err) {
      console.error(`  ✗ bucket "${bucket}": ${err.message}`);
      summary.buckets[bucket] = `ERROR: ${err.message}`;
    }
  }

  fs.writeFileSync(
    path.join(backupRoot, 'manifest.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );
  console.log('✅ Бекап успішно завершено!');
}

main().catch((err) => {
  console.error('❌ Критична помилка бекапу:', err);
  process.exit(1);
});

