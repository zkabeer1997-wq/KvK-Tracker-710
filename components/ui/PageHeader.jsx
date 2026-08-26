// The shared header shape for every content page from Wave 2 on: eyebrow,
// title, description, actions. Public pages compose this once instead of
// each re-deriving its own hero markup - part of what makes the new public
// surface read as one system rather than N one-off page designs.
export default function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <header className={`ui-page-header ${className}`}>
      <div className="ui-page-header-text">
        {eyebrow && <p className="ui-page-header-eyebrow k-mark">{eyebrow}</p>}
        {title && <h1 className="ui-page-header-title">{title}</h1>}
        {description && <p className="ui-page-header-description">{description}</p>}
      </div>
      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </header>
  );
}
