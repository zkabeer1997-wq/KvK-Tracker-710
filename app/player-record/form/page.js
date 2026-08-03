'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PlayerRecordForm from '../PlayerRecordForm';

function PlayerRecordFormInner() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get('member_id') || '';
  return <PlayerRecordForm initialMemberId={memberId} />;
}

export default function PlayerRecordFormPage() {
  return (
    <main className="page public-page">
      <Suspense fallback={null}>
        <PlayerRecordFormInner />
      </Suspense>
    </main>
  );
}
