import { getBlocks, checkIsAdmin } from '../../lib/contentBlocks';
import EditableSection from '../../components/EditableSection';
import PowerProfileClient from './PowerProfileClient';

export const metadata = {
title: 'K710 Power Profile',
};

export default async function PowerProfilePage() {
const [blocks, isAdmin] = await Promise.all([
getBlocks('power-profile-intro'),
checkIsAdmin(),
]);
const hasIntro = Array.isArray(blocks) && blocks.length > 0;
const intro = (hasIntro || isAdmin) ? (
<EditableSection page="power-profile-intro" initialBlocks={blocks} isAdmin={isAdmin} as="section" className="armory-notice" />
) : null;
return <PowerProfileClient intro={intro} />;
}
