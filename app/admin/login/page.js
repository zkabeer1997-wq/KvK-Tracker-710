import { redirect } from 'next/navigation';

export default function RetiredAdminLoginPage() {
  redirect('/player-record?next=/admin/dashboard/overview');
}
