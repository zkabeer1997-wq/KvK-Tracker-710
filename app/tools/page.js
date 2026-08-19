import Link from 'next/link';

export const metadata = {
  title: 'K710 Tools & Calculators',
};

const tools = [
  {
    key: 'wavebound-charms',
    event: 'Wavebound Voyage',
    title: 'Charm Merge Optimizer',
    description: 'Calculate how many Common and Premium Tidal Treasure merges to make for a target Charm level, including the 75% Exquisite / 25% Majestic outcome.',
    status: 'Available',
  },
];

export default function ToolsPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';
  const backHref = memberId ? `/player-record?member_id=${encodeURIComponent(memberId)}` : '/player-record';

  return (
    <main className="armory tools-workshop">
      <div className="armory-atmos" aria-hidden="true" />
      <span className="armory-rack-l" aria-hidden="true" />
      <span className="armory-rack-r" aria-hidden="true" />

      <div className="armory-inner tools-workshop-inner">
        <header className="armory-head tools-workshop-head">
          <span className="k-mark">Kingdom 710 Workshop</span>
          <h1 className="k-display armory-title">Tools &amp; Calculators</h1>
          <p className="k-narrative armory-lede">Choose an instrument from the workshop. Each tool opens in its own chamber.</p>
        </header>

        <div className="tools-directory" role="list">
          {tools.map((tool) => (
            <Link key={tool.key} href={`/tools/${tool.key}${query}`} className="tool-entry" role="listitem">
              <span className="tool-device" aria-hidden="true">
                <span className="tool-device-ring">⚙</span>
                <span className="tool-device-foot" />
              </span>
              <span className="tool-entry-copy">
                <span className="k-mark tool-event">{tool.event}</span>
                <strong className="k-display">{tool.title}</strong>
                <span className="k-narrative tool-description">{tool.description}</span>
              </span>
              <span className="tool-entry-meta">
                <span>{tool.status}</span>
                <b aria-hidden="true">→</b>
              </span>
            </Link>
          ))}
        </div>

        <div className="tools-empty-note">
          <span className="k-mark">Workshop Ledger</span>
          <p className="k-narrative">Additional calculators will be added here as they are forged. The directory is now the permanent entry point for member tools.</p>
        </div>

        <Link href={backHref} className="tools-back">← Return to member gate</Link>
      </div>

      <style>{`
        .tools-workshop{color:var(--parchment)}
        .tools-workshop-inner{width:min(1040px,100%)}
        .tools-workshop-head{margin-bottom:clamp(34px,6vh,62px)}
        .tools-directory{border-top:1px solid var(--edge)}
        .tool-entry{display:grid;grid-template-columns:150px minmax(0,1fr) 112px;gap:26px;align-items:center;min-height:190px;padding:26px 6px;text-decoration:none;color:inherit;border-bottom:1px solid var(--edge);transition:background var(--t-ui) ease,padding var(--t-ui) var(--ease-cine)}
        .tool-entry:hover,.tool-entry:focus-visible{background:rgba(201,164,78,.055);padding-inline:18px;outline:none}
        .tool-device{height:132px;position:relative;display:grid;place-items:center}
        .tool-device-ring{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;font-size:38px;color:var(--gold-hot);background:radial-gradient(circle,#3f3a2c 0 34%,#171820 36% 48%,#5a4d2e 50% 54%,#171820 56%);border:2px solid rgba(201,164,78,.55);box-shadow:inset 0 0 18px rgba(0,0,0,.7);transition:transform var(--t-ui) var(--ease-cine),filter var(--t-ui) ease}
        .tool-device-foot{position:absolute;bottom:4px;width:104px;height:16px;background:linear-gradient(180deg,#595141,#24221d);border-top:1px solid rgba(201,164,78,.35);clip-path:polygon(10% 0,90% 0,100% 100%,0 100%)}
        .tool-entry:hover .tool-device-ring,.tool-entry:focus-visible .tool-device-ring{transform:rotate(16deg) scale(1.04);filter:drop-shadow(0 0 8px rgba(201,164,78,.28))}
        .tool-entry-copy{display:flex;flex-direction:column;align-items:flex-start;min-width:0}
        .tool-event{color:var(--brass);font-size:10px;margin-bottom:8px}
        .tool-entry-copy strong{font-size:clamp(19px,2.5vw,28px);letter-spacing:.07em;color:var(--parchment)}
        .tool-description{margin-top:9px;color:var(--parchment-dim);font-size:15px;line-height:1.55;max-width:62ch}
        .tool-entry-meta{display:flex;flex-direction:column;align-items:flex-end;gap:12px;color:var(--brass);font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
        .tool-entry-meta b{font-size:24px;font-family:var(--font-body);font-weight:400;color:var(--gold-hot)}
        .tools-empty-note{margin-top:38px;padding-top:22px;border-top:1px solid rgba(201,164,78,.16);max-width:62ch}
        .tools-empty-note p{margin:8px 0 0;color:var(--t-muted);font-size:14px}
        .tools-back{display:inline-block;margin-top:34px;color:var(--brass);font-family:var(--font-body);font-size:12px;text-decoration:none;letter-spacing:.06em}
        .tools-back:hover{color:var(--gold-hot)}
        @media(max-width:700px){.tool-entry{grid-template-columns:92px minmax(0,1fr);gap:18px;padding-block:22px}.tool-entry-meta{grid-column:2;align-items:flex-start;flex-direction:row}.tool-device{height:100px}.tool-device-ring{width:70px;height:70px;font-size:30px}.tool-device-foot{width:82px}.tool-entry:hover,.tool-entry:focus-visible{padding-inline:8px}.tools-workshop-inner{padding-top:86px}}
        @media(prefers-reduced-motion:reduce){.tool-entry,.tool-device-ring{transition:none}}
      `}</style>
    </main>
  );
}
