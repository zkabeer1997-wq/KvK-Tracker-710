import GateExperience from '../../components/kingdom/world/GateExperience';

export const metadata = {
  title: 'The Gate',
  description: 'Enter Kingdom 710 through the Gate — choose your road into the realm.',
  alternates: { canonical: '/gate' },
};

// The full cinematic that used to live at "/". It still renders with no
// page chrome (see components/SiteChrome.jsx's exclusion list) - that
// full-bleed, no-nav treatment is exactly right for a deliberately-visited
// scene, just not for the front door every new visitor and every crawler
// lands on first. Reached from a link in the homepage hero, not a forced
// redirect: an unskippable interstitial in front of a page that finally
// has real content would undo the point of rebuilding it.
export default function GatePage() {
  return <GateExperience />;
}
