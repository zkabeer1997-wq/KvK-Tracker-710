import GateExperience from '../components/kingdom/world/GateExperience';

export const metadata = {
  title: { absolute: 'Kingdom 710 — The Gate' },
  description:
    'Three warbands. One unbroken watch. Kingdom 710 is a KvK-first Kingshot kingdom with round-the-clock Bear Hunt coverage.',
};

// The Gate is a location, not a document: it renders a full-bleed scene
// with no page chrome. All recruitment narrative now lives one road away,
// in the Chronometer Chamber.
export default function GatePage() {
  return <GateExperience />;
}
