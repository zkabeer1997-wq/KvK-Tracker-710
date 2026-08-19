'use client';

import styles from './KingdomEntrance.module.css';

export default function SceneOverlay({ hoveredRoad, onHover, onSelect, phase }) {
  const disabled = phase === 'transitioning';

  return (
    <div className={styles.overlay}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Kingdom 710 · Choose your path</span>
        <h1 className={styles.title}>Enter the kingdom</h1>
        <p className={styles.lede}>
          You do not need to know where anything lives. Pick the option that sounds like you and we will take you there.
        </p>
      </div>

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
          <span className={styles.choiceNumber}>01</span>
          <span>
            <span className={styles.choiceKicker}>New to K710? Start here</span>
            <span className={styles.choiceTitle}>Request Entry</span>
            <span className={styles.choiceSub}>Apply to transfer into Kingdom 710. This is the path for visitors and recruits.</span>
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
          <span className={styles.choiceNumber}>02</span>
          <span>
            <span className={styles.choiceKicker}>Already in K710?</span>
            <span className={styles.choiceTitle}>Enter Member Hub</span>
            <span className={styles.choiceSub}>Go straight to member tools, rally records and the kingdom command area.</span>
          </span>
          <span className={styles.choiceArrow} aria-hidden="true">→</span>
        </button>
      </div>

      <div className={styles.helperRow}>
        <a href="#dossier" className={styles.explore}>Not sure yet? Explore Kingdom 710 ↓</a>
        <span className={styles.hint}>Hover or focus a path to light the road</span>
      </div>
    </div>
  );
}
