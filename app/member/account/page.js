import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readMemberSession } from '../../../lib/memberAuth';
import MemberPinForm from './MemberPinForm';

export const metadata = { title: 'Member Account | K710' };

export default async function MemberAccountPage() {
  const session = await readMemberSession({ cookies: await cookies() });
  if (!session) redirect('/player-record?next=/member/account');
  return <MemberPinForm memberId={session.memberId} />;
}
