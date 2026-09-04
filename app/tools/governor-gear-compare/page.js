import ToolPage from '../../../components/tools/ToolPage';
import GovernorGearCompare from '../../../components/tools/GovernorGearCompare';
export const metadata = { title: 'Governor Gear Set Comparer | K710' };
export default function GovernorGearComparePage() {
  return (
    <ToolPage title="Governor Gear Set Comparer" description="Compare two full 6-slot Governor Gear loadouts side by side." backHref="/tools?category=Governor+Gear" backLabel="Governor Gear">
      <GovernorGearCompare />
    </ToolPage>
  );
}
