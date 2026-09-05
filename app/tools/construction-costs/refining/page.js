import ToolPage from "../../../../components/tools/ToolPage";
export const metadata = {
  title: "Tempered True Gold Refining Optimizer | K710",
};
export default async function RefiningPlaceholder({ searchParams }) {
  const params = await searchParams,
    truegold = Math.max(0, Number(params?.truegold) || 0),
    tempered = Math.max(0, Number(params?.temperedTruegold) || 0);
  return (
    <ToolPage
      title="Tempered True Gold Refining Optimizer"
      description="Production-rate optimization remains in development pending verified refining data."
      backHref="/tools/construction-costs"
      backLabel="Construction Costs"
    >
      <section
        style={{
          padding: 20,
          border: "1px solid var(--edge)",
          borderRadius: 12,
        }}
      >
        <h2>Imported construction requirement</h2>
        <p>
          True Gold: <b>{truegold.toLocaleString()}</b>
        </p>
        <p>
          Tempered True Gold: <b>{tempered.toLocaleString()}</b>
        </p>
        <p>
          These requirements are retained without inventing a refining rate.
          Supply a verified array of refining recipes shaped as{" "}
          <code>{`{ inputTrueGold, outputTemperedTrueGold, durationSeconds, dailyLimit }`}</code>{" "}
          to enable scheduling.
        </p>
      </section>
    </ToolPage>
  );
}
