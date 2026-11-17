import type { Metadata, Viewport } from 'next';
import { Montserrat, Knewave, Rubik_Wet_Paint } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { BisSkinCleanup } from '@/components/common/BisSkinCleanup';
import { Analytics } from '@/components/common/Analytics';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

const knewave = Knewave({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-knewave',
  display: 'swap',
});

const edoSZ = localFont({
  src: '../../public/fonts/EdoSZ.ttf',
  variable: '--font-edo',
  display: 'swap',
});

const rubikWetPaint = Rubik_Wet_Paint({
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
  variable: '--font-rubik-wet-paint',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maks-sushi.pl';
const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TDK96T2F';
const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-VNTVG0MNHN';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Maks Sushi Świdnica — Najlepsze Sushi z Dostawą i na Wynos',
  description: 'Maks Sushi w Świdnicy: wyśmienite rolki, zestawy sushi i dania japońskie. Szybka dostawa pod Twoje drzwi lub odbiór przy ul. Parkowej 8. Zamów online!',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: ['/icon.png'],
    apple: [
      { url: '/icon.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning className={`${montserrat.variable} ${knewave.variable} ${edoSZ.variable} ${rubikWetPaint.variable} dark antialiased`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-[#e50914] selection:text-white">
        <Analytics gtmId={gtmId} gaId={gaId} />
        <BisSkinCleanup />
        {children}
      </body>
    </html>
  );
}
