import './globals.css';
import './kingdom-theme.css';
import { Cinzel, Inter, JetBrains_Mono } from 'next/font/google';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

// Self-hosted at build time. Replaces the render-blocking CSS @import
// that previously chained an extra round-trip to fonts.googleapis.com
// before any text could paint.
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '800', '900'],
  display: 'swap',
  variable: '--font-display-loaded',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-body-loaded',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-mono-loaded',
});

export const metadata = {
  title: {
    default: 'K710 Hub',
    template: '%s · K710 Hub',
  },
  description: 'Kingdom 710 — Kingshot KvK command hub: rally roster, war ledger, and transfer intake for a KvK-first kingdom.',
  applicationName: 'K710 Hub',
  openGraph: {
    title: 'K710 Hub',
    description: 'Kingdom 710 — Kingshot KvK command hub: rally roster, war ledger, and transfer intake for a KvK-first kingdom.',
    siteName: 'K710 Hub',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#132142',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
