'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const NAV_GROUPS = [
  {
    label: 'Roster',
    items: [
      { href: '/admin/dashboard', label: 'Player Records', match: '/admin/dashboard' },
      { href: '/admin/dashboard/member-pins', label: 'Member Access', match: '/admin/dashboard/member-pins' },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      { href: '/admin/dashboard/interest', label: 'Transfer Requests', match: '/admin/dashboard/interest' },
    ],
  },
  {
    label: 'Events',
    items: [
      { href: '/admin/dashboard/prep-ministers', label: 'Prep Ministers', match: '/admin/dashboard/prep-ministers' },
      { href: '/admin/dashboard/flamedragon', label: 'Flamedragon Tyrant', match: '/admin/dashboard/flamedragon' },
    ],
  },
];

export default function AdminShell({ title, subtitle, actions, onLogout, counters = [], children }) {
  const pathname = usePathname();
  const currentDate = useMemo(() => new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date()), []);

  return (
    <div className="admin-shell warroom-ledger">
      <div className="warroom-atmos" aria-hidden="true" />

      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M20 3 L35 8 V19 C35 28 29 34 20 37 C11 34 5 28 5 19 V8 Z" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <div>
            <span className="admin-sidebar-brand-k">K710</span>
            <span className="admin-sidebar-brand-sub">War Room</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="War room sections">
          {NAV_GROUPS.map((group) => (
            <section className="admin-nav-group" key={group.label}>
              <span className="admin-nav-label">{group.label}</span>
              {group.items.map((item) => {
                const isActive = pathname === item.match;
                return (
                  <Link key={item.href} href={item.href} className={isActive ? 'active' : ''} aria-current={isActive ? 'page' : undefined}>
                    {item.label}
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-date"><strong>{currentDate}</strong><span>Current date</span></div>
          <Link href="/" className="admin-sidebar-view-site">View Public Site</Link>
          {onLogout && (
            <button type="button" className="admin-sidebar-logout" onClick={onLogout}>Log Out</button>
          )}
        </div>
      </aside>

      <div className="admin-content">
        <div className="warroom-tablelight" aria-hidden="true" />
        <header className="admin-topbar">
          <div>
            {subtitle && <span className="admin-topbar-kicker">{subtitle}</span>}
            <h1>{title}</h1>
          </div>
          {actions && <div className="admin-topbar-actions">{actions}</div>}
        </header>

        {counters.length > 0 && (
          <div className="warroom-counters" aria-label="Command summary">
            {counters.map((c) => (
              <div key={c.label} className="warroom-counter">
                <span className="warroom-counter-val">{c.value}</span>
                <span className="k-mark warroom-counter-label">{c.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="admin-content-body">{children}</div>
      </div>
    </div>
  );
}
