// The "nothing here yet" state - guides with no results, rankings before
// the first snapshot, a member with no rallies. One shape for all of it,
// with a slot for a way forward (a CTA button) rather than a dead end.
export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`ui-empty-state ${className}`}>
      {icon && <div className="ui-empty-state-icon" aria-hidden="true">{icon}</div>}
      {title && <p className="ui-empty-state-title">{title}</p>}
      {description && <p className="ui-empty-state-description">{description}</p>}
      {action && <div className="ui-empty-state-action">{action}</div>}
    </div>
  );
}
