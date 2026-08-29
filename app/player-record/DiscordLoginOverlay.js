'use client';

import { useEffect, useRef, useState } from 'react';

const ERROR_COPY = {
  discord_not_configured: 'Discord login is not configured on this deployment yet.',
  discord_state: 'Discord verification expired. Please try again.',
  discord_guild: 'This Discord account is not currently a member of the Kingdom 710 server.',
  discord_failed: 'Discord verification could not be completed.',
};

export default function DiscordLoginOverlay({ discordLink = false, authError = '', next = '' }) {
  const [linkStatus, setLinkStatus] = useState('');
  const linking = useRef(false);

  useEffect(() => {
    if (!discordLink) return undefined;
    let cancelled = false;
    const tryLink = async () => {
      if (cancelled || linking.current) return;
      linking.current = true;
      try {
        const response = await fetch('/api/member-auth/discord/link', { method: 'POST', cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok) {
          setLinkStatus('Discord linked. Future logins will be one click.');
          window.setTimeout(() => { window.location.href = data.next || next || '/player-record'; }, 700);
          cancelled = true;
          return;
        }
        if (response.status !== 401) setLinkStatus(data.error || 'Unable to link Discord right now.');
      } catch {
        // The normal Member ID/PIN form may not have completed yet. Retry quietly.
      } finally {
        linking.current = false;
      }
    };
    tryLink();
    const timer = window.setInterval(tryLink, 1200);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [discordLink, next]);

  const href = `/api/member-auth/discord/start${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <aside className="discord-login-float" aria-live="polite">
      {discordLink ? (
        <div className="discord-login-card is-linked">
          <span className="discord-login-mark">DISCORD VERIFIED</span>
          <strong>Link your K710 identity once.</strong>
          <p>Use the Member ID + PIN form above one final time. After it succeeds, this Discord account is linked and future logins skip the PIN.</p>
          {linkStatus && <small>{linkStatus}</small>}
        </div>
      ) : (
        <div className="discord-login-card">
          <div>
            <span className="discord-login-mark">NEW MEMBER LOGIN</span>
            <strong>Verify with Discord</strong>
            <p>Access is granted only when Discord confirms you are currently inside the Kingdom 710 server.</p>
          </div>
          <a className="discord-login-button" href={href}>
            <span aria-hidden="true">◉</span> Continue with Discord
          </a>
          {authError && <small className="discord-login-error">{ERROR_COPY[authError] || 'Discord verification failed.'}</small>}
        </div>
      )}
      <style jsx>{`
        .discord-login-float{position:fixed;z-index:65;right:18px;bottom:18px;width:min(390px,calc(100vw - 36px));pointer-events:none}
        .discord-login-card{pointer-events:auto;padding:16px;border:1px solid rgba(126,151,255,.32);background:linear-gradient(145deg,rgba(15,18,29,.97),rgba(8,10,16,.98));box-shadow:0 18px 50px rgba(0,0,0,.42);color:#eef1ff}
        .discord-login-card>div{display:grid;gap:5px}.discord-login-mark{font:700 9px/1.2 var(--font-mono);letter-spacing:.14em;color:#aebcff}.discord-login-card strong{font:700 17px/1.2 var(--font-display)}
        .discord-login-card p{margin:4px 0 12px;color:#aab1c4;font-size:12px;line-height:1.5}.discord-login-button{display:flex;align-items:center;justify-content:center;gap:9px;min-height:42px;padding:10px 14px;background:#5865f2;color:white;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:.02em}.discord-login-button:hover{filter:brightness(1.08)}
        .discord-login-card small{display:block;margin-top:10px;color:#b7c0d3;font-size:10px;line-height:1.45}.discord-login-error{color:#ffb6ab!important}.is-linked{border-color:rgba(104,210,151,.34)}.is-linked .discord-login-mark{color:#8ee1ae}
        @media(max-width:620px){.discord-login-float{position:relative;right:auto;bottom:auto;width:calc(100% - 32px);margin:-78px auto 26px}.discord-login-card{box-shadow:0 12px 34px rgba(0,0,0,.34)}}
      `}</style>
    </aside>
  );
}
