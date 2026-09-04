import ToolPage from '../../../components/tools/ToolPage';
import HeroGearSetBuilder from '../../../components/tools/HeroGearSetBuilder';
export const metadata = { title: 'Hero Gear Set Builder | K710' };
export default function HeroGearBuilderPage() {
  return (
    <ToolPage title="Hero Gear Set Builder" description="Build a hero's full gear set and see the total score and weakest piece." backHref="/tools?category=Hero+Gear" backLabel="Hero Gear">
      <HeroGearSetBuilder />
    </ToolPage>
  );
}
