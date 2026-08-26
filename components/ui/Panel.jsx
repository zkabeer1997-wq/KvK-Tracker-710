import Card from './Card';

// A Card with a conventional header/body/footer structure - the shape most
// content pages actually want (a titled section, not a bare surface). Slots
// are optional so <Panel> alone still renders a plain Card.
export default function Panel({
  eyebrow,
  title,
  description,
  actions,
  footer,
  variant = 'surface',
  className = '',
  children,
  ...rest
}) {
  const hasHeader = eyebrow || title || description || actions;
  return (
    <Card variant={variant} className={`ui-panel ${className}`} {...rest}>
      {hasHeader && (
        <div className="ui-panel-header">
          <div className="ui-panel-header-text">
            {eyebrow && <p className="ui-panel-eyebrow k-mark">{eyebrow}</p>}
            {title && <h2 className="ui-panel-title">{title}</h2>}
            {description && <p className="ui-panel-description">{description}</p>}
          </div>
          {actions && <div className="ui-panel-actions">{actions}</div>}
        </div>
      )}
      <div className="ui-panel-body">{children}</div>
      {footer && <div className="ui-panel-footer">{footer}</div>}
    </Card>
  );
}
