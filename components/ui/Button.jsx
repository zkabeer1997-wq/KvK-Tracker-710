import Link from 'next/link';

// variant="solid" (default) and "quiet" are new, theme-aware CSS - see
// primitives.css for why they don't just wrap .k-btn/.k-btn-quiet.
// variant="struck" wraps kingdom.css's .k-btn-struck unchanged: it's
// already the shared primary CTA on the live public Registry form, its
// dark-text-on-gold styling reads fine on either theme's ground, and
// kingdom.css's own comment calls it out as "the single affirmative
// action... shared by the Gatehouse, the Registry and the Armory" - the
// one legacy button variant meant to cross both surfaces already.
// variant="sky" wraps .k-btn-sky, which is alliance-heraldry-specific
// (710 SKY's blue) rather than a generic tone - reach for it only within
// .theme-console, where the rest of that heraldry system lives.
const VARIANT_CLASS = {
  solid: 'ui-btn',
  quiet: 'ui-btn ui-btn-quiet',
  struck: 'k-btn k-btn-struck',
  sky: 'k-btn k-btn-sky',
};

export default function Button({
  variant = 'solid',
  href,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = [VARIANT_CLASS[variant] || VARIANT_CLASS.solid, className].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
