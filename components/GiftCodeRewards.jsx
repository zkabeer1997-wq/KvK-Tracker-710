'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Compact Gift Code Rewards for signed-in members.
 * "Check your in-game mail" only after a confirmed successful redemption.
 */
export default function GiftCodeRewards({ className = '' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gift-codes', { cache: 'no-store' });
      if (res.status === 401) {
        setData(null);
        setError('');
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to load gift codes.');
      setData(json);
    } catch (err) {
      setError(err.message || 'Unable to load gift codes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setEnabled(enabled) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/gift-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to update preference.');
      setData(json);
    } catch (err) {
      setError(err.message || 'Unable to update preference.');
    } finally {
      setBusy(false);
    }
  }

  // Not signed in — hide quietly (page may still be public).
  if (!loading && !data && !error) return null;

  const history = data?.history || [];
  const hasConfirmedRedeemed = history.some((h) => h.status === 'redeemed');
  const recent = history.slice(0, 8);

  const statusLabel = (status) => {
    switch (status) {
      case 'redeemed':
        return 'Redeemed';
      case 'already_redeemed':
        return 'Already redeemed';
      case 'pending':
      case 'processing':
        return 'Pending';
      case 'temporary_failure':
        return 'Retrying';
      case 'expired':
      case 'invalid_code':
        return 'Code invalid/expired';
      case 'invalid_player':
        return 'Player issue';
      default:
        return status || '—';
    }
  };

  return (
    <section className={`gift-code-rewards ledger-block ${className}`.trim()} aria-labelledby="gift-code-rewards-title">
      <div className="ledger-block-head">
        <span className="ledger-block-kicker">Kingdom 710</span>
        <h3 id="gift-code-rewards-title">Gift Code Rewards</h3>
        <p>
          Code discovery is automatic (checked daily). Redemption results shown here are
          simulated for now — completing a redemption still requires visiting{' '}
          <a href="https://ks-giftcode.centurygame.com/" target="_blank" rel="noreferrer">
            ks-giftcode.centurygame.com
          </a>{' '}
          yourself with your Player ID and Kingdom 710.
        </p>
      </div>

      {loading ? <p className="hint">Loading gift code status…</p> : null}
      {error ? <p className="status error">{error}</p> : null}

      {data ? (
        <>
          <div className="gift-code-rewards-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span>
              Status:{' '}
              <strong>
                {!data.enrolled
                  ? 'Not enrolled'
                  : data.enabled
                    ? 'Auto-redeem on'
                    : 'Auto-redeem off'}
              </strong>
            </span>
            {data.playerId ? (
              <span className="hint" style={{ margin: 0 }}>
                Player ID {data.playerId}
              </span>
            ) : null}
            <button
              type="button"
              className="secondary-btn"
              disabled={busy}
              onClick={() => setEnabled(!(data.enabled && data.enrolled))}
              style={{ marginLeft: 'auto' }}
            >
              {busy
                ? 'Saving…'
                : data.enabled && data.enrolled
                  ? 'Turn off auto-redeem'
                  : 'Turn on auto-redeem'}
            </button>
          </div>

          {hasConfirmedRedeemed ? (
            <p className="status" role="status">
              Shown as redeemed here (simulated) — this has not been submitted to Century Games.
              Redeem it yourself at{' '}
              <a href="https://ks-giftcode.centurygame.com/" target="_blank" rel="noreferrer">
                ks-giftcode.centurygame.com
              </a>{' '}
              to actually receive it, then check your in-game mail.
            </p>
          ) : null}

          {recent.length === 0 ? (
            <p className="hint">No redemption attempts yet. Codes are checked daily from the wiki.</p>
          ) : (
            <div className="gift-code-rewards-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="gift-code-rewards-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem' }}>Code</th>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem' }}>Result</th>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem' }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((h) => (
                    <tr key={h.id}>
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        <code>{h.code}</code>
                      </td>
                      <td style={{ padding: '0.35rem 0.5rem' }}>{statusLabel(h.status)}</td>
                      <td style={{ padding: '0.35rem 0.5rem' }}>
                        {h.completed_at || h.updated_at || h.created_at
                          ? new Date(h.completed_at || h.updated_at || h.created_at).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
