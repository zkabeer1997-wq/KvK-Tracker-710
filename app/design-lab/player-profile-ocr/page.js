import Image from 'next/image';

export const metadata = {
  title: 'Player Profile OCR Guide Preview',
  robots: { index: false, follow: false },
};

export default function PlayerProfileOcrGuidePreview() {
  return (
    <main className="public-page">
      <section className="public-form-card" style={{ width: 'min(100%, 760px)' }}>
        <span className="eyebrow">Player Profile · preview</span>
        <h1>Power Data</h1>
        <p>This public design-preview page shows the new upload guidance without requiring a member login.</p>

        <div className="gear-ocr-panel idle">
          <div>
            <strong>Upload Screenshot</strong>
            <p>
              Upload the full, uncropped Governor Profile screen. Gear is read by OCR;
              charm levels are matched from gem shapes (Optimizer level ladder, Lv 1–22).
              PNG, JPEG, or WebP; up to 8 MB.
            </p>
          </div>
          <button type="button" className="gear-ocr-button" disabled>
            Upload screenshot
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
        </div>
      </section>
    </main>
  );
}
