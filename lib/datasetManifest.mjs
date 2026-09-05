export const DATASET_STATUS = Object.freeze({
  VERIFIED: 'verified', COMMUNITY: 'community-reported', EXPERIMENTAL: 'experimental', INCOMPLETE: 'incomplete',
});

export const DATASET_MANIFEST = Object.freeze({
  'governor-charm-costs': { name:'Governor Charm upgrade costs', source:'Existing K710 Hub dataset', lastVerified:null, status:DATASET_STATUS.INCOMPLETE, limitations:'Costs are retained from the existing implementation; original evidence and stat gains still require verification.', assumptions:[], experimental:[], version:'1.0.0' },
  'wavebound-treasures': { name:'Wavebound Tidal Treasure rewards', source:'Existing K710 Hub configuration', lastVerified:null, status:DATASET_STATUS.COMMUNITY, limitations:'Chest contents and the 75%/25% outcome are community-reported and should be checked against the current event.', assumptions:['Premium merge outcomes are independent binomial trials.'], experimental:[], version:'1.0.0' },
  'pet-pack-contents': {
    name: 'Pet pack contents',
    source: 'Existing K710 Hub configuration',
    lastVerified: null,
    status: DATASET_STATUS.INCOMPLETE,
    limitations: 'Existing values are retained, but their original evidence and verification date still need to be recorded.',
    assumptions: ['Each pack tier can be purchased once per week.'],
    experimental: [],
    version: '1.0.0',
  },
  'dragons-caravan': { name:"Dragon's Caravan shop and packs", source:'Existing K710 Hub configuration', lastVerified:null, status:DATASET_STATUS.INCOMPLETE, limitations:'Shop quantities are configurable. Value tiers are subjective guidance, not universal game value.', assumptions:['Value comparisons use editable community priorities.'], experimental:[], version:'1.0.0' },
  'adventure-stall': { name:'Adventure Stall shop and packs', source:'Existing K710 Hub configuration', lastVerified:null, status:DATASET_STATUS.INCOMPLETE, limitations:'Pack and shop quantities need dated source evidence for the current event version.', assumptions:['Daily pack limits reset once per event day.'], experimental:[], version:'1.0.0' },
  'academy-research': { name:'Academy Research costs', source:'https://kingshotoptimizer.com/data/academy-research/', lastVerified:'2026-09-03', status:DATASET_STATUS.VERIFIED, limitations:'Use only for game versions matching the retrieved dataset.', assumptions:[], experimental:[], version:'2026-09-03' },
  'war-academy-research': { name:'War Academy Research costs', source:'Existing imported reference dataset', lastVerified:'2026-09-03', status:DATASET_STATUS.VERIFIED, limitations:'Kingdom must have unlocked the selected tier.', assumptions:[], experimental:[], version:'2026-09-03' },
  'advanced-research': { name:'Advanced Research costs', source:'Existing imported reference dataset', lastVerified:'2026-09-03', status:DATASET_STATUS.VERIFIED, limitations:'Kingdom must have unlocked the selected tier.', assumptions:[], experimental:[], version:'2026-09-03' },
  'construction-costs': { name:'Construction costs', source:'https://kingshotoptimizer.com/calculators/buildings', lastVerified:'2026-09-03', status:DATASET_STATUS.VERIFIED, limitations:'Some prerequisite relationships remain incomplete and are disclosed in calculator warnings.', assumptions:[], experimental:[], version:'2026-09-03' },
});

export function getDataset(id) {
  const dataset = DATASET_MANIFEST[id];
  if (!dataset) throw new Error(`Unknown dataset: ${id}`);
  return dataset;
}
