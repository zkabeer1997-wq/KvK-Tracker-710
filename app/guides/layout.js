import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, computeAdminToken } from '../../lib/adminAuth';
import { MEMBER_ACCESS_COOKIE, getMemberAccessByToken } from '../../lib/memberAccessV2';

export const dynamic = 'force-dynamic';

async function hasAdminSession() {
  const cookie = cookies().get(ADMIN_COOKIE_NAME);
  const expected = await computeAdminToken();
  return Boolean(cookie && expected && cookie.value === expected);
}

export default async function GuidesSecureLayout({ children }) {
  const admin = await hasAdminSession();
  if (!admin) {
    const token = cookies().get(MEMBER_ACCESS_COOKIE)?.value || '';
    const member = await getMemberAccessByToken(token);
    if (!member) {
      redirect('/member-access?returnTo=%2Fguides');
    }
  }

  return children;
}
