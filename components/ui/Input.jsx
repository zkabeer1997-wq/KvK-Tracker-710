import { forwardRef } from 'react';

// .ui-input (new, theme-aware) is the default - see primitives.css for why
// this doesn't just wrap kingdom.css's .k-input, whose dark-translucent
// gradient is tuned for the console's obsidian/stone surfaces and reads as
// a gray smear on .theme-realm's light ground. Pass tone="console" for the
// legacy look on pages that are deliberately staying in the dark console
// aesthetic (e.g. existing admin/member forms as they're migrated in PR 19).
//
// forwardRef so it composes inside Field and still works with libraries/
// forms that need the underlying DOM node (e.g. focus-on-open, as
// ConfirmDialog already does for a raw button).
const Input = forwardRef(function Input({ tone, className = '', ...rest }, ref) {
  const base = tone === 'console' ? 'k-input' : 'ui-input';
  return <input ref={ref} className={`${base} ${className}`} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ tone, className = '', ...rest }, ref) {
  const base = tone === 'console' ? 'k-input' : 'ui-input';
  return <textarea ref={ref} className={`${base} ${className}`} {...rest} />;
});

export default Input;
