import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M20 3 L35 8 V19 C35 28 29 34 20 37 C11 34 5 28 5 19 V8 Z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <div>
            <span className="site-footer-name">Kingdom 710</span>
            <span className="site-footer-tag">Three alliances. One kingdom. KvK-first.</span>
          </div>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/chronometer">About</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/player-record">Members</Link>
          <Link href="/interest">Join K710</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </footer>
  );
}
