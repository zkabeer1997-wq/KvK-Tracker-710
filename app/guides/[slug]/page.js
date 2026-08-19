import { cookies } from 'next/headers';
import GuideArticle from './GuideArticle';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';
import { ADMIN_COOKIE_NAME, computeAdminToken } from '../../../lib/adminAuth';

export const metadata = {
  title: 'Kingdom Guide | K710',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadGuide(slug) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('kingdom_guides')
    .select('slug, title, category, description, body, position, is_published, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function getAdminState() {
  const cookie = cookies().get(ADMIN_COOKIE_NAME);
  const expected = await computeAdminToken();
  return Boolean(cookie && expected && cookie.value === expected);
}

export default async function GuidePage({ params, searchParams }) {
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';

  let guide = null;
  let loadError = '';
  let isAdmin = false;

  try {
    [guide, isAdmin] = await Promise.all([loadGuide(slug), getAdminState()]);
  } catch (error) {
    console.error('guide page load failed', error);
    loadError = 'Unable to load this guide.';
  }

  if (guide && !guide.is_published && !isAdmin) {
    guide = null;
  }

  return (
    <GuideArticle
      slug={slug}
      memberId={memberId}
      initialGuide={guide}
      initialIsAdmin={isAdmin}
      initialError={loadError}
    />
  );
}
