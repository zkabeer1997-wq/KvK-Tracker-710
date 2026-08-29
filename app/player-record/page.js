import { getBlocks, checkIsAdmin } from '../../lib/contentBlocks';
import EditableSection from '../../components/EditableSection';
import PlayerRecordGate from './PlayerRecordGate';
import KingshotLoginOverlay from './KingshotLoginOverlay';

export const metadata = {
  title: 'K710 KvK Availability',
  alternates: { canonical: '/player-record' },
};

export default async function PlayerRecordPage({ searchParams: searchParamsPromise }) {
  const [blocks, isAdmin, searchParams] = await Promise.all([
    getBlocks('player-record-banner'),
    checkIsAdmin(),
    searchParamsPromise,
  ]);
  const hasBanner = Array.isArray(blocks) && blocks.length > 0;
  const banner = (hasBanner || isAdmin) ? (
    <EditableSection page="player-record-banner" initialBlocks={blocks} isAdmin={isAdmin} as="div" className="gatehouse-notice" />
  ) : null;
  const next = typeof searchParams?.next === 'string' ? searchParams.next : '';
  return (
    <>
      <PlayerRecordGate banner={banner} next={next} />
      <KingshotLoginOverlay next={next} />
    </>
  );
}
