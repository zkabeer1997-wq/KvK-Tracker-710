'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Field, Input } from '../../components/ui';
import GuideIcon from './GuideIcon';

function readingTime(body) {
  const words = String(body || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

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
                <strong className="guide-entry-title">{guide.title}</strong>
                <span className="guide-description">{guide.description}</span>
                <span className="guide-entry-sub">
                  {readingTime(guide.body)} min read
                  {guide.updated_at ? ` · Updated ${new Date(guide.updated_at).toLocaleDateString()}` : ''}
                </span>
              </span>
              <span className="guide-entry-meta">
                <span>Open guide</span>
                <b aria-hidden="true">→</b>
              </span>
            </a>
          ))}
        </div>
      )}

      <Link href={backHref} className="guides-back">← Return to member page</Link>
    </>
  );
}
