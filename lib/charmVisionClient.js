/**
 * Client-side charm vision for Governor Profile screenshots.
 *
 * Shape ladder & card art from Kingshot Optimizer:
 *   https://kingshotoptimizer.com/charms/references/
 *   https://kingshotoptimizer.com/images/charms-cards/{infantry|cavalry|archery}_lvl{1-22}.webp
 *
 * Official silhouette progression (same for all troops):
 *   L1 triangle · L2 hex · L3 cut-hex · L4 diamond · L5 tri-shield
 *   L6 pentagon · L7 shield · L8 point-diamond · L9 round-diamond
 *   L10 circle+icon · L11 plain circle · L12 crystal · L13+ ornate/framed
 *
 * Card metrics (avg across troops):
 *   L4 diamond fill≈0.93 · L5 tri-shield fill≈0.66
 *   L10 circle+icon · L11 plain circle (separated on profile by center shading)
 */

/** Official level → shape class (from Optimizer card art). */
export const CHARM_LEVEL_SHAPE = {
  1: 'triangle',
  2: 'hex',
  3: 'cut_hex',
  4: 'diamond',
  5: 'tri_shield',
  6: 'pentagon',
  7: 'shield',
  8: 'point_diamond',
  9: 'round_diamond',
  10: 'circle_icon',
  11: 'circle',
  12: 'crystal',
  13: 'crystal_base',
  14: 'shield_base',
  15: 'shield_base',
  16: 'ornate_shield',
  17: 'ornate_shield',
  18: 'winged_shield',
  19: 'framed_hex',
  20: 'gold_winged',
  21: 'gold_winged',
  22: 'gold_winged',
};

/** Relative gem centers on a full portrait Governor Profile. */
const GEM_LAYOUT = [
  ['cavalry', 1, 0.117, 0.286],
  ['cavalry', 2, 0.165, 0.286],
  ['cavalry', 3, 0.213, 0.286],
  ['cavalry', 4, 0.786, 0.286],
  ['cavalry', 5, 0.832, 0.286],
  ['cavalry', 6, 0.882, 0.286],
  ['infantry', 1, 0.054, 0.400],
  ['infantry', 2, 0.100, 0.400],
  ['infantry', 3, 0.146, 0.400],
  ['infantry', 4, 0.854, 0.400],
  ['infantry', 5, 0.900, 0.400],
  ['infantry', 6, 0.946, 0.400],
  ['archer', 1, 0.120, 0.508],
  ['archer', 2, 0.166, 0.508],
  ['archer', 3, 0.213, 0.508],
  ['archer', 4, 0.787, 0.509],
  ['archer', 5, 0.834, 0.509],
  ['archer', 6, 0.880, 0.509],
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

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumX = 0;
  let sumY = 0;
  for (const p of pixels) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    sumR += p.r;
    sumG += p.g;
    sumB += p.b;
    sumX += p.x;
    sumY += p.y;
  }
  const n = pixels.length;
  const cx_ = sumX / n;
  const cy_ = sumY / n;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const fill = n / (bw * bh);

  let maxd = 0;
  const dists = pixels.map((p) => {
    const d = Math.hypot(p.x - cx_, p.y - cy_);
    if (d > maxd) maxd = d;
    return d;
  });
  maxd = maxd || 1;

  let innerSum = 0;
  let innerN = 0;
  let outerSum = 0;
  let outerN = 0;
  for (let i = 0; i < pixels.length; i += 1) {
    if (dists[i] < 0.35 * maxd) {
      innerSum += pixels[i].gray;
      innerN += 1;
    } else {
      outerSum += pixels[i].gray;
      outerN += 1;
    }
  }
  const centerDark = innerN && outerN ? (outerSum / outerN) - (innerSum / innerN) : 0;

  return {
    r: sumR / n,
    g: sumG / n,
    b: sumB / n,
    n,
    fill,
    centerDark,
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

/**
 * Detect charm levels from a Governor Profile image.
 * Returns form selections keyed like infantry_1 → "Level 11".
 */
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

  // Circle family (L10 / L11): adaptive centerDark split per troop
  // Optimizer: L10 = circle+icon, L11 = plain circle.
  // On profile gems, plain (L11) shows higher centerDark than icon (L10).
  for (const troop of ['infantry', 'archer']) {
    const gems = readings.filter((r) => r.troop === troop);
    if (!gems.length) continue;
    const mid = median(gems.map((g) => g.centerDark));
    for (const g of gems) {
      const level = g.centerDark >= mid ? 11 : 10;
      const key = `${troop}_${g.index}`;
      selections[key] = `Level ${level}`;
      review.push({
        kind: 'charm',
        slot: key,
        value: selections[key],
        shape: CHARM_LEVEL_SHAPE[level],
        confidence: 0.78,
      });
    }
  }

  // Diamond / tri-shield family (L4 / L5) for cavalry
  // Optimizer cards: L4 fill≈0.93, L5 fill≈0.66 → lowest fill among set is L5.
  const cav = readings.filter((r) => r.troop === 'cavalry');
  if (cav.length) {
    const l5 = cav.reduce((best, g) => (g.fill < best.fill ? g : best), cav[0]);
    for (const g of cav) {
      const level = g.index === l5.index ? 5 : 4;
      const key = `cavalry_${g.index}`;
      selections[key] = `Level ${level}`;
      review.push({
        kind: 'charm',
        slot: key,
        value: selections[key],
        shape: CHARM_LEVEL_SHAPE[level],
        confidence: level === 5 ? 0.55 : 0.72,
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
