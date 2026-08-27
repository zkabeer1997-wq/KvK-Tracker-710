import './tokens.css';
import '../components/ui/primitives.css';
import './globals.css';
import './kingdom.css';
import './i18n.css';
import { Cinzel, Inter, JetBrains_Mono, Cormorant_Garamond } from 'next/font/google';
import LanguageProvider from '../components/i18n/LanguageProvider';
import SiteChrome from '../components/SiteChrome';
import FilipinoTagalogOptions from '../components/i18n/FilipinoTagalogOptions';

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

// The canonical production URL - every page's canonical tag and OG image
// URL resolves against this. k710hub.vercel.app is the address named
// throughout the portal plan itself; there's no purchased vanity domain
// to point at instead.
export const metadata = {
  metadataBase: new URL('https://k710hub.vercel.app'),
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kingdom 710',
  alternateName: 'K710',
  url: 'https://k710hub.vercel.app',
  description: 'Kingdom 710 — a KvK-first Kingshot kingdom run across three coordinated alliances: 710, RED, and SKY.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${jetbrains.variable} ${cormorant.variable}`}>
      <body className="theme-console">
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <LanguageProvider>
          <FilipinoTagalogOptions />
          <SiteChrome>{children}</SiteChrome>
        </LanguageProvider>
      </body>
    </html>
  );
}
