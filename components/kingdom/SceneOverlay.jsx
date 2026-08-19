'use client';

import styles from './KingdomEntrance.module.css';

export default function SceneOverlay({ hoveredRoad, onHover, onSelect, phase }) {
  const disabled = phase === 'transitioning';

  return (
    <div className={styles.overlay} data-phase={phase}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>The Northern Gate · Kingdom 710</span>
        <h1 className={styles.title}>Choose how you enter.</h1>
        <p className={styles.lede}>
          New to the kingdom? Request entry. Already in K710? Head straight to the member hub. You cannot choose the wrong door.
        </p>
      </div>

      <div className={styles.pathPanel}>
        <div className={styles.choices} aria-label="Choose how to enter Kingdom 710">
          <button
            type="button"
            className={`${styles.choice} ${styles.choiceGold}`}
            onMouseEnter={() => onHover('left')}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover('left')}
            onBlur={() => onHover(null)}
            onClick={() => onSelect('left', '/interest')}
            disabled={disabled}
            data-active={hoveredRoad === 'left'}
          >
            <span className={styles.choiceSigil} aria-hidden="true"><span>NEW</span></span>
            <span className={styles.choiceCopy}>
              <span className={styles.choiceKicker}>Visitors & recruits</span>
              <span className={styles.choiceTitle}>Request Entry</span>
              <span className={styles.choiceSub}>Apply to transfer into Kingdom 710.</span>
            </span>
            <span className={styles.choiceArrow} aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            className={`${styles.choice} ${styles.choiceBlue}`}
            onMouseEnter={() => onHover('right')}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover('right')}
            onBlur={() => onHover(null)}
            onClick={() => onSelect('right', '/player-record')}
            disabled={disabled}
            data-active={hoveredRoad === 'right'}
          >
            <span className={styles.choiceSigil} aria-hidden="true"><span>710</span></span>
            <span className={styles.choiceCopy}>
              <span className={styles.choiceKicker}>Current K710 members</span>
              <span className={styles.choiceTitle}>Enter Member Hub</span>
              <span className={styles.choiceSub}>Open rally records and kingdom tools.</span>
            </span>
            <span className={styles.choiceArrow} aria-hidden="true">→</span>
          </button>
        </div>

        <div className={styles.helperRow}>
          <a href="#dossier" className={styles.explore}>Not sure yet? Explore Kingdom 710 ↓</a>
          <span className={styles.hint}>{hoveredRoad ? 'Path illuminated — click to enter' : 'Hover or focus a gate to light its road'}</span>
        </div>
      </div>
    </div>
  );
}
