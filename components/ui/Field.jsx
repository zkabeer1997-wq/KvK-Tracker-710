// Wraps kingdom.css's .k-field / .k-label. A labelled slot for one control;
// pass any input-like element as children (Input, Select, Textarea, or a
// bespoke control that still needs the label treatment).
export default function Field({ label, hint, error, htmlFor, className = '', children }) {
  return (
    <div className={`k-field ${className}`}>
      {label && (
        <label className="k-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <span className="ui-field-hint">{hint}</span>}
      {error && (
        <span className="ui-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
