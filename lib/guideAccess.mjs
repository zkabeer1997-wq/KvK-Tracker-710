// Preview content is isolated: production may still be running the old public-only reader.
export function guidesTable() {
  return process.env.VERCEL_ENV === 'preview' ? 'kingdom_guides_preview' : 'kingdom_guides';
}
export function canReadGuide(guide, { admin = false, member = false } = {}) {
  return Boolean(guide && (admin || (guide.is_published && (guide.access_level !== 'members' || member))));
}
