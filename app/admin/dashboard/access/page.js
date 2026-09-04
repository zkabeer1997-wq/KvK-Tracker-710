import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readMemberSession } from '../../../../lib/memberAuth';
import AccessManager from './AccessManager';

export const metadata = { title: 'User access' };
export const dynamic = 'force-dynamic';

export default async function UserAccessPage() {
  const session = await readMemberSession({ cookies: await cookies() });
  if (session?.role !== 'superadmin') redirect('/admin/dashboard/overview');
  return <AccessManager actorPlayerId={session.playerId} />;
}

