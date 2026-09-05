import ToolPage from "../../../../components/tools/ToolPage";
import { TtgProductionPlanner } from "../../../../components/tools/Phase2Planners";
export const metadata = {
  title: "Tempered True Gold Production Planner | K710",
};
export default async function Page({ searchParams }) {
  const params = await searchParams;
  return (
    <ToolPage
      title="Tempered True Gold Production Planner"
      description="Protect your building reserve and schedule refinement against construction and research goals."
      backHref="/tools/construction-costs"
      backLabel="Construction Costs"
    >
      <TtgProductionPlanner
        importedTrueGold={Math.max(0, Number(params?.truegold) || 0)}
        importedTempered={Math.max(0, Number(params?.temperedTruegold) || 0)}
      />
    </ToolPage>
  );
}
