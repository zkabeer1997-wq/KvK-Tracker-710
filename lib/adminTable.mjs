export function searchRow(row, query, keys) {
  const words = String(query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = keys.map(key => Array.isArray(row[key]) ? row[key].join(' ') : String(row[key] ?? '')).join(' ').toLowerCase();
  return words.every(word => text.includes(word));
}
export function numericValue(value) {
  const text = String(value ?? '').replace(/,/g, '').trim();
  const match = text.match(/^([\d.]+)\s*([kmb])?$/i);
  return match ? Number(match[1]) * ({ k: 1e3, m: 1e6, b: 1e9 }[match[2]?.toLowerCase()] || 1) : 0;
}
export function compareValues(a, b, numeric = false) {
  if (numeric) return numericValue(a) - numericValue(b);
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}
