'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminInterestPage() {
const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const router = useRouter();

useEffect(() => {
async function load() {
setLoading(true);
const response = await fetch('/api/admin-interest-submissions');
const result = await response.json();
if (!response.ok) {
setError(result.error || 'Unable to load submissions.');
} else {
setRows(result.rows || []);
}
setLoading(false);
}
load();
}, []);

async function handleLogout() {
await fetch('/api/admin-logout', { method: 'POST' });
router.push('/admin/login');
router.refresh();
}

return (
<div className="page admin-page">
<div className="card admin-dashboard-card">
<div className="admin-tabs">
<Link href="/admin/dashboard" className="admin-tab">Player Records</Link>
<Link href="/admin/dashboard/interest" className="admin-tab active">Interest Submissions</Link>
</div>
<div className="admin-hero">
<div>
<span className="admin-kicker">K710 command board</span>
<h1>Interest Submissions</h1>
<p>Review 710 transfer onboarding requests submitted through the public interest form.</p>
</div>
<div className="admin-hero-actions">
<button type="button" onClick={handleLogout} className="logout-btn">Log Out</button>
</div>
</div>
<div className="card-body">
<div className="dashboard-stats" aria-label="Interest summary">
<div>
<span>Total submissions</span>
<strong>{rows.length}</strong>
</div>
</div>
{loading && <p>Loading...</p>}
{error && <div className="status error">{error}</div>}
{!loading && !error && (
<div className="admin-table-wrap">
<table className="admin-table">
<thead>
<tr>
<th>In-game name</th>
<th>Player ID</th>
<th>Discord</th>
<th>Current server</th>
<th>Current alliance</th>
<th>Migrating to</th>
<th>Troop level</th>
<th>TG</th>
<th>T11</th>
<th>Mystic Trial</th>
<th>Total Power</th>
<th>Reduce power</th>
<th>Passes required</th>
<th>Current passes</th>
<th>Active commit</th>
<th>Save resources</th>
<th>Battles</th>
<th>Spending</th>
<th>Language</th>
<th>Screenshots</th>
<th>Submitted</th>
</tr>
</thead>
<tbody>
{rows.map((row) => (
<tr key={row.id}>
<td>{row.in_game_name}</td>
<td>{row.player_id}</td>
<td>{row.discord_username}</td>
<td>{row.current_server}</td>
<td>{row.current_alliance}</td>
<td>{row.migrate_alliance}</td>
<td>{row.highest_troop_level}</td>
<td>{row.current_tg}</td>
<td>{(row.t11_units || []).join(', ')}</td>
<td>{row.mystic_trial_stages}</td>
<td>{row.total_power}</td>
<td>{row.willing_reduce_power}</td>
<td>{row.passes_required}</td>
<td>{row.current_passes}</td>
<td>{row.active_commit}</td>
<td>{row.willing_save_resources}</td>
<td>{row.participates_battles}</td>
<td>{row.spending_archetype}</td>
<td>{row.main_language}</td>
<td className="heroes-cell">
{(row.screenshot_urls || []).map((url, index) => (
<a key={url} href={url} target="_blank" rel="noreferrer" style={{ marginRight: 6 }}>Image {index + 1}</a>
))}
</td>
<td className="updated-cell">{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</td>
</tr>
))}
</tbody>
</table>
{rows.length === 0 && <p>No interest submissions yet.</p>}
</div>
)}
</div>
</div>
</div>
);
}
