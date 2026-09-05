export const DATASET_STATUS = Object.freeze({
  VERIFIED: 'verified', COMMUNITY: 'community-reported', EXPERIMENTAL: 'experimental', INCOMPLETE: 'incomplete',
});

export const DATASET_MANIFEST = Object.freeze({
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
});

export function getDataset(id) {
  const dataset = DATASET_MANIFEST[id];
  if (!dataset) throw new Error(`Unknown dataset: ${id}`);
  return dataset;
}
