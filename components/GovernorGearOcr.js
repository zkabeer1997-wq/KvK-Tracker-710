'use client';

import { useRef, useState } from 'react';

export default function GovernorGearOcr({ onApply }) {
  const inputRef = useRef(null);
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  async function scan(event) {
    const image = event.target.files?.[0];
    if (!image) return;
    setState('loading');
    setMessage('Reading rarity, tier, and stars from all six pieces…');

    try {
      const body = new FormData();
      body.append('image', image);
      const response = await fetch('/api/governor-gear-ocr', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The screenshot could not be read.');
      onApply(result.selections);
      const lowerConfidence = result.review?.filter((item) => item.confidence !== null && item.confidence < 0.8).length || 0;
      setState(lowerConfidence ? 'review' : 'success');
      setMessage(lowerConfidence ? `Imported all 6 pieces. Please double-check ${lowerConfidence} uncertain ${lowerConfidence === 1 ? 'reading' : 'readings'}.` : 'Imported all 6 Governor Gear pieces. Please verify them before submitting.');
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
        <strong>Scan Governor Gear</strong>
        <p>Upload the full, uncropped Governor Profile screen. The preview uses Kingshot Optimizer's OCR service. PNG, JPEG, or WebP; up to 8 MB.</p>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={scan} hidden />
      <button type="button" className="gear-ocr-button" onClick={() => inputRef.current?.click()} disabled={state === 'loading'}>
        {state === 'loading' ? 'Scanning…' : state === 'error' ? 'Try another screenshot' : 'Upload screenshot'}
      </button>
      {message && <p className="gear-ocr-status" role="status" aria-live="polite">{message}</p>}
    </div>
  );
}
