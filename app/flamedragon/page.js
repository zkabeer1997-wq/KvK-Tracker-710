import { getBlocks, checkIsAdmin } from '../../lib/contentBlocks';
import EditableSection from '../../components/EditableSection';
import FlamedragonClient from './FlamedragonClient';

export const metadata = {
  title: 'K710 Flamedragon Tyrant Form',
};

export default async function FlamedragonPage() {
  const [blocks, isAdmin] = await Promise.all([
    getBlocks('flamedragon-intro'),
    checkIsAdmin(),
  ]);
  const intro = (
    <EditableSection page="flamedragon-intro" initialBlocks={blocks} isAdmin={isAdmin} as="section" className="public-intro power-intro" />
  );
  return <FlamedragonClient intro={intro} />;
}
