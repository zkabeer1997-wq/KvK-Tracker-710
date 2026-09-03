'use client';

import RosterWorkspace from '../../../components/admin/RosterWorkspace';

export default function AdminDashboardPage() {
  return (
    <RosterWorkspace
      title="KvK Members"
      subtitle="Manage member records"
      membersEndpoint="/api/admin-submissions"
      ralliesEndpoint="/api/admin-rallies"
      rallyStorageKey="kvk-admin-rallies-v1"
      exportFileNamePrefix="k710-kvk-members"
      workbookSheetName="KvK Members"
      allowClearTestData
    />
  );
}
