import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Alliances',
  description: 'Kingdom 710 alliances — now part of the About page.',
  alternates: { canonical: '/about#alliances' },
};

/** Alliances listing lives on About; keep /alliances URL working via redirect. */
export default function AlliancesPage() {
  redirect('/about#alliances');
}
