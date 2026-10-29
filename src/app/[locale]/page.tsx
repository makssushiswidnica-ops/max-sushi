import React from 'react';
import { HeroBanner } from '@/components/layout/HeroBanner';
import { MenuCatalog } from '@/components/menu/MenuCatalog';

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // Валідація Promise параметрів Next.js 15/16

  return (
    <div>
      <HeroBanner />
      <MenuCatalog />
    </div>
  );
}
