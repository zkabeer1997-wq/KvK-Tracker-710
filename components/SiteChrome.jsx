'use client';

import { usePathname } from 'next/navigation';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Two routes deliberately opt out of the shared header/footer:
//
//   /gate              The full cinematic (moved here from "/" in PR 5).
//                       "A location, not a document" - full-bleed, no page
//                       chrome, by design.
//   /admin/dashboard*   AdminShell already renders a full sidebar shell on
//                       every page under here. A second top nav stacked
//                       above it would be redundant chrome on a working
//                       console, not navigation anyone needs.
//
// "/" used to be on this list too, when it was only the Gate scene. Now
// that PR 5 gives it real content, it needs the same wayfinding every
// other public page has - a visitor reading the homepage should be able
// to reach Guides or Tools without knowing to look for a hero CTA.
function wantsChrome(pathname) {
  if (pathname === '/gate') return false;
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
