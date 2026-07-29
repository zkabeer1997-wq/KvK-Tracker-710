'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const router = useRouter();

async function handleSubmit(e) {
e.preventDefault();
setLoading(true);
setError('');
try {
const res = await fetch('/api/admin-login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ password }),
});
if (res.ok) {
router.push('/admin/dashboard');
router.refresh();
} else {
setError('Incorrect password.');
}
} catch (err) {
setError('Something went wrong. Please try again.');
} finally {
setLoading(false);
}
}

return (
<div className="page">
<div className="card admin-login-card">
<div className="card-header">
<h1>Admin Login</h1>
</div>
<div className="card-body">
<form onSubmit={handleSubmit}>
<label htmlFor="admin-password">Admin Password</label>
<input
id="admin-password"
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
required
/>
{error && <div className="status error">{error}</div>}
<button type="submit" disabled={loading}>
{loading ? 'Checking...' : 'Log In'}
</button>
</form>
</div>
</div>
</div>
);
}
