import ToolPage from '../../../components/tools/ToolPage';
import MastersDatabase from '../../../components/tools/MastersDatabase';
export const metadata = { title: 'Masters Database & Compare | K710' };
export default function MastersDatabasePage() {
  return (
    <ToolPage title="Masters Database & Compare" description="Browse the full Masters roster and compare two Masters side by side." backHref="/tools?category=Masters" backLabel="Masters">
      <MastersDatabase />
    </ToolPage>
  );
}
