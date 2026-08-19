'use client';

import { useState } from 'react';

export default function SecureSessionControls({ member }) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/member-access/logout', { method: 'POST' });
    } finally {
      window.location.assign('/member-access');
    }
  }

  return (
    <div className="secure-session-controls">
      <span><b>{member.display_name || member.member_id}</b> · {member.role}</span>
      <button type="button" onClick={logout} disabled={loading}>{loading ? 'Signing out…' : 'Sign out'}</button>
      <style jsx>{`
        .secure-session-controls{position:fixed;z-index:40;right:18px;bottom:18px;display:flex;align-items:center;gap:12px;padding:9px 10px 9px 13px;background:rgba(8,11,17,.9);border:1px solid rgba(201,164,78,.28);box-shadow:0 10px 30px rgba(0,0,0,.35);backdrop-filter:blur(10px);font-family:var(--font-mono);font-size:10px;letter-spacing:.04em;color:var(--parchment-dim)}
        .secure-session-controls b{color:var(--parchment)}
        .secure-session-controls button{border:1px solid rgba(201,164,78,.34);background:rgba(201,164,78,.08);color:var(--brass);padding:7px 9px;font:inherit;text-transform:uppercase;cursor:pointer}.secure-session-controls button:hover{color:var(--gold-hot);border-color:rgba(201,164,78,.58)}.secure-session-controls button:disabled{opacity:.5}
        @media(max-width:600px){.secure-session-controls{left:12px;right:12px;bottom:12px;justify-content:space-between}}
      `}</style>
    </div>
  );
}
