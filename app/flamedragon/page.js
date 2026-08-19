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
  const hasIntro = Array.isArray(blocks) && blocks.length > 0;
const intro = (hasIntro || isAdmin) ? (
<EditableSection page="flamedragon-intro" initialBlocks={blocks} isAdmin={isAdmin} as="section" className="armory-notice" />
) : null;
  return <FlamedragonClient intro={intro} />;
}
