import ToolPage from "../../../components/tools/ToolPage";
import { CharmStatPlanner } from "../../../components/tools/Phase2Planners";
export const metadata = { title: "Governor Charm Stat Optimizer | K710" };
export default function Page() {
  return (
    <ToolPage
      title="Governor Charm Stat Optimizer"
      description="Rank upgrades across all 18 charms using your inventory and editable troop and stat priorities."
    >
      <CharmStatPlanner />
    </ToolPage>
  );
}
