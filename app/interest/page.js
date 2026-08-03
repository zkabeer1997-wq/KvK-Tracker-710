import EditableSection from '../../components/EditableSection';
import { getBlocks, checkIsAdmin } from '../../lib/contentBlocks';
import InterestForm from './InterestForm';

export const metadata = {
title: 'K710 Interest Form',
};

export default async function InterestPage() {
const [introBlocks, isAdmin] = await Promise.all([
getBlocks('interest-intro'),
checkIsAdmin(),
]);
return (
<main className="page public-page">
<div className="public-shell single-form">
<EditableSection page="interest-intro" initialBlocks={introBlocks} isAdmin={isAdmin} as="section" className="public-intro" />
<InterestForm />
</div>
</main>
);
}
