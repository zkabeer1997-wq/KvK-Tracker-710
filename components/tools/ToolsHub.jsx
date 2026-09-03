import Link from 'next/link';
import { ToolBoxGrid, ToolBoxStyles, ToolCategoryHead } from './ToolBoxGrid';

export default function ToolsHub({ title, description, tools, glyph, backHref = '/tools', backLabel = '← All categories' }) {
  const gridTools = tools.map((tool) => ({
    key: tool.href,
    href: tool.href,
    title: tool.title,
    description: tool.description,
    status: tool.planned ? 'Planned' : 'Available',
    glyph: glyph || title,
  }));

  return (
    <main className="armory tools-workshop">
      <div className="armory-atmos" aria-hidden="true" /><span className="armory-rack-l" aria-hidden="true" /><span className="armory-rack-r" aria-hidden="true" />
      <div className="armory-inner tools-workshop-inner">
        <header className="armory-head tools-workshop-head"><span className="k-mark">Kingdom 710</span><h1 className="k-display armory-title">{title}</h1><p className="k-narrative armory-lede">{description}</p></header>
        <section className="tools-catalog">
          <Link href={backHref} className="tools-category-back">{backLabel}</Link>
          <div className="tools-category-block">
            <ToolCategoryHead title={title} count={gridTools.length} />
            <ToolBoxGrid tools={gridTools} emptyLabel={`${title} tools`} />
          </div>
        </section>
      </div>
      <ToolBoxStyles />
      <style>{`
        .tools-workshop{color:var(--parchment)}
        .tools-workshop-inner{width:min(1100px,100%)}
        .tools-workshop-head{margin-bottom:clamp(28px,5vh,48px)}
        .tools-catalog{display:flex;flex-direction:column;gap:8px}
        .tools-category-back{display:inline-block;margin-bottom:22px;color:var(--brass);font-family:var(--font-body);font-size:12px;text-decoration:none;letter-spacing:.06em}
        .tools-category-back:hover{color:var(--gold-hot)}
        @media(max-width:700px){.tools-workshop-inner{padding-top:86px}}
      `}</style>
    </main>
  );
}
