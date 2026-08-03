import Link from 'next/link';

export const metadata = {
title: 'K710 Dashboard',
};

export default function HomePage() {
return (
<main className="page public-page hub-page">
<div className="home-shell">
<nav className="home-menu-bar" aria-label="Main menu">
<Link href="/player-record">K710 Rallies</Link>
<Link href="/interest">K710 Interest</Link>
<Link href="/admin">Admin</Link>
</nav>
<section className="hub-hero">
<span className="public-kicker">K710 command center</span>
<h1>K710 Dashboard</h1>
<p>
Submit troop and power records, apply to transfer into K710, and manage rally
planning all from one place.
</p>
</section>
<section className="home-events-card" aria-label="Alliance event times">
<span className="public-kicker">Alliance schedule</span>
<h2>Alliance Event Times</h2>
<p className="hint">Coming soon.</p>
</section>
</div>
</main>
);
}
