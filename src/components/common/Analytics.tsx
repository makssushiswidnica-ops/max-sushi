'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

interface AnalyticsProps {
  gtmId: string;
  gaId: string;
}

export function Analytics({ gtmId, gaId }: AnalyticsProps) {
  const pathname = usePathname();

  // Не підключаємо Google Analytics в адмін-панелі (/admin),
  // щоб робота персоналу з замовленнями не накручувала статистику відвідувачів
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}

