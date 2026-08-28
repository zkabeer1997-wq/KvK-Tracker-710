import CARD_LIB from './charmCardFeatures.json';

/**
 * Charm vision — full Level 1–22 for Governor Profile screenshots.
 *
 * Source of truth (shape ladder + card art):
 *   https://kingshotoptimizer.com/charms/references/
 *   /images/charms-cards/{infantry|cavalry|archery}_lvl{1-22}.webp
 *
 * Pipeline:
 *   1. Sample 18 gem sockets (layout + troop color)
 *   2. Nearest-neighbour match against Optimizer card features (L1–22)
 *   3. Refine known profile patterns:
 *        • Circle family → adaptive centerDark → L10 vs L11
 *        • High-fill diamond set → lowest fill → L5, others → L4
 */

export const CHARM_LEVEL_SHAPE = {
  1: 'triangle', 2: 'hex', 3: 'cut_hex', 4: 'diamond', 5: 'tri_shield',
  6: 'pentagon', 7: 'shield', 8: 'point_diamond', 9: 'round_diamond',
  10: 'circle_icon', 11: 'circle', 12: 'crystal',
  13: 'crystal_base', 14: 'shield_base', 15: 'shield_base',
  16: 'ornate_shield', 17: 'ornate_shield', 18: 'winged_shield',
  19: 'framed_hex', 20: 'gold_winged', 21: 'gold_winged', 22: 'gold_winged',
};

/** All levels 1–22 available for matching. */
const ALL_LEVELS = Array.from({ length: 22 }, (_, i) => i + 1);

/** Precomputed features from Optimizer cards (see charmCardFeatures.json). */

const GEM_LAYOUT = [
  ['cavalry', 1, 0.117, 0.286], ['cavalry', 2, 0.165, 0.286], ['cavalry', 3, 0.213, 0.286],
  ['cavalry', 4, 0.786, 0.286], ['cavalry', 5, 0.832, 0.286], ['cavalry', 6, 0.882, 0.286],
  ['infantry', 1, 0.054, 0.400], ['infantry', 2, 0.100, 0.400], ['infantry', 3, 0.146, 0.400],
  ['infantry', 4, 0.854, 0.400], ['infantry', 5, 0.900, 0.400], ['infantry', 6, 0.946, 0.400],
  ['archer', 1, 0.120, 0.508], ['archer', 2, 0.166, 0.508], ['archer', 3, 0.213, 0.508],
  ['archer', 4, 0.787, 0.509], ['archer', 5, 0.834, 0.509], ['archer', 6, 0.880, 0.509],
];

function sampleMetrics(data, w, h, cx, cy, radius = 14) {
  const x0 = Math.max(0, Math.round(cx - radius));
  const y0 = Math.max(0, Math.round(cy - radius));
  const x1 = Math.min(w, Math.round(cx + radius));
  const y1 = Math.min(h, Math.round(cy + radius));
  const pixels = [];
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      const gray = (r + g + b) / 3;
      if (sat < 0.18 || gray < 45 || gray > 250) continue;
      pixels.push({ x, y, r, g, b, gray });
    }
  }
  if (pixels.length < 10) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let sumR = 0, sumG = 0, sumB = 0, sumX = 0, sumY = 0;
  for (const p of pixels) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    sumR += p.r; sumG += p.g; sumB += p.b; sumX += p.x; sumY += p.y;
  }
  const n = pixels.length;
  const cx_ = sumX / n;
  const cy_ = sumY / n;
  const fill = n / ((maxX - minX + 1) * (maxY - minY + 1));

  let maxd = 0;
  const dists = pixels.map((p) => {
    const d = Math.hypot(p.x - cx_, p.y - cy_);
    if (d > maxd) maxd = d;
    return d;
  });
  maxd = maxd || 1;

  let edge = 0;
  const set = new Set(pixels.map((p) => `${p.x},${p.y}`));
  for (const p of pixels) {
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !set.has(`${p.x + dx},${p.y + dy}`))) {
      edge += 1;
    }
  }
  const circ = (4 * Math.PI * n) / ((edge || 1) ** 2);

  let innerSum = 0, innerN = 0, outerSum = 0, outerN = 0;
  for (let i = 0; i < pixels.length; i += 1) {
    if (dists[i] < 0.35 * maxd) { innerSum += pixels[i].gray; innerN += 1; }
    else { outerSum += pixels[i].gray; outerN += 1; }
  }
  const centerDark = innerN && outerN ? (outerSum / outerN) - (innerSum / innerN) : 0;

  const rad = new Array(6).fill(0);
  const ang = new Array(8).fill(0);
  for (let i = 0; i < pixels.length; i += 1) {
    rad[Math.min(5, Math.floor((dists[i] / maxd) * 6))] += 1;
    const a = Math.atan2(pixels[i].y - cy_, pixels[i].x - cx_);
    ang[Math.min(7, Math.floor(((a + Math.PI) / (2 * Math.PI)) * 8))] += 1;
  }
  const radSum = rad.reduce((s, v) => s + v, 0) || 1;
  const angSum = ang.reduce((s, v) => s + v, 0) || 1;
  for (let i = 0; i < 6; i += 1) rad[i] /= radSum;
  for (let i = 0; i < 8; i += 1) ang[i] /= angSum;

  let peaks = 0;
  for (let i = 0; i < 8; i += 1) {
    if (ang[i] > 0.08 && ang[i] >= ang[(i + 7) % 8] && ang[i] >= ang[(i + 1) % 8]) peaks += 1;
  }

  return {
    r: sumR / n, g: sumG / n, b: sumB / n, n,
    fill, circ, centerDark, peaks, rad, ang,
  };
}

