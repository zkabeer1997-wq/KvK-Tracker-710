import MemberAccessGate from './MemberAccessGate';

export const metadata = {
  title: 'Secure Member Access · K710 Hub',
  description: 'Activate or sign in to Kingdom 710 secure member access.',
};

export const dynamic = 'force-dynamic';

export default function MemberAccessPage({ searchParams }) {
  const returnTo = typeof searchParams?.returnTo === 'string' && searchParams.returnTo.startsWith('/')
    ? searchParams.returnTo
    : '/guides';
  return <MemberAccessGate returnTo={returnTo} />;
}
