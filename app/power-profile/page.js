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
const intro = (
<EditableSection page="power-profile-intro" initialBlocks={blocks} isAdmin={isAdmin} as="section" className="public-intro power-intro" />
);
return <PowerProfileClient intro={intro} />;
}
