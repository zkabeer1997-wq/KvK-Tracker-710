'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SUPPORT_URL } from '../lib/supportLink';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/guides', label: 'Guides' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/tools', label: 'Tools' },
];

function isAdminRole(role) {
  return role === 'admin' || role === 'superadmin';
}

function ProfileImage({ profile }) {
  const initial = (profile?.nickname || 'K').trim().charAt(0).toUpperCase();
  if (!profile?.avatarUrl) return <span className="site-profile-fallback">{initial}</span>;
  // The avatar URL is supplied by the verified Kingshot profile and is kept
  // as a normal image because its CDN hostname can change between accounts.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={profile.avatarUrl} alt={`${profile.nickname} profile`} />;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    async function refreshSession() {
      try {
        const response = await fetch('/api/session', { cache: 'no-store' });
        const data = await response.json();
        if (active) setProfile(data?.state === 'authenticated' ? data.profile : null);
      } catch {
        if (active) setProfile(null);
      }
    }
    refreshSession();
    window.addEventListener('k710-auth-changed', refreshSession);
    return () => {
      active = false;
      window.removeEventListener('k710-auth-changed', refreshSession);
    };
  }, []);

  useEffect(() => {
    function closeProfile(event) {
      if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('pointerdown', closeProfile);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeProfile);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    setProfile(null);
    setProfileOpen(false);
    setOpen(false);
    window.dispatchEvent(new Event('k710-auth-changed'));
    router.push('/');
    router.refresh();
  }

  function closeMenus() {
    setOpen(false);
    setProfileOpen(false);
  }

  const profileMenu = profile && (
    <div className="site-profile-menu" ref={profileMenuRef}>
      <button
        type="button"
        className="site-profile-trigger"
        aria-label={`Open account menu for ${profile.nickname}`}
        aria-expanded={profileOpen}
        aria-haspopup="menu"
        onClick={() => setProfileOpen((value) => !value)}
      >
        <span className="site-profile-avatar"><ProfileImage profile={profile} /></span>
        <span className="site-profile-chevron" aria-hidden="true">⌄</span>
      </button>
      {profileOpen && (
        <div className="site-profile-dropdown" role="menu">
          <div className="site-profile-identity">
            <strong>{profile.nickname}</strong>
            <span>#{profile.playerId} · Kingdom {profile.kingdomId}</span>
          </div>
          <Link href="/player-record" role="menuitem" onClick={closeMenus}>Member account</Link>
          {isAdminRole(profile.role) && (
            <Link href="/admin/dashboard/overview" role="menuitem" onClick={closeMenus}>
              Admin dashboard
            </Link>
          )}
          <button type="button" role="menuitem" onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  );

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" onClick={closeMenus}>
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
              className={isActive(link.href) ? 'active' : ''}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          {!profile && (
            <Link
              href="/player-record"
              className={isActive('/player-record') ? 'active' : ''}
              aria-current={isActive('/player-record') ? 'page' : undefined}
            >
              Login Member
            </Link>
          )}
          <Link href="/chronometer" className="site-nav-cta">Join K710</Link>
          <Link href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="site-nav-support">
            ☕ Support K710 Hub
          </Link>
        </nav>

        <div className="site-header-mobile-actions">
          {profileMenu}
          <button
            type="button"
            className="site-nav-toggle"
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {open && (
        <nav className="site-nav-mobile" aria-label="Mobile site">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenus} className={isActive(link.href) ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
          {!profile && (
            <Link href="/player-record" onClick={closeMenus} className={isActive('/player-record') ? 'active' : ''}>
              Login Member
            </Link>
          )}
          {profile && <Link href="/player-record" onClick={closeMenus}>Member account · {profile.nickname}</Link>}
          {profile && isAdminRole(profile.role) && (
            <Link href="/admin/dashboard/overview" onClick={closeMenus}>Admin dashboard</Link>
          )}
          <Link href="/chronometer" onClick={closeMenus} className="site-nav-cta">Join K710</Link>
          <Link
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenus}
            className="site-nav-support"
          >
            ☕ Support K710 Hub
          </Link>
          {profile && <button type="button" className="site-nav-mobile-logout" onClick={logout}>Log out</button>}
        </nav>
      )}
    </header>
  );
}
