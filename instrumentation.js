export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const { ensureInitialKingshotOwner } = await import('./lib/kingshotAccountBootstrap.js');
    await ensureInitialKingshotOwner();
  } catch (error) {
    // Startup should remain available so the login route can return an
    // actionable setup error instead of taking down every public page.
    console.error('Initial Kingshot owner bootstrap failed.', error);
  }
}
