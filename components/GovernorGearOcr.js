'use client';

import { useRef, useState } from 'react';

/**
 * Upload a full Governor Profile screenshot.
 * Applies OCR results for Governor Gear (6 pieces) and Charms (up to 18 levels).
 * Charm levels follow https://kingshotoptimizer.com/charms/references/ (Level 1–22).
 *
 * onApply({ gear, charms }) — both are partial selection maps keyed by form slots.
 */
export default function GovernorGearOcr({ onApply }) {
  const inputRef = useRef(null);
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  async function scan(event) {
    const image = event.target.files?.[0];
    if (!image) return;
    setState('loading');
    setMessage('Reading Governor Gear and Charm levels from your screenshot…');

    try {
      const body = new FormData();
      body.append('image', image);
      const response = await fetch('/api/governor-gear-ocr', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The screenshot could not be read.');

      const gear = result.gear || result.selections || {};
      const charms = result.charms || {};
      onApply({ gear, charms });

      const gearCount = result.gearCount ?? Object.keys(gear).length;
      const charmCount = result.charmCount ?? Object.keys(charms).length;
      const lowerConfidence = (result.review || []).filter(
        (item) => item.confidence !== null && item.confidence !== undefined && item.confidence < 0.8,
      ).length;

      const parts = [];
      if (gearCount) parts.push(`${gearCount} gear piece${gearCount === 1 ? '' : 's'}`);
      if (charmCount) parts.push(`${charmCount} charm level${charmCount === 1 ? '' : 's'}`);
      const summary = parts.length ? parts.join(' and ') : 'readings';

      setState(lowerConfidence ? 'review' : 'success');
      setMessage(
        lowerConfidence
          ? `Imported ${summary}. Please double-check ${lowerConfidence} uncertain reading${lowerConfidence === 1 ? '' : 's'}.`
          : `Imported ${summary}. Please verify them before submitting.`,
      );
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'The screenshot could not be read.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className={`gear-ocr-panel ${state}`}>
      <div>
        <strong>Upload Screenshot</strong>
        <p>
          Upload the full, uncropped Governor Profile screen. We read all six Governor Gear pieces
          and Charm levels (Level 1–22, per the Kingshot Optimizer charm reference). PNG, JPEG, or WebP; up to 8 MB.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={scan}
        hidden
      />
      <button
        type="button"
        className="gear-ocr-button"
        onClick={() => inputRef.current?.click()}
        disabled={state === 'loading'}
      >
        {state === 'loading' ? 'Scanning…' : state === 'error' ? 'Try another screenshot' : 'Upload screenshot'}
      </button>
      {message && (
        <p className="gear-ocr-status" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
