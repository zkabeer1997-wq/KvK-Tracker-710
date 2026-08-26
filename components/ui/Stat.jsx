// A labelled figure with an optional trend delta. Reused as-is by the
// rankings trend deltas (PR 11) and the dashboard - the delta prop takes a
// signed number and colors/arrows itself, so callers never hand-roll that
// logic per page.
export default function Stat({ label, value, delta, deltaLabel, className = '' }) {
  const hasDelta = typeof delta === 'number' && delta !== 0;
  const deltaTone = hasDelta ? (delta > 0 ? 'up' : 'down') : null;
  return (
    <div className={`ui-stat ${className}`}>
      <span className="ui-stat-label k-mark">{label}</span>
      <span className="ui-stat-value">{value}</span>
      {hasDelta && (
        <span className={`ui-stat-delta ui-stat-delta-${deltaTone}`}>
          <span aria-hidden="true">{delta > 0 ? '▲' : '▼'}</span>
          {Math.abs(delta)}
          {deltaLabel ? ` ${deltaLabel}` : ''}
        </span>
      )}
    </div>
  );
}
