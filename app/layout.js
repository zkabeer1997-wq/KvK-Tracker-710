import './globals.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

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
<html lang="en">
<body>
<SiteHeader />
{children}
<SiteFooter />
</body>
</html>
);
}
