import GuidesDirectory from './GuidesDirectory';

export const metadata = {
  title: 'K710 Guides',
  description: 'Kingdom 710 strategy, event, and member guides.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function GuidesPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  return <GuidesDirectory memberId={memberId} />;
}
