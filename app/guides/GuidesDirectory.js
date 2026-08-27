'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Field, Input } from '../../components/ui';
import GuideIcon from './GuideIcon';

function readingTime(body) {
  const words = String(body || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Client-side search/filter over an already-fetched, already-static list.
// The guide count here is small enough (single digits to low dozens) that
// a dedicated search service would be solving a problem that doesn't exist
// yet - this is the same call kingdom846.com's own 49-guide index should
// have made and didn't.
export default function GuidesDirectory({ guides, query, backHref }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set(guides.map((g) => g.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [guides]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guides.filter((g) => {
      const matchesCategory = category === 'All' || g.category === category;
      const matchesSearch =
        !q ||
        g.title.toLowerCase().includes(q) ||
        (g.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [guides, search, category]);

  return (
    <>
      <div className="guides-toolbar">
        <Field label="Search guides" className="guides-search">
          <Input
            type="search"
            tone="console"
            placeholder="Search by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <div className="guides-categories" role="tablist" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              className={`guides-category-tab ${category === c ? 'is-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="guides-error k-narrative">No guides match your search.</div>
      ) : (
        <div className="guides-directory" role="list">
          {filtered.map((guide, index) => (
            <a key={guide.slug} href={`/guides/${guide.slug}${query}`} className="guide-entry" role="listitem">
              <GuideIcon index={index} />
              <span className="guide-entry-copy">
                <span className="k-mark guide-category">{guide.category}</span>
                <strong className="k-display">{guide.title}</strong>
                <span className="k-narrative guide-description">{guide.description}</span>
                <span className="guide-entry-sub">
                  {readingTime(guide.body)} min read
                  {guide.updated_at ? ` · Updated ${new Date(guide.updated_at).toLocaleDateString()}` : ''}
                </span>
              </span>
              <span className="guide-entry-meta">
                <span>Read Guide</span>
                <b aria-hidden="true">→</b>
              </span>
            </a>
          ))}
        </div>
      )}

      <div className="guides-ledger">
        <span className="k-mark">Library Ledger</span>
        <p className="k-narrative">Guide titles and text are stored in Supabase. Admin renames are persisted to the same record used by this directory.</p>
      </div>

      <Link href={backHref} className="guides-back">← Return to member hall</Link>
    </>
  );
}
