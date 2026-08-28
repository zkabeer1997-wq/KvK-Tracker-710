import { Callout } from './ui';

export default function FormClosedNotice({ message }) {
  return (
    <Callout tone="warning" title="This form is currently closed">
      <p>{message || 'An admin has closed this form for now. Check back later.'}</p>
    </Callout>
  );
}
