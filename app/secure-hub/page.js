import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MemberHub from '../../components/kingdom/world/MemberHub';
import { MEMBER_ACCESS_COOKIE, getMemberAccessByToken } from '../../lib/memberAccessV2';
import SecureSessionControls from './SecureSessionControls';

export const metadata = {
  title: 'Secure Member Hub · K710',
};

export const dynamic = 'force-dynamic';

export default async function SecureHubPage() {
  const token = cookies().get(MEMBER_ACCESS_COOKIE)?.value || '';
  const member = await getMemberAccessByToken(token);
  if (!member) {
    redirect('/member-access?returnTo=%2Fsecure-hub');
  }

  return (
    <>
      <MemberHub memberId={member.member_id} />
      <SecureSessionControls member={member} />
    </>
  );
}
