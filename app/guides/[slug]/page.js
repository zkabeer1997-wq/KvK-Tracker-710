import GuideArticle from './GuideArticle';

export const metadata = {
  title: 'Kingdom Guide | K710',
};

export const dynamic = 'force-dynamic';

export default function GuidePage({ params, searchParams }) {
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const memberId = typeof searchParams?.member_id === 'string' ? searchParams.member_id : '';
  return <GuideArticle slug={slug} memberId={memberId} />;
}
