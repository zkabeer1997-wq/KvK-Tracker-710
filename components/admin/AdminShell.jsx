'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Player Records', match: '/admin/dashboard' },
  { href: '/admin/dashboard/interest', label: 'Transfer Requests', match: '/admin/dashboard/interest' },
  { href: '/admin/dashboard/prep-ministers', label: 'Prep Ministers', match: '/admin/dashboard/prep-ministers' },
  { href: '/admin/dashboard/flamedragon', label: 'Flamedragon Tyrant', match: '/admin/dashboard/flamedragon' },
];

export default function AdminShell({ title, subtitle, actions, onLogout, children }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M20 3 L35 8 V19 C35 28 29 34 20 37 C11 34 5 28 5 19 V8 Z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <div>
            <span className="admin-sidebar-brand-k">K710</span>
            <span className="admin-sidebar-brand-sub">Command Hall</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Command Hall sections">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.match;
            return (
              <Link key={item.href} href={item.href} className={isActive ? 'active' : ''} aria-current={isActive ? 'page' : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-sidebar-view-site">View Public Site</Link>
          {onLogout && (
            <button type="button" className="admin-sidebar-logout" onClick={onLogout}>Log Out</button>
          )}
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <div>
            {subtitle && <span className="admin-topbar-kicker">{subtitle}</span>}
            <h1>{title}</h1>
          </div>
          {actions && <div className="admin-topbar-actions">{actions}</div>}
        </header>
        <div className="admin-content-body">{children}</div>
      </div>
    </div>
  );
}
