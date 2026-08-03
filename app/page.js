import EditableSection from '../components/EditableSection';
import { getBlocks, checkIsAdmin } from '../lib/contentBlocks';

export const metadata = {
  title: 'K710 Dashboard',
};

export default async function HomePage() {
  const [heroBlocks, scheduleBlocks, isAdmin] = await Promise.all([
    getBlocks('home-hero'),
    getBlocks('home-schedule'),
    checkIsAdmin(),
    ]);
  return (
    <main className="page public-page hub-page">
    <div className="home-shell">
    <EditableSection page="home-hero" initialBlocks={heroBlocks} isAdmin={isAdmin} as="section" className="hub-hero" />
    <EditableSection page="home-schedule" initialBlocks={scheduleBlocks} isAdmin={isAdmin} as="section" className="home-events-card" />
    </div>
    </main>
  );
}
