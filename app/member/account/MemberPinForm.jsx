'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Field, Input } from '../../../components/ui';

export default function MemberPinForm({ memberId }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    setIsError(false);

    try {
      const response = await fetch('/api/member-change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin, confirmPin }),
      });
      const data = await response.json();
      if (!response.ok || data?.ok !== true) {
        setIsError(true);
        setStatus(data?.error || 'Unable to change your PIN.');
        return;
      }
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setStatus('PIN changed. Use your new PIN the next time you sign in.');
    } catch {
      setIsError(true);
      setStatus('Unable to change your PIN right now.');
    } finally {
      setLoading(false);
    }
  }

  const pinInput = (value, setter, autoComplete) => ({
    type: 'password', inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6,
    value, onChange: (event) => setter(event.target.value.replace(/\D/g, '').slice(0, 6)),
    autoComplete, required: true,
  });

  return (
    <main className="public-page">
      <div className="public-shell single-form" style={{ maxWidth: 680 }}>
        <Link href="/player-record">← Member page</Link>
        <section className="form-card" style={{ marginTop: 20 }}>
          <span className="eyebrow">Account security</span>
          <h1>Change your PIN</h1>
          <p>Signed in as Member {memberId}. Confirm your current PIN, then choose a new 6-digit PIN.</p>
          <form onSubmit={submit} style={{ display: 'grid', gap: 16, marginTop: 22 }}>
            <Field label="Current PIN" htmlFor="current-pin">
              <Input id="current-pin" {...pinInput(currentPin, setCurrentPin, 'current-password')} />
            </Field>
            <Field label="New 6-digit PIN" htmlFor="new-pin">
              <Input id="new-pin" {...pinInput(newPin, setNewPin, 'new-password')} />
            </Field>
            <Field label="Confirm new PIN" htmlFor="confirm-pin">
              <Input id="confirm-pin" {...pinInput(confirmPin, setConfirmPin, 'new-password')} />
            </Field>
            {status && <div className={isError ? 'status error' : 'status'} role="status">{status}</div>}
            <Button type="submit" variant="sky" disabled={loading}>
              {loading ? 'Changing PIN…' : 'Change PIN'}
            </Button>
          </form>
          <p className="hint" style={{ marginTop: 16 }}>
            If you no longer know your current PIN, an administrator must reset it for you.
          </p>
        </section>
      </div>
    </main>
  );
}
