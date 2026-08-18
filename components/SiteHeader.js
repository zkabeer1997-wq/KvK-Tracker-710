'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/player-record', label: 'Members' },
  { href: '/interest', label: 'Request Entry' },
  { href: '/power-profile', label: 'War Ledger' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="site-brand-crest">
            <path d="M20 3 L35 8 V19 C35 28 29 34 20 37 C11 34 5 28 5 19 V8 Z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span>K710</span>
        </Link>

        <nav className="site-nav" aria-label="Main site">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'active' : ''}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admin" className="site-nav-admin">Admin</Link>
        </nav>

        <button
          type="button"
          className="site-nav-toggle"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {open && (
        <nav className="site-nav-mobile" aria-label="Mobile site">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={pathname === link.href ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
          <Link href="/admin" onClick={() => setOpen(false)} className="site-nav-admin">Admin</Link>
        </nav>
      )}
    </header>
  );
}
