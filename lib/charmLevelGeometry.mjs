/**
 * Charm level shape geometry — Kingshot Optimizer reference ladder
 * (https://kingshotoptimizer.com/charms/references/, levels 1-22),
 * transcribed by hand from reference screenshots the site's owner sent
 * directly, since this environment cannot fetch the site itself.
 *
 * This replaces the old charmCardFeatures.json, whose numbers were a
 * tell: infantry/cavalry/archer carried near-identical, independently
 * jittered values at every level (e.g. Level 2 circularity of 1.053 /
 * 1.051 / 1.053) — the signature of a formula generating "plausible"
 * per-troop noise, not three colors of the same real card measured
 * separately. Shape doesn't actually vary by troop in-game (only tint
 * does, handled separately by colorMatchesTroop in charmVisionClient.js),
 * so there was never a reason for three copies in the first place.
 *
 * What's stored per level below IS real, human-verified information:
 * the vertex count, aspect ratio, and rough fill of each level's icon,
 * plus the material tier the ladder visibly steps through (plain green
 * gem → green gaining bronze trim → silver ornate frame → gold winged).
 * The feature vector actually used for matching (levelFeatureVector) is
 * then derived from that with real polygon geometry — the isoperimetric
 * circularity formula for a regular n-gon, not another arbitrary
 * constant — rather than typed in by hand a second time.
 *
 * This is still an approximation of how these gems render in a real,
 * compressed, glare-lit screenshot, not a measurement of one. Matching
 * against hand-transcribed reference art has a real accuracy ceiling;
 * see the comment in charmVisionClient.js for what would remove it.
 */

export const CHARM_TIERS = ['green', 'bronze', 'silver', 'gold'];

// vertices: approximate polygon side count of the gem's silhouette.
// aspect: bounding-box height/width (1 = roughly square/round).
// fill: fraction of that bounding box the gem actually covers — solid
//   faceted or circular gems run high (0.85+); pointed/star shapes with
//   a lot of negative space between facets run low (0.45-0.65).
// tier: the material band visible on the reference ladder.
export const CHARM_LEVEL_GEOMETRY = {
  1: { shape: 'triangle', vertices: 3, aspect: 1.10, fill: 0.50, tier: 'green' },
  2: { shape: 'hex', vertices: 6, aspect: 1.00, fill: 0.90, tier: 'green' },
  3: { shape: 'cut_hex', vertices: 4, aspect: 1.35, fill: 0.55, tier: 'green' },
  4: { shape: 'diamond', vertices: 4, aspect: 1.00, fill: 0.90, tier: 'green' },
  5: { shape: 'tri_shield', vertices: 5, aspect: 1.15, fill: 0.55, tier: 'green' },
  6: { shape: 'pentagon', vertices: 5, aspect: 1.00, fill: 0.68, tier: 'green' },
  7: { shape: 'shield', vertices: 6, aspect: 1.25, fill: 0.72, tier: 'green' },
  8: { shape: 'point_diamond', vertices: 4, aspect: 1.50, fill: 0.50, tier: 'green' },
  9: { shape: 'round_diamond', vertices: 8, aspect: 1.00, fill: 0.80, tier: 'green' },
  10: { shape: 'circle_icon', vertices: 16, aspect: 1.00, fill: 0.90, tier: 'green' },
  11: { shape: 'circle', vertices: 16, aspect: 1.00, fill: 0.92, tier: 'green' },
  12: { shape: 'crystal', vertices: 4, aspect: 1.30, fill: 0.60, tier: 'green' },
  13: { shape: 'crystal_base', vertices: 5, aspect: 1.60, fill: 0.55, tier: 'green' },
  14: { shape: 'shield_base', vertices: 6, aspect: 1.60, fill: 0.62, tier: 'bronze' },
  15: { shape: 'shield_base', vertices: 6, aspect: 1.60, fill: 0.65, tier: 'bronze' },
  16: { shape: 'ornate_shield', vertices: 8, aspect: 1.30, fill: 0.60, tier: 'silver' },
  17: { shape: 'ornate_shield', vertices: 8, aspect: 1.30, fill: 0.62, tier: 'silver' },
  18: { shape: 'winged_shield', vertices: 10, aspect: 1.20, fill: 0.55, tier: 'silver' },
  19: { shape: 'framed_hex', vertices: 6, aspect: 1.00, fill: 0.78, tier: 'silver' },
  20: { shape: 'gold_winged', vertices: 11, aspect: 1.20, fill: 0.53, tier: 'gold' },
  21: { shape: 'gold_winged', vertices: 12, aspect: 1.20, fill: 0.52, tier: 'gold' },
  22: { shape: 'gold_winged', vertices: 12, aspect: 1.15, fill: 0.50, tier: 'gold' },
};

/** Isoperimetric circularity of a regular n-gon (4π·Area/Perimeter²; 1 = a circle). */
function regularPolygonCircularity(n) {
  const t = Math.PI / n;
  return t / Math.tan(t);
}

/** Angular local-maxima an 8-bin histogram can realistically resolve for an n-vertex shape.
 *  Real 8-bin sampling of a noisy, small on-screen gem can't cleanly separate more than
 *  ~4 lobes regardless of true vertex count, so this tapers rather than tracking n 1:1. */
function expectedPeaks(n) {
  if (n <= 4) return n;
  if (n <= 6) return 3;
  return 2;
}

/** Radial histogram (6 bins, center → edge). A solid disc's ring areas grow as (2i+1), so a
 *  fully-filled shape's mass increases steadily outward; low-fill shapes (thin pointed facets)
 *  push relatively more of their mass into the outer bins, since what little area they have
 *  sits at the tips, not the center. */
function radialProfile(fill) {
  const base = [1, 3, 5, 7, 9, 11];
  const skewed = base.map((v, i) => v * (1 + (1 - fill) * (i / 5)));
  const sum = skewed.reduce((s, v) => s + v, 0);
  return skewed.map((v) => v / sum);
}

/** Angular histogram (8 bins) with `vertices` evenly-spaced lobes (capped at 8, one per bin). */
function angularProfile(vertices) {
  const lobes = Math.max(1, Math.min(vertices, 8));
  const bins = new Array(8).fill(0);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * 2 * Math.PI;
    const nearestLobe = Math.round((angle / (2 * Math.PI)) * lobes) % lobes;
    const lobeAngle = (nearestLobe / lobes) * 2 * Math.PI;
    let d = Math.abs(angle - lobeAngle);
    if (d > Math.PI) d = 2 * Math.PI - d;
    bins[i] = 1 + Math.max(0, 1 - d / (Math.PI / lobes));
  }
  const sum = bins.reduce((s, v) => s + v, 0);
  return bins.map((v) => v / sum);
}

/** Build the {c,f,p,r,a} feature vector charmVisionClient.js matches sampled gems against. */
export function levelFeatureVector(level) {
  const g = CHARM_LEVEL_GEOMETRY[level];
  if (!g) return null;
  return {
    c: Math.min(1, regularPolygonCircularity(g.vertices) / g.aspect),
    f: g.fill,
    p: expectedPeaks(g.vertices),
    r: radialProfile(g.fill),
    a: angularProfile(g.vertices),
    tier: g.tier,
  };
}
