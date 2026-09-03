const BASE_URL = 'https://k710hub.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/player-record/form', '/power-profile', '/flamedragon', '/prep-phase-backpack', '/forms', '/tools'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
