import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="site-header">
    <div className="site-header-inner">
    <Link href="/" className="site-brand">K710</Link>
  <nav className="site-nav" aria-label="Main site">
    <Link href="/">Home</Link>
  <Link href="/player-record">Rallies</Link>
  <Link href="/interest">Interest</Link>
  <Link href="/admin">Admin</Link>
    </nav>
    </div>
    </header>
  );
}
