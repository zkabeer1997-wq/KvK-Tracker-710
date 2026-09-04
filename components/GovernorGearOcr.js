'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { detectCharmsFromFile } from '../lib/charmVisionClient';

/**
 * Upload a full Governor Profile screenshot.
 * - Governor Gear: Kingshot Optimizer OCR service
 * - Charms: client-side vision match against Optimizer shape ladder
 *   (https://kingshotoptimizer.com/charms/references/)
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
    setMessage('Reading Governor Gear and matching Charm shapes…');

    try {
      const body = new FormData();
      body.append('image', image);

      const [ocrResponse, charmVision] = await Promise.all([
        fetch('/api/governor-gear-ocr', { method: 'POST', body }).then(async (response) => {
          const result = await response.json();
          return { ok: response.ok, status: response.status, result };
        }),
        detectCharmsFromFile(image).catch(() => ({ selections: {}, review: [], gemCount: 0 })),
      ]);

      if (!ocrResponse.ok) {
        throw new Error(ocrResponse.result.error || 'The screenshot could not be read.');
      }

      const result = ocrResponse.result;
      const gear = result.gear || result.selections || {};
      const upstreamCharms = result.charms || {};
      const visionCharms = charmVision.selections || {};
      const charms = Object.keys(upstreamCharms).length ? upstreamCharms : visionCharms;

      onApply({ gear, charms });

      const gearCount = result.gearCount ?? Object.keys(gear).length;
      const charmCount = Object.keys(charms).length;
      const lowerConfidence = [...(result.review || []), ...(charmVision.review || [])].filter(
        (item) => item.confidence !== null && item.confidence !== undefined && item.confidence < 0.6,
      ).length;

      if (gearCount && charmCount) {
        setState(lowerConfidence ? 'review' : 'success');
        setMessage(
          lowerConfidence
            ? `Imported ${gearCount} gear and ${charmCount} charms. Please verify ${lowerConfidence} uncertain reading${lowerConfidence === 1 ? '' : 's'} (charm shape match is approximate).`
            : `Imported ${gearCount} gear pieces and ${charmCount} charm levels. Please verify before submitting.`,
        );
      } else if (gearCount) {
        setState('review');
        setMessage(
          `Imported ${gearCount} Governor Gear piece${gearCount === 1 ? '' : 's'}. ` +
            'Charm shapes could not be matched confidently — set levels manually if needed.',
        );
      } else if (charmCount) {
        setState('review');
        setMessage(`Imported ${charmCount} charm levels from shape match. Please verify before submitting.`);
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
          Upload the full, uncropped Governor Profile screen. Gear is read by OCR;
          charm levels are matched from gem shapes (Optimizer level ladder, Lv 1–22).
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
      <details className="gear-ocr-example">
        <summary>See exactly what to upload</summary>
        <div className="gear-ocr-example-content">
          <Image
            src="/images/player-profile-ocr-example-private.webp"
            alt="Example of the full Governor Profile screen to upload, showing all six gear pieces and their charm icons. Member details are hidden."
            width={853}
            height={1844}
            sizes="(max-width: 600px) 82vw, 280px"
          />
          <div>
            <strong>Use the Governor Profile screen</strong>
            <p>Keep all six gear pieces, their tier labels, and every charm visible. Do not crop or cover the gear area.</p>
            <p className="gear-ocr-privacy-note">Your screenshot is used only to read gear and charm levels.</p>
          </div>
        </div>
      </details>
      {message && (
        <p className="gear-ocr-status" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
