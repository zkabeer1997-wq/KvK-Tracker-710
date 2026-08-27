import Image from 'next/image';
import Link from 'next/link';

// Every category renders as a real, server-rendered section — no client-side
// tab switching gating content behind a click. The old version defaulted to
// showing only the "Charms" category on first paint; anything in another
// category (Flamedragon, Adventure Stall) only existed in the initial HTML
// after a user clicked a tab. That's the same shape of problem as 846's
// hash-routed SPA: real content that isn't in the document a crawler sees.
const CATEGORIES = ['Charms', 'Governor Gear', 'Hero Gear', 'Pets', 'Masters', 'Special Event Shops'];
const TOOLS = {
  Charms: [
    { key: 'charm-pack-optimizer', event: 'Governor Charms', title: 'Charm Pack Optimizer', description: 'Set all 18 charms individually, calculate every upgrade material, and build the cheapest week-by-week pack plan.', status: 'New', icon: '/images/charm-pack-forge.svg' },
    { key: 'wavebound-charms', event: 'Wavebound Voyage', title: 'Charms Sailing Optimizer', description: 'Calculate Tidal Treasure merges for a target Charm level, including Exquisite and Majestic outcomes.', status: 'Available', icon: '/images/wavebound-charm-sail.svg' },
  ],
  'Governor Gear': [],
  'Hero Gear': [],
  Pets: [],
  Masters: [],
  'Special Event Shops': [
    { key: 'flamedragon-shop', event: 'Flamedragon Tyrant', title: 'Dragon’s Caravan Optimizer', description: 'Build a reward cart, prioritize the best-value shop items, and calculate the cheapest Dragon Essence pack combination.', status: 'New', icon: '/images/flamedragon-caravan.svg' },
    { key: 'adventure-stall', event: 'Adventure Stall', title: 'Adventure Stall Optimizer', description: 'Choose your event rewards and calculate the lowest-cost daily pack plan after using the Shells already in your inventory.', status: 'New', icon: '/images/adventure-stall.svg' },
  ],
};

export default function ToolsDirectory({ memberId }) {
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';

  return (
    <section className="tools-catalog">
      {CATEGORIES.map((category) => {
        const tools = TOOLS[category];
        return (
          <div key={category} className="tools-category-block">
            <div className="tools-category-head">
              <span className="k-mark">Workshop discipline</span>
              <h2 className="k-display">{category}</h2>
            </div>

            {tools.length ? (
              <div className="tools-directory" role="list">
                {tools.map((tool) => (
                  <Link key={tool.key} href={`/tools/${tool.key}${query}`} className="tool-entry" role="listitem">
                    <span className="tool-device" aria-hidden="true">
                      <Image className="tool-device-art" src={tool.icon} alt="" width={132} height={132} />
                      <span className="tool-device-glow" />
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
            ) : (
              <div className="tools-empty">
                <span aria-hidden="true">◇</span>
                <h3 className="k-display">Tools are being forged</h3>
                <p className="k-narrative">The {category} workshop is prepared for future calculators.</p>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        .tools-catalog{color:var(--parchment)}
        .tools-category-block+.tools-category-block{margin-top:36px}
        .tools-category-head{padding:14px 4px}
        .tools-category-head h2{margin:5px 0 0;color:var(--parchment);font-size:clamp(22px,3.6vw,32px);letter-spacing:.08em}
        .tools-directory{border-top:1px solid var(--edge)}
        .tool-entry{display:grid;grid-template-columns:150px minmax(0,1fr) 112px;gap:26px;align-items:center;min-height:190px;padding:26px 6px;text-decoration:none;color:inherit;border-bottom:1px solid var(--edge);transition:background .2s ease,padding .2s var(--ease-cine)}
        .tool-entry:hover,.tool-entry:focus-visible{background:rgba(201,164,78,.055);padding-inline:18px;outline:none}
        .tool-device{height:142px;position:relative;display:grid;place-items:center;isolation:isolate}
        .tool-device-art{position:relative;z-index:2;object-fit:contain;filter:drop-shadow(0 10px 10px rgba(0,0,0,.55));transition:transform .2s var(--ease-cine)}
        .tool-device-glow{position:absolute;z-index:1;width:96px;height:96px;border-radius:50%;background:radial-gradient(circle,rgba(65,164,255,.2),rgba(201,164,78,.09) 46%,transparent 72%);filter:blur(8px);opacity:.72}
        .tool-entry:hover .tool-device-art{transform:translateY(-5px) scale(1.055)}
        .tool-entry-copy{display:flex;flex-direction:column;align-items:flex-start;min-width:0}
        .tool-event{color:var(--brass);font-size:10px;margin-bottom:8px}
        .tool-entry-copy strong{font-size:clamp(19px,2.5vw,28px);letter-spacing:.07em;color:var(--parchment)}
        .tool-description{margin-top:9px;color:var(--parchment-dim);font-size:15px;line-height:1.55;max-width:62ch}
        .tool-entry-meta{display:flex;flex-direction:column;align-items:flex-end;gap:12px;color:var(--brass);font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
        .tool-entry-meta b{font-size:24px;font-family:var(--font-body);font-weight:400;color:var(--gold-hot)}
        .tools-empty{min-height:200px;border-top:1px solid var(--edge);border-bottom:1px solid var(--edge);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--t-muted)}
        .tools-empty>span{color:var(--brass);font-size:38px}
        .tools-empty h3{color:var(--parchment);margin:10px 0 4px;letter-spacing:.06em}
        .tools-empty p{margin:0}
        @media(max-width:700px){
          .tool-entry{grid-template-columns:92px minmax(0,1fr);gap:18px;padding-block:22px}
          .tool-entry-meta{grid-column:2;align-items:flex-start;flex-direction:row}
          .tool-device{height:104px}
          .tool-device-art{width:92px;height:92px}
          .tool-entry:hover{padding-inline:8px}
        }
      `}</style>
    </section>
  );
}
