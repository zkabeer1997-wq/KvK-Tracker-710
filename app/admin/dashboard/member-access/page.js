'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function MemberAccessAdminPage() {
  const [accounts, setAccounts] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [working, setWorking] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-member-access', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to load access controls.');
      setAccounts(data.accounts || []);
      setPending(data.pending || []);
    } catch (err) {
      setError(err.message || 'Unable to load access controls.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(action, memberId, extra = {}) {
    setWorking(`${action}:${memberId}`);
    setStatus('');
    setError('');
    try {
      const response = await fetch('/api/admin-member-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, memberId, ...extra }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to update access.');
      setStatus(action === 'approve' ? `Approved ${memberId}. They can now activate using their own existing PIN.` : `Updated ${memberId}.`);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update access.');
    } finally {
      setWorking('');
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter((row) => `${row.display_name} ${row.member_id} ${row.role} ${row.status}`.toLowerCase().includes(term));
  }, [accounts, search]);

  const activated = accounts.filter((row) => row.claimed_at).length;
  const revoked = accounts.filter((row) => row.status === 'revoked').length;

  return (
    <main className="access-admin">
      <div className="access-admin-shell">
        <div className="access-admin-top">
          <div>
            <span className="access-kicker">K710 Security</span>
            <h1>Member Access Control</h1>
            <p>Approve membership, see who has activated, change roles, and revoke every active session with one click.</p>
          </div>
          <Link href="/admin/dashboard" className="access-back">← Admin Dashboard</Link>
        </div>

        <div className="access-stats">
          <div><strong>{accounts.length}</strong><span>Approved roster</span></div>
          <div><strong>{activated}</strong><span>Activated</span></div>
          <div><strong>{pending.length}</strong><span>Pending approval</span></div>
          <div><strong>{revoked}</strong><span>Revoked</span></div>
        </div>

        <section className="access-panel pending-panel">
          <div className="access-panel-head">
            <div><span className="access-kicker">New Player Records</span><h2>Pending Approval</h2></div>
            <p>These records exist in the public roster but cannot access private kingdom information until you approve them.</p>
          </div>
          {pending.length === 0 ? <p className="access-empty">No new Player Records are awaiting approval.</p> : (
            <div className="access-table-wrap"><table><thead><tr><th>Player</th><th>ID</th><th>Alliance</th><th></th></tr></thead><tbody>
              {pending.map((row) => <tr key={row.member_id}><td>{row.name}</td><td>{row.member_id}</td><td>{row.current_alliance || '—'}</td><td><button disabled={working === `approve:${row.member_id}`} onClick={() => act('approve', row.member_id)}>Approve Member</button></td></tr>)}
            </tbody></table></div>
          )}
        </section>

        <section className="access-panel">
          <div className="access-panel-head roster-head">
            <div><span className="access-kicker">Secure Roster</span><h2>Approved Members</h2></div>
            <input aria-label="Search secure roster" placeholder="Search player, ID, role…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {loading ? <p className="access-empty">Loading secure roster…</p> : (
            <div className="access-table-wrap"><table><thead><tr><th>Player</th><th>ID</th><th>Activation</th><th>Role</th><th>Status</th><th>Control</th></tr></thead><tbody>
              {filtered.map((row) => (
                <tr key={row.member_id}>
                  <td><strong>{row.display_name || '—'}</strong></td>
                  <td>{row.member_id}</td>
                  <td><span className={row.claimed_at ? 'pill activated' : 'pill waiting'}>{row.claimed_at ? 'Activated' : 'Not activated'}</span></td>
                  <td>
                    <select value={row.role} onChange={(e) => act('role', row.member_id, { role: e.target.value })} disabled={Boolean(working)}>
                      <option value="member">Member</option><option value="leadership">Leadership</option><option value="recruitment">Recruitment</option><option value="admin">Admin</option>
                    </select>
                  </td>
                  <td><span className={row.status === 'active' ? 'pill active' : 'pill revoked'}>{row.status}</span></td>
                  <td>{row.status === 'active' ? <button className="danger" disabled={working === `revoke:${row.member_id}`} onClick={() => act('revoke', row.member_id)}>Revoke</button> : <button disabled={working === `restore:${row.member_id}`} onClick={() => act('restore', row.member_id)}>Restore</button>}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </section>

        {status && <div className="access-message success">{status}</div>}
        {error && <div className="access-message error">{error}</div>}

        <aside className="access-explanation">
          <h3>What this changes</h3>
          <p><b>You never create a PIN.</b> Current members prove ownership once with the PIN they already chose, then create their own stronger access phrase. Future Player Records remain pending until leadership clicks Approve. Revoking a member invalidates their stored sessions immediately.</p>
        </aside>
      </div>

      <style jsx>{`
        .access-admin{min-height:100vh;background:#0d111a;color:#e7e1d3;padding:42px 24px 70px;font-family:Inter,Arial,sans-serif}.access-admin-shell{width:min(1240px,100%);margin:0 auto}.access-admin-top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:28px}.access-admin-top h1{font-size:38px;margin:5px 0 8px}.access-admin-top p{max-width:760px;color:#9da5b5;line-height:1.55;margin:0}.access-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#d3a953;font-weight:700}.access-back{color:#d3a953;text-decoration:none;margin-top:10px}.access-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}.access-stats>div{border:1px solid #273043;background:#141a26;padding:18px}.access-stats strong{font-size:28px;display:block}.access-stats span{font-size:11px;color:#929bad;text-transform:uppercase;letter-spacing:.08em}.access-panel{border:1px solid #273043;background:#111722;margin-top:18px}.pending-panel{border-color:#4b3d21}.access-panel-head{display:flex;justify-content:space-between;gap:24px;align-items:center;padding:20px;border-bottom:1px solid #273043}.access-panel-head h2{margin:3px 0 0;font-size:21px}.access-panel-head p{max-width:610px;color:#919aaa;font-size:13px;line-height:1.5;margin:0}.roster-head input{background:#0b1019;border:1px solid #303a50;color:#e7e1d3;padding:10px 12px;width:min(320px,100%)}.access-table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:780px}th,td{text-align:left;padding:13px 16px;border-bottom:1px solid #222b3c;font-size:13px}th{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#7f899b;background:#0e141e}td{color:#cbd1dc}button,select{background:#1d2a3d;border:1px solid #3a4c68;color:#e8eef7;padding:8px 10px;font-size:12px}button{cursor:pointer}button:hover{border-color:#6685ad}button.danger{background:#351a20;border-color:#6a303d;color:#f1b5bf}.pill{display:inline-block;border-radius:999px;padding:4px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;border:1px solid}.pill.activated,.pill.active{color:#9de0b0;border-color:#315c3f;background:#13271a}.pill.waiting{color:#e6c474;border-color:#5b4b28;background:#292313}.pill.revoked{color:#e8a1ad;border-color:#61303a;background:#2b171c}.access-empty{padding:20px;color:#8e98aa}.access-message{margin-top:14px;padding:12px 14px;border:1px solid}.access-message.success{border-color:#315c3f;color:#a7ddb4;background:#13271a}.access-message.error{border-color:#61303a;color:#efb0ba;background:#2b171c}.access-explanation{margin-top:20px;border-left:3px solid #d3a953;padding:14px 18px;background:#151b25}.access-explanation h3{margin:0 0 6px}.access-explanation p{margin:0;color:#aab2c0;line-height:1.55}.access-explanation b{color:#eee6d6}@media(max-width:800px){.access-admin{padding:28px 14px}.access-admin-top,.access-panel-head{display:block}.access-back{display:inline-block;margin-top:14px}.access-stats{grid-template-columns:1fr 1fr}.roster-head input{margin-top:14px}.access-panel-head p{margin-top:8px}}
      `}</style>
    </main>
  );
}
