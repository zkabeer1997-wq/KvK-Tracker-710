'use client';

import { useSearchParams } from 'next/navigation';
import PrepBackpackForm from './PrepBackpackForm';

export default function PrepBackpackClient() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get('member_id') || '';
  return <PrepBackpackForm initialMemberId={memberId} />;
}
