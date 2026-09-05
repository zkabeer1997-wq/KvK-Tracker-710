import ToolPage from "../../../components/tools/ToolPage";
import { GovernorGearPlanner } from "../../../components/tools/Phase2Planners";
export const metadata = { title: "Governor Gear Optimizer | K710" };
export default function Page() {
  return (
    <ToolPage
      title="Governor Gear Optimizer"
      description="Plan target tiers or rank the best use of Satin, Gilded Threads, and Artisan’s Visions."
    >
      <GovernorGearPlanner />
    </ToolPage>
  );
}
