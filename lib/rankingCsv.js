// Parses pasted/uploaded ranking data in "rank,name,value" form. A leading
// header row (first field not a number) is skipped automatically so pasting
// straight from a spreadsheet just works. Returns both the parsed rows and
// any line-level errors, so the admin UI can show exactly what's wrong
// instead of a single opaque failure.
export function parseRankingCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = line.split(',').map((p) => p.trim());
    const [rankRaw, name, valueRaw] = parts;

    if (index === 0 && !/^-?\d+$/.test(rankRaw || '')) {
      return; // header row, e.g. "rank,name,value"
    }

    if (!/^-?\d+$/.test(rankRaw || '')) {
      errors.push(`Line ${index + 1}: "${rankRaw || ''}" is not a valid rank.`);
      return;
    }
    if (!name) {
      errors.push(`Line ${index + 1}: missing name.`);
      return;
    }

    let value = null;
    if (valueRaw !== undefined && valueRaw !== '') {
      value = Number(valueRaw);
      if (!Number.isFinite(value)) {
        errors.push(`Line ${index + 1}: "${valueRaw}" is not a valid value.`);
        return;
      }
    }

    rows.push({ rank: Number(rankRaw), name, value });
  });

  rows.sort((a, b) => a.rank - b.rank);
  return { rows, errors };
}

// Compares a snapshot's rows against the previous snapshot of the same
// scope+metric, matching entries by name. `delta` is positive when a name
// moved up in rank (lower rank number), negative when it fell, null when the
// name wasn't present in the previous snapshot at all.
export function computeRankingDeltas(currentRows, previousRows) {
  const prevByName = new Map((previousRows || []).map((r) => [r.name, r]));
  return (currentRows || []).map((row) => {
    const prev = prevByName.get(row.name);
    return { ...row, delta: prev ? prev.rank - row.rank : null };
  });
}
