import ToolPage from "../../../components/tools/ToolPage";
import { HeroGearPlanner } from "../../../components/tools/Phase2Planners";
export const metadata = { title: "Hero Gear Optimizer | K710" };
export default function Page() {
  return (
    <ToolPage
      title="Hero Gear Optimizer"
      description="Model all 12 troop gear pieces and prepare an upgrade plan for rally-leading, joining, PvP, or PvE."
    >
      <HeroGearPlanner />
    </ToolPage>
  );
}
