import MusterHall from '../../components/kingdom/world/MusterHall';

export const metadata = {
  title: 'K710 Forms',
};

export default async function FormsPage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  return <MusterHall memberId={memberId} />;
}
