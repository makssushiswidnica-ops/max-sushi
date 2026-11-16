import React from 'react';
import { HeroBanner } from '@/components/layout/HeroBanner';
import { MenuCatalog } from '@/components/menu/MenuCatalog';

export const dynamic = 'force-dynamic';

async function getServerFreeThreshold(): Promise<number | undefined> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://czjqvocewhucknsrnese.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6anF2b2Nld2h1Y2tuc3JuZXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDE4NTYsImV4cCI6MjEwODkxNzg1Nn0.OTnqNg6TMY8-38KPuqaRzTvZIXC4AoSTPtr0GBhbCaQ';
    const res = await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.__settings__&select=comment`,
      {
        headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return undefined;
    const rows = await res.json();
    const raw = rows?.[0]?.comment;
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return typeof parsed?.cityFreeThreshold === 'number' ? parsed.cityFreeThreshold : undefined;
  } catch {
    return undefined;
  }
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // Валідація Promise параметрів Next.js 15/16
  const initialFreeThreshold = await getServerFreeThreshold();

  return (
    <div>
      <HeroBanner initialFreeThreshold={initialFreeThreshold} />
      <MenuCatalog />
    </div>
  );
}
