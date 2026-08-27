import { Suspense } from 'react';
import GuideArticle from './GuideArticle';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

// Static generation with an on-demand fallback (dynamicParams defaults to
// true), rather than force-dynamic + revalidate=0. PUT /api/guides/[slug]
// already calls revalidatePath on both this route and /guides on every
// save, so a stale static page is never actually stale in practice.
//
// This page never calls cookies()/headers() - a route can't export
// generateStaticParams (a promise to prerender) and also read per-request
// cookies in the same render; Next throws DYNAMIC_SERVER_USAGE if it does.
// So the server-rendered pass always treats the visitor as anonymous and
// only ever fetches published guides. Admin capability (previewing and
// editing an unpublished guide) is upgraded client-side in GuideArticle,
// which calls the existing GET /api/guides/[slug] - already computing
// isAdmin per-request via isAdminRequest() - after mount. A published
// guide looks identical either way; an admin previewing an unpublished
// one sees a brief "not found" until that client fetch resolves, which is
// an acceptable cost for a rarely-used preview path in exchange for the
// public page being genuinely static.
export async function generateStaticParams() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kingdom_guides')
      .select('slug')
      .eq('is_published', true);
    if (error) throw error;
    return (data || []).map((g) => ({ slug: g.slug }));
  } catch (error) {
    // Build-time hiccup (or, in preview environments, no credentials at
    // all): fall back to fully on-demand rendering for every slug rather
    // than failing the whole build over pre-rendering an optimization.
    console.error('guides generateStaticParams failed', error);
    return [];
  }
}

async function loadPublishedGuides() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('kingdom_guides')
    .select('slug, title, category, description, body, position, is_published, created_at, updated_at')
    .eq('is_published', true)
    .order('position', { ascending: true })
    .order('title', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = typeof resolvedParams?.slug === 'string' ? resolvedParams.slug : '';
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from('kingdom_guides')
      .select('title, description, is_published')
      .eq('slug', slug)
      .maybeSingle();
    if (!data || !data.is_published) return { title: 'Kingdom Guide | K710' };
    return {
      title: data.title,
      description: data.description || undefined,
      openGraph: { title: data.title, description: data.description || undefined },
    };
  } catch {
    return { title: 'Kingdom Guide | K710' };
  }
}

// Reading searchParams in a page component forces per-request dynamic
// rendering, for the same reason cookies() does above - so member_id
// (used only to build "back to your member hall" links) is read
// client-side in GuideArticle via useSearchParams() instead of being
// threaded through here as a server prop.
export default async function GuidePage({ params }) {
  const resolvedParams = await params;
  const slug = typeof resolvedParams?.slug === 'string' ? resolvedParams.slug : '';

  let guide = null;
  let prev = null;
  let next = null;
  let loadError = '';

  try {
    const published = await loadPublishedGuides();
    const index = published.findIndex((g) => g.slug === slug);
    guide = index >= 0 ? published[index] : null;
    prev = index > 0 ? published[index - 1] : null;
    next = index >= 0 && index < published.length - 1 ? published[index + 1] : null;
  } catch (error) {
    console.error('guide page load failed', error);
    loadError = 'Unable to load this guide.';
  }

  return (
    <>
      {/* GuideArticle reads member_id via useSearchParams() (client-side,
          so the page above it can stay statically generated) - Next
          requires a Suspense boundary around any component that does,
          otherwise the whole route silently falls back to fully
          client-rendered instead of static + client-hydrated. */}
      <Suspense fallback={null}>
        <GuideArticle
          slug={slug}
          initialGuide={guide}
          initialIsAdmin={false}
          initialError={loadError}
          prev={prev}
          next={next}
        />
      </Suspense>
    </>
  );
}
