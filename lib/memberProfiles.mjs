import { parseCharmSelections, parseGovernorGearSelections } from './powerProfiles.mjs';
import { GOVERNOR_GEAR_OPTIONS } from './equipmentOptions.mjs';
export function profileSummary(row) {
  const charms = Object.values(parseCharmSelections(row.charms)).map(value => Number(String(value).replace(/\D/g, '')) || 0);
  const gear = Object.values(parseGovernorGearSelections(row.governor_gear)).map(value => GOVERNOR_GEAR_OPTIONS.indexOf(value) + 1);
  return { ...row, charm_min: Math.min(...charms), gear_min: Math.min(...gear) };
}
