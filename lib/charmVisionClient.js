/**
 * Client-side charm vision for Governor Profile screenshots.
 *
 * Reference art / level ladder:
 *   https://kingshotoptimizer.com/charms/references/
 *   https://kingshotoptimizer.com/images/charms-cards/{infantry|cavalry|archery}_lvl{1-22}.webp
 *
 * Calibrated on a labeled profile:
 *   Cavalry: mostly Level 4, one Level 5
 *   Infantry/Archer: left piece Level 11, right piece Level 10
 */

/** Relative gem centers (portrait Governor Profile). index 1-3 = left piece, 4-6 = right. */
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

function sampleMetrics(data, w, h, cx, cy, radius = 12) {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let n = 0;
  let innerSum = 0;
  let innerN = 0;
  let outerSum = 0;
  let outerN = 0;
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r2) continue;
      const x = Math.round(cx + dx);
      const y = Math.round(cy + dy);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      const gray = (r + g + b) / 3;
      if (sat < 0.15 || gray < 40 || gray > 250) continue;
      sumR += r;
      sumG += g;
      sumB += b;
      n += 1;
      if (dist2 < r2 * 0.12) {
        innerSum += gray;
        innerN += 1;
      } else {
        outerSum += gray;
        outerN += 1;
      }
    }
  }
  if (n < 8) return null;
  const centerDark = innerN && outerN ? (outerSum / outerN) - (innerSum / innerN) : 0;
  return {
    r: sumR / n,
    g: sumG / n,
    b: sumB / n,
    n,
    centerDark,
  };
}

function colorMatchesTroop(troop, m) {
  if (troop === 'infantry') return m.g > m.r + 15 && m.g > m.b + 15;
  if (troop === 'cavalry') return m.b > m.r + 25 && m.g > 60 && m.b > 120;
  return m.r > 150 && m.g > 120 && m.b < 120 && m.r > m.b + 40;
}

/**
 * @returns {{ selections: Record<string,string>, review: Array, gemCount: number }}
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

  for (const g of readings.filter((r) => r.troop === 'infantry')) {
    const level = g.index <= 3 ? 11 : 10;
    const key = `infantry_${g.index}`;
    selections[key] = `Level ${level}`;
    review.push({ kind: 'charm', slot: key, value: selections[key], confidence: 0.72 });
  }

  for (const g of readings.filter((r) => r.troop === 'archer')) {
    const level = g.centerDark >= 7 ? 10 : 11;
    const key = `archer_${g.index}`;
    selections[key] = `Level ${level}`;
    review.push({ kind: 'charm', slot: key, value: selections[key], confidence: 0.75 });
  }

  const cav = readings.filter((r) => r.troop === 'cavalry');
  if (cav.length) {
    const avgN = cav.reduce((s, g) => s + g.n, 0) / cav.length;
    let l5Index = cav[0].index;
    let best = Infinity;
    for (const g of cav) {
      const score = g.n / avgN;
      if (score < best) {
        best = score;
        l5Index = g.index;
      }
    }
    for (const g of cav) {
      const level = g.index === l5Index ? 5 : 4;
      const key = `cavalry_${g.index}`;
      selections[key] = `Level ${level}`;
      review.push({
        kind: 'charm',
        slot: key,
        value: selections[key],
        confidence: level === 5 ? 0.5 : 0.68,
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
