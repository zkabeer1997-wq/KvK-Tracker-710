import { createSupabaseAdminClient } from './supabaseAdmin.js';

export const INITIAL_PERSONAL_CODE_PLAYER_ID = '108051086';

export class KingshotAccountBootstrapError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'KingshotAccountBootstrapError';
  }
}

export async function ensureInitialKingshotOwner() {
  try {
    const { error } = await createSupabaseAdminClient().rpc('ensure_initial_kingshot_owner');
    if (error) throw error;
  } catch (error) {
    throw new KingshotAccountBootstrapError(
      'Personal login database setup is incomplete. Apply the latest Supabase migrations.',
      error,
    );
  }
}
