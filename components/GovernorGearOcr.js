'use client';

import { useRef, useState } from 'react';

/**
 * Upload a full Governor Profile screenshot.
 * Governor Gear (6 pieces) is read via Kingshot Optimizer OCR.
 * Charm *levels* are not printed as numbers on the profile overview — only
 * troop-colored socket gems (see https://kingshotoptimizer.com/charms/references/).
 * When the upstream payload includes charm levels, they auto-fill (Level 1–22).
 *
 * onApply({ gear, charms })
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

      if (gearCount && charmCount) {
        const summary = `${gearCount} gear piece${gearCount === 1 ? '' : 's'} and ${charmCount} charm level${charmCount === 1 ? '' : 's'}`;
        setState(lowerConfidence ? 'review' : 'success');
        setMessage(
          lowerConfidence
            ? `Imported ${summary}. Please double-check ${lowerConfidence} uncertain reading${lowerConfidence === 1 ? '' : 's'}.`
            : `Imported ${summary}. Please verify them before submitting.`,
        );
      } else if (gearCount) {
        setState('review');
        setMessage(
          `Imported ${gearCount} Governor Gear piece${gearCount === 1 ? '' : 's'}. ` +
            'Charm levels are not shown as numbers on the Governor Profile overview (only colored sockets). ' +
            'Set charm levels manually, or upload a piece-detail screen if available.',
        );
      } else if (charmCount) {
        setState(lowerConfidence ? 'review' : 'success');
        setMessage(`Imported ${charmCount} charm level${charmCount === 1 ? '' : 's'}. Please verify before submitting.`);
      } else {
        setState('error');
        setMessage('No gear or charm levels could be read from this image.');
      }
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
          Upload the full, uncropped Governor Profile screen for gear auto-fill.
          Charm levels (1–22, per the Kingshot Optimizer reference) only auto-fill when the scanner
          can read them from the image — the profile overview usually shows sockets, not levels.
          PNG, JPEG, or WebP; up to 8 MB.
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
