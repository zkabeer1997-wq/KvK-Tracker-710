import ToolPage from "../../../components/tools/ToolPage";
import { PetProgressionPlanner } from "../../../components/tools/Phase2Planners";
export const metadata = { title: "Pet Progression Planner | K710" };
export default function Page() {
  return (
    <ToolPage
      title="Pet Progression Planner"
      description="Plan pet levels and advancement, calculate material shortfalls, and hand them to the Pet Pack Optimizer."
    >
      <PetProgressionPlanner />
    </ToolPage>
  );
}
