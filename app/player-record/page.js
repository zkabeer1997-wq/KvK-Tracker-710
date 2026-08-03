import { getBlocks, checkIsAdmin } from '../../lib/contentBlocks';
import EditableSection from '../../components/EditableSection';
import PlayerRecordGate from './PlayerRecordGate';

export const metadata = {
title: 'K710 Rallies',
};

export default async function PlayerRecordPage() {
const [blocks, isAdmin] = await Promise.all([
getBlocks('player-record-banner'),
checkIsAdmin(),
]);
const banner = (
<EditableSection page="player-record-banner" initialBlocks={blocks} isAdmin={isAdmin} as="div" className="card-header" />
);
return <PlayerRecordGate banner={banner} />;
}
