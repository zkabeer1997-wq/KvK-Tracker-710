import ToolPage from '../../../components/tools/ToolPage';
import GovernorGearUpgradePlanner from '../../../components/tools/GovernorGearUpgradePlanner';
export const metadata = { title: 'Governor Gear Upgrade Planner | K710' };
export default function GovernorGearUpgradePage() {
  return (
    <ToolPage title="Governor Gear Upgrade Planner" description="Plan a Governor Gear tier upgrade and see the estimated materials and power gain." backHref="/tools?category=Governor+Gear" backLabel="Governor Gear">
      <GovernorGearUpgradePlanner />
    </ToolPage>
  );
}
