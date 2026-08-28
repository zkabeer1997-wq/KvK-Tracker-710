import { createAdminSupabaseClient } from '../lib/adminSupabase';

const BASE_URL = 'https://k710hub.vercel.app';

// Events and Tools are member-gated (proxy.js) - they intentionally do not
// appear here, in robots.js, or carry canonical/JSON-LD tags, since search
// engines can no longer reach them. Guides was gated the same way and then
// reverted to public (Addendum 2), so it's back below.
const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/alliances', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/guides', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/interest', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/player-record', priority: 0.5, changeFrequency: 'yearly' },
];

// Real lastmod per entry, not a single build timestamp reused everywhere -
// 846's sitemap (per the recon) has none at all. Each query failing
// independently still leaves the rest of the sitemap intact.
async function guideEntries() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kingdom_guides')
      .select('slug, updated_at')
      .eq('is_published', true);
    if (error) throw error;
    return (data || []).map((g) => ({
      url: `${BASE_URL}/guides/${g.slug}`,
      lastModified: g.updated_at ? new Date(g.updated_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

async function allianceEntries() {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('alliances')
      .select('tag, updated_at')
      .eq('active', true);
    if (error) throw error;
    return (data || []).map((a) => ({
      url: `${BASE_URL}/alliances/${a.tag.toLowerCase()}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const [guides, alliances] = await Promise.all([guideEntries(), allianceEntries()]);

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [...staticEntries, ...guides, ...alliances];
}
