import ToolPage from "../../../components/tools/ToolPage";
import { MastersPlanner } from "../../../components/tools/Phase2Planners";
export const metadata = { title: "Masters Planner | K710" };
export default function Page() {
  return (
    <ToolPage
      title="Masters Planner"
      description="Track Master relationships, talents, skills, learning progress, and progression inventory."
    >
      <MastersPlanner />
    </ToolPage>
  );
}
