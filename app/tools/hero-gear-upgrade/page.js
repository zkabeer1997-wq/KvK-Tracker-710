import ToolPage from '../../../components/tools/ToolPage';
import HeroGearUpgradePlanner from '../../../components/tools/HeroGearUpgradePlanner';
export const metadata = { title: 'Hero Gear Upgrade Calculator | K710' };
export default function HeroGearUpgradePage() {
  return (
    <ToolPage title="Hero Gear Upgrade Calculator" description="Plan a hero's gear level upgrade and see the estimated materials and stat gain." backHref="/tools?category=Hero+Gear" backLabel="Hero Gear">
      <HeroGearUpgradePlanner />
    </ToolPage>
  );
}
