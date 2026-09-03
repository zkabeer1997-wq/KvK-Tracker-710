export const GUIDE_FIELDS = 'slug, title, category, description, body, position, is_published, created_at, updated_at';
export const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export function validateGuide(payload) {
  const guide = {
    slug: typeof payload?.slug === 'string' ? payload.slug.trim() : '',
    title: typeof payload?.title === 'string' ? payload.title.trim() : '',
    category: typeof payload?.category === 'string' ? payload.category.trim() : '',
    description: typeof payload?.description === 'string' ? payload.description.trim() : '',
    body: typeof payload?.body === 'string' ? payload.body : '',
    position: Number(payload?.position),
    is_published: payload?.is_published === true,
  };
  if (!SLUG_RE.test(guide.slug)) return { error: 'Slug must be 1–80 lowercase letters, numbers, or hyphens.' };
  if (!guide.title || guide.title.length > 180) return { error: 'Title is required and must be 180 characters or fewer.' };
  if (!guide.category || guide.category.length > 80) return { error: 'Category is required and must be 80 characters or fewer.' };
  if (guide.description.length > 500) return { error: 'Description must be 500 characters or fewer.' };
  if (typeof payload?.body !== 'string' || guide.body.length > 120000) return { error: 'Guide text must be 120,000 characters or fewer.' };
  if (!Number.isInteger(guide.position) || guide.position < 0 || guide.position > 100000) return { error: 'Position must be a whole number between 0 and 100000.' };
  return { guide };
}

export function guideCategories(guides, categories = []) {
  return [...new Set([...categories.map(c => typeof c === 'string' ? c : c.name), ...guides.map(g => g.category)].map(c => String(c || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
