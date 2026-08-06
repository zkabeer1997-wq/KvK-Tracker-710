'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PrepBackpackForm from './PrepBackpackForm';

function PrepBackpackInner() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get('member_id') || '';
  return <PrepBackpackForm initialMemberId={memberId} />;
}

export default function PrepBackpackPage() {
  return (
    <main className="page public-page">
      <div className="public-shell single-form prep-wide">
        <Suspense fallback={null}>
          <PrepBackpackInner />
        </Suspense>
      </div>
    </main>
  );
}
