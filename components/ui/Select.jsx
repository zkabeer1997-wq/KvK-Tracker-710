import { forwardRef } from 'react';

// Same tone convention as Input: .ui-input (theme-aware) by default,
// tone="console" for kingdom.css's .k-input look on console-only pages.
const Select = forwardRef(function Select({ tone, className = '', children, ...rest }, ref) {
  const base = tone === 'console' ? 'k-input' : 'ui-input';
  return (
    <select ref={ref} className={`${base} ${className}`} {...rest}>
      {children}
    </select>
  );
});

export default Select;
