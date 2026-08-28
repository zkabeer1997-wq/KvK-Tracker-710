'use client';

import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';

export default function AdminDashboardOverviewPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <AdminShell
      title="Dashboard Panel"
      subtitle="K710 command overview"
      onLogout={handleLogout}
    >
      <div className="admin-wip-panel">
        <p className="admin-page-lead">
          This panel will collate live operational data across the war room.
        </p>
        <div className="admin-wip-card">
          <span className="admin-wip-badge">Work in progress</span>
          <h2>Data collation coming next</h2>
          <p>
            Summary metrics for members, transfers, events, prep ministers, and
            Flamedragon will land here. Use the sidebar sections to manage each
            area in the meantime.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
