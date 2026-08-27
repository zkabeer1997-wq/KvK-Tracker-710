// Shared shape for the four economy calculators' SoftwareApplication
// structured data - each free-to-use, browser-based, no install.
export function toolSoftwareApplicationJsonLd({ name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: `https://k710hub.vercel.app${path}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
