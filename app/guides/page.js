import Link from 'next/link';
import { createAdminSupabaseClient } from '../../lib/adminSupabase';

export const metadata = {
  title: 'K710 Guides',
  description: 'Kingdom 710 strategy, event, and member guides.',
};

export const dynamic = 'force-dynamic';

function GuideIcon({ index }) {
  const marks = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  return (
    <span className="guide-device" aria-hidden="true">
      <svg className="guide-book" viewBox="0 0 120 120">
        <defs>
          <linearGradient id={`guideLeather${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6e5430" />
            <stop offset="55%" stopColor="#382818" />
            <stop offset="100%" stopColor="#1c160f" />
          </linearGradient>
        </defs>
        <path d="M27 18 H88 C95 18 100 23 100 30 V92 C100 98 95 102 89 102 H27 C22 102 18 98 18 93 V27 C18 22 22 18 27 18 Z" fill={`url(#guideLeather${index})`} stroke="#b78c42" strokeWidth="2.5" />
        <path d="M29 25 H88 C91 25 93 27 93 30 V91 C93 94 91 96 88 96 H29 Z" fill="none" stroke="rgba(226,190,110,.42)" strokeWidth="1.5" />
        <path d="M29 18 V102" stroke="#c69a4b" strokeWidth="5" opacity=".55" />
        <path d="M43 42 H80 M43 55 H80 M43 68 H72" stroke="#d6bc82" strokeWidth="3" strokeLinecap="round" opacity=".65" />
        <circle cx="61" cy="82" r="11" fill="#21180f" stroke="#c9a44e" strokeWidth="2" />
        <text x="61" y="86" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fill="#e7c978">{marks[index % marks.length]}</text>
      </svg>
      <span className="guide-device-glow" />
    </span>
  );
}

async function loadGuides() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('kingdom_guides')
    .select('slug, title, category, description, position, updated_at')
    .eq('is_published', true)
    .order('position', { ascending: true })
    .order('title', { ascending: true });
  if (error) throw error;
  return data || [];
}

export default async function GuidesPage({ searchParams }) {
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';
  const backHref = memberId ? `/player-record?member_id=${encodeURIComponent(memberId)}` : '/player-record';

  let guides = [];
  let loadError = '';
  try {
    guides = await loadGuides();
  } catch (error) {
    console.error('guides page load failed', error);
    loadError = 'The library could not be opened right now.';
  }

  return (
    <main className="armory guides-library">
      <div className="armory-atmos" aria-hidden="true" />
      <span className="armory-rack-l guide-shelf-l" aria-hidden="true" />
      <span className="armory-rack-r guide-shelf-r" aria-hidden="true" />

      <div className="armory-inner guides-library-inner">
        <header className="armory-head guides-library-head">
          <span className="k-mark">Kingdom 710 Library</span>
          <h1 className="k-display armory-title">Guides</h1>
          <p className="k-narrative armory-lede">Choose a volume from the kingdom library. Every guide opens on its own page and can be maintained by kingdom administration.</p>
        </header>

        {loadError ? (
          <div className="guides-error k-narrative">{loadError}</div>
        ) : (
          <div className="guides-directory" role="list">
            {guides.map((guide, index) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}${query}`} className="guide-entry" role="listitem">
                <GuideIcon index={index} />
                <span className="guide-entry-copy">
                  <span className="k-mark guide-category">{guide.category}</span>
                  <strong className="k-display">{guide.title}</strong>
                  <span className="k-narrative guide-description">{guide.description}</span>
                </span>
                <span className="guide-entry-meta">
                  <span>Read Guide</span>
                  <b aria-hidden="true">→</b>
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="guides-ledger">
          <span className="k-mark">Library Ledger</span>
          <p className="k-narrative">Guide text is stored separately from the site code. When an administrator is signed in, each individual guide page becomes editable without a redeploy.</p>
        </div>

        <Link href={backHref} className="guides-back">← Return to member hall</Link>
      </div>

      <style>{`
        .guides-library{color:var(--parchment)}
        .guides-library-inner{width:min(1040px,100%)}
        .guides-library-head{margin-bottom:clamp(34px,6vh,62px)}
        .guides-directory{border-top:1px solid var(--edge)}
        .guide-entry{display:grid;grid-template-columns:150px minmax(0,1fr) 112px;gap:26px;align-items:center;min-height:190px;padding:26px 6px;text-decoration:none;color:inherit;border-bottom:1px solid var(--edge);transition:background var(--t-ui) ease,padding var(--t-ui) var(--ease-cine)}
        .guide-entry:hover,.guide-entry:focus-visible{background:rgba(201,164,78,.055);padding-inline:18px;outline:none}
        .guide-device{height:142px;position:relative;display:grid;place-items:center;isolation:isolate}
        .guide-book{position:relative;z-index:2;width:126px;height:126px;filter:drop-shadow(0 12px 9px rgba(0,0,0,.58));transition:transform var(--t-ui) var(--ease-cine),filter var(--t-ui) ease}
        .guide-device-glow{position:absolute;z-index:1;width:92px;height:92px;border-radius:50%;background:radial-gradient(circle,rgba(213,170,83,.18),rgba(101,71,34,.08) 48%,transparent 72%);filter:blur(8px);opacity:.66;transition:opacity var(--t-ui) ease,transform var(--t-ui) var(--ease-cine)}
        .guide-entry:hover .guide-book,.guide-entry:focus-visible .guide-book{transform:translateY(-5px) rotate(-2deg) scale(1.045);filter:drop-shadow(0 15px 11px rgba(0,0,0,.62)) drop-shadow(0 0 7px rgba(211,166,77,.22))}
        .guide-entry:hover .guide-device-glow,.guide-entry:focus-visible .guide-device-glow{opacity:1;transform:scale(1.12)}
        .guide-entry-copy{display:flex;flex-direction:column;align-items:flex-start;min-width:0}
        .guide-category{color:var(--brass);font-size:10px;margin-bottom:8px}
        .guide-entry-copy strong{font-size:clamp(19px,2.5vw,28px);letter-spacing:.07em;color:var(--parchment)}
        .guide-description{margin-top:9px;color:var(--parchment-dim);font-size:15px;line-height:1.55;max-width:62ch}
        .guide-entry-meta{display:flex;flex-direction:column;align-items:flex-end;gap:12px;color:var(--brass);font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
        .guide-entry-meta b{font-size:24px;font-family:var(--font-body);font-weight:400;color:var(--gold-hot)}
        .guides-ledger{margin-top:38px;padding-top:22px;border-top:1px solid rgba(201,164,78,.16);max-width:66ch}
        .guides-ledger p{margin:8px 0 0;color:var(--t-muted);font-size:14px}
        .guides-back{display:inline-block;margin-top:34px;color:var(--brass);font-family:var(--font-body);font-size:12px;text-decoration:none;letter-spacing:.06em}
        .guides-back:hover{color:var(--gold-hot)}
        .guides-error{padding:28px 0;border-block:1px solid var(--edge);color:var(--parchment-dim)}
        @media(max-width:700px){.guide-entry{grid-template-columns:92px minmax(0,1fr);gap:18px;padding-block:22px}.guide-entry-meta{grid-column:2;align-items:flex-start;flex-direction:row}.guide-device{height:104px}.guide-book{width:92px;height:92px}.guide-device-glow{width:70px;height:70px}.guide-entry:hover,.guide-entry:focus-visible{padding-inline:8px}.guides-library-inner{padding-top:86px}}
        @media(prefers-reduced-motion:reduce){.guide-entry,.guide-book,.guide-device-glow{transition:none}}
      `}</style>
    </main>
  );
}
