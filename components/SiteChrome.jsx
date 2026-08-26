'use client';

import { usePathname } from 'next/navigation';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Two routes deliberately opt out of the shared header/footer:
//
//   /                  The Gate. Its own comment calls it "a location, not
//                       a document" - a full-bleed scene with no page
//                       chrome by design. PR 5 rebuilds its content; until
//                       then, wrapping it in chrome would just sandwich an
//                       empty scene between two bars.
//   /admin/dashboard*   AdminShell already renders a full sidebar shell on
//                       every page under here. A second top nav stacked
//                       above it would be redundant chrome on a working
//                       console, not navigation anyone needs.
//
// Everything else - guides, tools, member forms, /admin/login, the 404 -
// currently has no site-wide navigation at all beyond the floating
// CrestMenu, so this is a real, if unglamorous, win on its own.
function wantsChrome(pathname) {
  if (pathname === '/') return false;
  if (pathname.startsWith('/admin/dashboard')) return false;
  return true;
}

export default function SiteChrome({ children }) {
  const pathname = usePathname();

  // The "Skip to content" link used to live inside CrestMenu, which
  // rendered globally from RootLayout. Now that CrestMenu is scoped to
  // the Gate (see GateExperience.jsx), every other page needs its own
  // skip link - #main is rendered by this component either way, so this
  // is the one place that can own it without duplicating it per branch.
  const skipLink = <a href="#main" className="k-skip">Skip to content</a>;

  if (!wantsChrome(pathname)) {
    return (
      <>
        {skipLink}
        <div id="main">{children}</div>
      </>
    );
  }

  return (
    <>
      {skipLink}
      <SiteHeader />
      <div id="main">{children}</div>
      <SiteFooter />
    </>
  );
}
