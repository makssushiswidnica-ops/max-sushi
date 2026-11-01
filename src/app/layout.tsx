import type { Metadata, Viewport } from 'next';
import { Montserrat, Knewave, Unbounded, Dela_Gothic_One } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { BisSkinCleanup } from '@/components/common/BisSkinCleanup';

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

const delaGothicOne = Dela_Gothic_One({
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
  variable: '--font-dela-gothic',
  display: 'swap',
});

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['700', '800', '900'],
  variable: '--font-unbounded',
  display: 'swap',
});

const edoSZ = localFont({
  src: '../../public/fonts/EdoSZ.ttf',
  variable: '--font-edo',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Maks Sushi — Dostawa Sushi & Japanese Food',
  description: 'Świeże sushi, zestawy i rolki z szybką dostawą w 30 minut. Najwyższa jakość, świeży łosoś i tradycyjne japońskie receptury.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning className={`${montserrat.variable} ${knewave.variable} ${delaGothicOne.variable} ${unbounded.variable} ${edoSZ.variable} dark antialiased`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-[#e50914] selection:text-white">
        <BisSkinCleanup />
        {children}
      </body>
    </html>
  );
}
