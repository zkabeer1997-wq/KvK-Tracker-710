const COLLABORATOR_BRANCH = 'dosojin/kingshot-login-system';
const PRODUCTION_PROJECT_REF = 'wadszwahydnznhfcnzoo';
const STAGING_PROJECT_REF = 'kufmocesoeeljmiyiwxr';

const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
const environment = process.env.VERCEL_ENV || '';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

if (environment === 'preview' && branch === COLLABORATOR_BRANCH) {
  if (!url.includes(STAGING_PROJECT_REF)) {
    const reason = url.includes(PRODUCTION_PROJECT_REF)
      ? 'production Supabase is configured'
      : 'the staging Supabase URL is missing';
    console.error(
      `Blocked unsafe collaborator preview: ${reason}. Configure branch-scoped Preview variables for ${COLLABORATOR_BRANCH}.`
    );
    process.exit(1);
  }

  if (process.env.K710_ENVIRONMENT !== 'preview') {
    console.error('Blocked collaborator preview: K710_ENVIRONMENT must equal preview.');
    process.exit(1);
  }
}

console.log('Collaborator environment safety check passed.');
