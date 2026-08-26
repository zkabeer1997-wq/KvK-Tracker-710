// A banner for information, success, warning, or danger states - the
// admin-error / hint patterns currently hand-rolled per form get one shared
// shape and one shared set of colors instead.
const TONE_CLASS = {
  info: 'ui-callout-info',
  success: 'ui-callout-success',
  warning: 'ui-callout-warning',
  danger: 'ui-callout-danger',
};

export default function Callout({ tone = 'info', title, className = '', children, ...rest }) {
  const toneClass = TONE_CLASS[tone] || TONE_CLASS.info;
  const isAlert = tone === 'danger' || tone === 'warning';
  return (
    <div className={`ui-callout ${toneClass} ${className}`} role={isAlert ? 'alert' : 'status'} {...rest}>
      {title && <p className="ui-callout-title">{title}</p>}
      <div className="ui-callout-body">{children}</div>
    </div>
  );
}
