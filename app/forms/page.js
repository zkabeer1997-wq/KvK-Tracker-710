import MusterHall from '../../components/kingdom/world/MusterHall';

export const metadata = {
  title: 'K710 Forms',
};

export default function FormsPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  return <MusterHall memberId={memberId} />;
}
