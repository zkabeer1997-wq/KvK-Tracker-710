import { createAdminSupabaseClient } from '../../lib/adminSupabase';
import GuidesDirectory from './GuidesDirectory';

export const metadata = {
  title: 'K710 Guides',
  description: 'Kingdom 710 strategy, event, and member guides.',
};

// Static now, not force-dynamic: guides change when an admin saves one, and
// PUT /api/guides/[slug] already calls revalidatePath('/guides') on every
// save (app/api/guides/[slug]/route.js), so there is no window where a
// visitor sees stale content - the previous force-dynamic + noStore() paid
// a Supabase round trip on every single request for content that changes
// on the order of "whenever an admin edits a guide."
async function loadGuides() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('kingdom_guides')
    .select('slug, title, category, description, body, position, updated_at')
    .eq('is_published', true)
    .order('position', { ascending: true })
    .order('title', { ascending: true });

  if (error) throw error;
  return data || [];
}

export default async function GuidesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const memberId = typeof resolvedSearchParams?.member_id === 'string' ? resolvedSearchParams.member_id : '';
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
          <p className="k-narrative armory-lede">Choose a volume from the kingdom library. Every title below is read directly from the saved guide record.</p>
        </header>

        {loadError ? (
          <div className="guides-error k-narrative">{loadError}</div>
        ) : (
          <GuidesDirectory guides={guides} query={query} backHref={backHref} />
        )}
      </div>

      <style>{`
        .guides-library{color:var(--parchment)}
        .guides-library-inner{width:min(1040px,100%)}
        .guides-library-head{margin-bottom:clamp(34px,6vh,62px)}
        .guides-toolbar{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid var(--edge)}
        .guides-search{max-width:340px;flex:1 1 260px}
        .guides-categories{display:flex;flex-wrap:wrap;gap:8px}
        .guides-category-tab{padding:8px 14px;border:1px solid var(--edge);background:transparent;color:var(--t-muted);font-family:var(--font-body);font-size:12px;font-weight:700;letter-spacing:.04em;border-radius:999px;cursor:pointer;transition:border-color .16s,color .16s,background .16s}
        .guides-category-tab:hover{border-color:var(--gold-aged);color:var(--parchment)}
        .guides-category-tab.is-active{border-color:var(--gold-aged);background:rgba(201,164,78,.14);color:var(--gold-hot)}
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
        .guide-entry-sub{margin-top:8px;color:var(--t-muted);font-family:var(--font-mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}
        .guide-entry-meta{display:flex;flex-direction:column;align-items:flex-end;gap:12px;color:var(--brass);font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase}
        .guide-entry-meta b{font-size:24px;font-family:var(--font-body);font-weight:400;color:var(--gold-hot)}
        .guides-ledger{margin-top:38px;padding-top:22px;border-top:1px solid rgba(201,164,78,.16);max-width:66ch}
        .guides-ledger p{margin:8px 0 0;color:var(--t-muted);font-size:14px}
        .guides-back{display:inline-block;margin-top:34px;color:var(--brass);font-family:var(--font-body);font-size:12px;text-decoration:none;letter-spacing:.06em}
        .guides-back:hover{color:var(--gold-hot)}
        .guides-error{padding:28px 0;border-block:1px solid var(--edge);color:var(--parchment-dim)}
        @media(max-width:700px){.guide-entry{grid-template-columns:92px minmax(0,1fr);gap:18px;padding-block:22px}.guide-entry-meta{grid-column:2;align-items:flex-start;flex-direction:row}.guide-device{height:104px}.guide-book{width:92px;height:92px}.guide-device-glow{width:70px;height:70px}.guide-entry:hover,.guide-entry:focus-visible{padding-inline:8px}.guides-library-inner{padding-top:86px}.guides-toolbar{flex-direction:column;align-items:stretch}}
        @media(prefers-reduced-motion:reduce){.guide-entry,.guide-book,.guide-device-glow{transition:none}}
      `}</style>
    </main>
  );
}
