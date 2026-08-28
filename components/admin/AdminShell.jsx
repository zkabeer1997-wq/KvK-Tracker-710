'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Player Records', match: '/admin/dashboard' },
  { href: '/admin/dashboard/member-pins', label: 'Member PINs', match: '/admin/dashboard/member-pins' },
  { href: '/admin/dashboard/interest', label: 'Transfer Requests', match: '/admin/dashboard/interest' },
  { href: '/admin/dashboard/prep-ministers', label: 'Prep Ministers', match: '/admin/dashboard/prep-ministers' },
  { href: '/admin/dashboard/flamedragon', label: 'Flamedragon Tyrant', match: '/admin/dashboard/flamedragon' },
  { href: '/admin/dashboard/events', label: 'Events', match: '/admin/dashboard/events' },
  { href: '/admin/dashboard/alliances', label: 'Alliances', match: '/admin/dashboard/alliances' },
];

const MODE_KEY = 'k710-warroom-mode';

/**
 * THE WAR ROOM
 *
 * The admin shell is the command chamber. It offers two views so the room
 * never gets in the way of the work:
 *
 *   COMMAND — the war table: warm table light, brass counters, atmosphere.
 *   LEDGER  — dense operational mode for reviewing many rows quickly.
 *
 * The choice persists, so a returning admin lands where they actually work.
 * All page content is unchanged in both modes; only the room around it is.
 */
export default function AdminShell({ title, subtitle, actions, onLogout, counters = [], children }) {
  const pathname = usePathname();
  const [mode, setMode] = useState('ledger');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === 'command' || saved === 'ledger') setMode(saved);
    } catch {
      /* private mode */
    }
  }, []);

  function choose(next) {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      /* private mode */
    }
  }

  return (
    <div className={`admin-shell warroom-${mode}`}>
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
          <div className="warroom-modes" role="group" aria-label="War room view">
            <button
              type="button"
              className="warroom-mode"
              data-on={mode === 'command'}
              aria-pressed={mode === 'command'}
              onClick={() => choose('command')}
            >
              Command
            </button>
            <button
              type="button"
              className="warroom-mode"
              data-on={mode === 'ledger'}
              aria-pressed={mode === 'ledger'}
              onClick={() => choose('ledger')}
            >
              Ledger
            </button>
          </div>
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

        {/* Brass counters read off the same live data the tables use. */}
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