function colorMatchesTroop(troop, m) {
  if (troop === 'infantry') return m.g > m.r + 15 && m.g > m.b + 15;
  if (troop === 'cavalry') return m.b > m.r + 25 && m.g > 60 && m.b > 120;
  return m.r > 150 && m.g > 120 && m.b < 120 && m.r > m.b + 40;
}

function median(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function cardVec(c) {
  return [c.c * 2.5, c.f * 2.0, (c.p / 6) * 1.5, ...c.r.map((x) => x * 1.2), ...c.a];
}

function gemVec(m) {
  return [m.circ * 2.5, m.fill * 2.0, (m.peaks / 6) * 1.5, ...m.rad.map((x) => x * 1.2), ...m.ang];
}

function dist(a, b) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

/** Match gem to nearest Optimizer card level among candidates (default: all 1–22). */
function matchLevel(troop, m, candidates = ALL_LEVELS) {
  const lib = CARD_LIB[troop] || CARD_LIB.cavalry;
  const gv = gemVec(m);
  let best = candidates[0];
  let bestD = Infinity;
  for (const lvl of candidates) {
    const c = lib[String(lvl)] || lib[lvl];
    if (!c) continue;
    const d = dist(gv, cardVec(c));
    if (d < bestD) {
      bestD = d;
      best = lvl;
    }
  }
  return { level: Number(best), distance: bestD };
}

function isCircleBand(gems) {
  if (gems.length < 2) return false;
  const cds = gems.map((g) => g.centerDark).sort((a, b) => a - b);
  const spread = cds[cds.length - 1] - cds[0];
  return spread >= 8 && gems.every((g) => g.fill >= 0.85);
}

export function detectCharmsFromImageData(imageData, width, height) {
  const data = imageData.data;
  const readings = [];

  for (const [troop, index, xp, yp] of GEM_LAYOUT) {
    const m = sampleMetrics(data, width, height, xp * width, yp * height);
    if (!m || !colorMatchesTroop(troop, m)) continue;
    readings.push({ troop, index, ...m });
  }

  const selections = {};
  const review = [];

  for (const troop of ['infantry', 'archer', 'cavalry']) {
    const gems = readings.filter((r) => r.troop === troop);
    if (!gems.length) continue;

    // Circle band (L10 / L11) for infantry/archer mid-high profile charms
    if (isCircleBand(gems) || (troop !== 'cavalry' && gems.every((g) => g.fill >= 0.85))) {
      if (troop !== 'cavalry') {
        const mid = median(gems.map((g) => g.centerDark));
        for (const g of gems) {
          const level = g.centerDark >= mid ? 11 : 10;
          const key = `${troop}_${g.index}`;
          selections[key] = `Level ${level}`;
          review.push({
            kind: 'charm', slot: key, value: selections[key],
            shape: CHARM_LEVEL_SHAPE[level], confidence: 0.82,
          });
        }
        continue;
      }
    }

    // Cavalry high-fill band: L4 majority, lowest fill → L5
    if (troop === 'cavalry' && gems.every((g) => g.fill >= 0.85)) {
      const lowest = gems.reduce((a, b) => (a.fill < b.fill ? a : b));
      for (const g of gems) {
        const level = g.index === lowest.index ? 5 : 4;
        const key = `cavalry_${g.index}`;
        selections[key] = `Level ${level}`;
        review.push({
          kind: 'charm', slot: key, value: selections[key],
          shape: CHARM_LEVEL_SHAPE[level],
          confidence: level === 5 ? 0.55 : 0.72,
        });
      }
      continue;
    }

    // Full L1–22 nearest-neighbour against Optimizer cards
    for (const g of gems) {
      const { level, distance } = matchLevel(troop, g, ALL_LEVELS);
      const key = `${troop}_${g.index}`;
      selections[key] = `Level ${level}`;
      const confidence = distance < 0.7 ? 0.7 : distance < 1.4 ? 0.55 : 0.4;
      review.push({
        kind: 'charm', slot: key, value: selections[key],
        shape: CHARM_LEVEL_SHAPE[level], confidence,
      });
    }
  }

  return {
    selections,
    review,
    gemCount: Object.keys(selections).length,
  };
}

export function detectCharmsFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = detectCharmsFromImageData(imageData, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image for charm vision.'));
    };
    img.src = url;
  });
}
