// variant="surface" (the default) is new, theme-aware CSS defined in
// primitives.css: it reads --color-surface / --color-border, so it looks
// right under .theme-console AND .theme-realm without extra work. The
// other three variants wrap kingdom.css's existing dark-console materials
// (.k-plate / .k-parchment / .k-leather) - deliberately NOT theme-aware,
// since "obsidian" and "leather" are a console aesthetic, not something
// the bright public surface should render. Reach for them explicitly on
// console/ops pages; reach for the default everywhere else.
const VARIANT_CLASS = {
  surface: 'ui-card-surface',
  plate: 'k-plate',
  parchment: 'k-parchment',
  leather: 'k-leather',
};

export default function Card({ variant = 'surface', className = '', children, ...rest }) {
  const classes = [VARIANT_CLASS[variant] || VARIANT_CLASS.plate, className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
