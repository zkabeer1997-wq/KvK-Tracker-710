import Image from 'next/image';
import Link from 'next/link';

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

const STATUS_TONE = {
  New: 'tool-badge-new',
  Available: 'tool-badge-available',
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
              <span className="tools-category-count">{tools.length} instrument{tools.length === 1 ? '' : 's'}</span>
            </div>

            {tools.length ? (
              <div className="tools-grid" role="list">
                {tools.map((tool) => (
                  <Link key={tool.key} href={`/tools/${tool.key}${query}`} className="tool-box" role="listitem">
                    <span className={`tool-box-badge ${STATUS_TONE[tool.status] || ''}`}>{tool.status}</span>
                    <span className="tool-box-icon" aria-hidden="true">
                      <span className="tool-box-icon-glow" />
                      <Image className="tool-box-icon-art" src={tool.icon} alt="" width={72} height={72} />
                    </span>
                    <span className="k-mark tool-box-event">{tool.event}</span>
                    <strong className="k-display tool-box-title">{tool.title}</strong>
                    <span className="tool-box-desc">{tool.description}</span>
                    <span className="tool-box-cta">Open tool <b aria-hidden="true">→</b></span>
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
        .tools-catalog{color:var(--parchment);display:flex;flex-direction:column;gap:8px}
        .tools-category-block+.tools-category-block{margin-top:40px;padding-top:36px;border-top:1px solid var(--edge)}
        .tools-category-head{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding-bottom:20px;position:relative}
        .tools-category-head h2{margin:4px 0 0;color:var(--parchment);font-size:clamp(22px,3.6vw,32px);letter-spacing:.08em}
        .tools-category-count{position:absolute;right:0;top:2px;color:var(--brass);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}

        .tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}

        .tool-box{
          position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;
          padding:28px 20px 24px;border:1px solid rgba(201,164,78,.24);border-radius:10px;
          background:linear-gradient(180deg,rgba(20,17,10,.7),rgba(9,10,18,.86));
          text-decoration:none;color:inherit;
          transition:transform .18s var(--ease-cine,ease),border-color .18s ease,box-shadow .18s ease,background .18s ease;
        }
        .tool-box:hover,.tool-box:focus-visible{
          transform:translateY(-4px);border-color:rgba(201,164,78,.7);outline:none;
          box-shadow:0 14px 30px rgba(0,0,0,.4),0 0 0 1px rgba(201,164,78,.2);
          background:linear-gradient(180deg,rgba(28,23,13,.82),rgba(11,12,21,.92));
        }
        .tool-box-badge{
          position:absolute;top:12px;right:12px;font-family:var(--font-mono);font-size:9.5px;font-weight:700;
          letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;
          background:rgba(201,164,78,.14);color:var(--brass);border:1px solid rgba(201,164,78,.3);
        }
        .tool-badge-new{background:rgba(65,164,255,.14);color:#7fbfff;border-color:rgba(65,164,255,.32)}
        .tool-badge-available{background:rgba(201,164,78,.14);color:var(--gold-hot);border-color:rgba(201,164,78,.32)}

        .tool-box-icon{position:relative;width:88px;height:88px;display:grid;place-items:center;margin-top:6px;isolation:isolate}
        .tool-box-icon-art{position:relative;z-index:2;object-fit:contain;filter:drop-shadow(0 10px 10px rgba(0,0,0,.55));transition:transform .2s var(--ease-cine,ease)}
        .tool-box-icon-glow{position:absolute;z-index:1;inset:6px;border-radius:50%;background:radial-gradient(circle,rgba(65,164,255,.2),rgba(201,164,78,.09) 46%,transparent 72%);filter:blur(8px);opacity:.72}
        .tool-box:hover .tool-box-icon-art{transform:translateY(-3px) scale(1.06)}

        .tool-box-event{color:var(--brass);font-size:10px;letter-spacing:.06em}
        .tool-box-title{font-size:clamp(16px,2vw,19px);letter-spacing:.04em;color:var(--parchment);line-height:1.25}
        .tool-box-desc{color:var(--parchment-dim);font-size:13px;line-height:1.55}
        .tool-box-cta{
          margin-top:auto;padding-top:10px;font-family:var(--font-mono);font-size:11px;font-weight:700;
          letter-spacing:.06em;text-transform:uppercase;color:var(--gold-hot);display:inline-flex;align-items:center;gap:6px;
        }
        .tool-box-cta b{font-family:var(--font-body);font-weight:400;font-size:14px;transition:transform .18s var(--ease-cine,ease)}
        .tool-box:hover .tool-box-cta b{transform:translateX(3px)}

        .tools-empty{min-height:160px;border:1px dashed var(--edge);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--t-muted);gap:4px}
        .tools-empty>span{color:var(--brass);font-size:32px}
        .tools-empty h3{color:var(--parchment);margin:6px 0 2px;letter-spacing:.06em;font-size:16px}
        .tools-empty p{margin:0;font-size:13px}

        @media(max-width:700px){
          .tools-category-head{padding-bottom:16px}
          .tools-category-count{position:static;order:-1}
          .tools-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
          .tool-box{padding:22px 14px 18px}
        }
      `}</style>
    </section>
  );
}
