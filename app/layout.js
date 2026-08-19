import './globals.css';
import './kingdom.css';
import './i18n.css';
import { Cinzel, Inter, JetBrains_Mono, Cormorant_Garamond } from 'next/font/google';
import CrestMenu from '../components/kingdom/world/CrestMenu';
import LanguageProvider from '../components/i18n/LanguageProvider';

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

// Narrative voice. Cinzel is reserved for struck titles; prose and
// doctrine copy use a refined serif so the world does not read as
// "everything in medieval caps".
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-narrative-loaded',
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
  themeColor: '#10142a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${jetbrains.variable} ${cormorant.variable}`}>
      <body>
        <LanguageProvider>
          <CrestMenu />
          <div id="main">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
