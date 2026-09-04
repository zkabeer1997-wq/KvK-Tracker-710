import ToolPage from '../../../components/tools/ToolPage';
import MasterUpgradePlanner from '../../../components/tools/MasterUpgradePlanner';
export const metadata = { title: 'Master Upgrade Planner | K710' };
export default function MastersUpgradePage() {
  return (
    <ToolPage title="Master Upgrade Planner" description="Plan a Master's level upgrade and see the estimated materials, power and squad buff gain." backHref="/tools?category=Masters" backLabel="Masters">
      <MasterUpgradePlanner />
    </ToolPage>
  );
}
