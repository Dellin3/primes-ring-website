import { Fragment } from 'react'
import { sourceList, sources } from '../content/saturn.js'
// The section pages reuse the research story's editorial styles so every page
// shares one visual language; SaturnPage.css adds only section-specific parts.
import './Research.css'
import './SaturnPage.css'

export function Outbound({ href, children, className = '' }) {
  return <a className={`research-text-link ${className}`} href={href} target="_blank" rel="noreferrer">{children}<span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
}

export function SectionHero({ eyebrow, title, emphasis, intro, sources, chapters = [] }) {
  return <header className="research-story-hero saturn-hero">
    <p className="eyebrow">{eyebrow}</p>
    <div className="research-story-hero-copy"><h1>{title}<br /><em>{emphasis}</em></h1>{sources ? <div className="saturn-hero-intro"><p>{intro}</p><SourceNote ids={sources} /></div> : <p>{intro}</p>}</div>
    {chapters.length > 0 && <nav className="research-story-index saturn-chapters" style={{ '--chapters': chapters.length }} aria-label="On this page">{chapters.map((chapter, index) => <a key={chapter.id} href={`#${chapter.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.label}</a>)}</nav>}
  </header>
}

export function Chapter({ id, number, eyebrow, title, emphasis, children, intro, className = '' }) {
  return <section className={`saturn-chapter ${className}`} id={id} aria-labelledby={`${id}-title`}>
    <header className="saturn-chapter-heading">
      <p className="eyebrow">{number} / {eyebrow}</p>
      <h2 id={`${id}-title`}>{title}{emphasis && <><br /><em>{emphasis}</em></>}</h2>
      {intro && <p>{intro}</p>}
    </header>
    {children}
  </section>
}

// A compact “Source:” line under a fact, a card, or a table.
export function SourceNote({ ids, label = 'Source' }) {
  const list = sourceList(ids)
  return <p className="saturn-source-note"><span>{list.length > 1 ? `${label}s` : label}:</span> {list.map((source, index) => <Fragment key={source.id}>{index > 0 && <span aria-hidden="true"> · </span>}<a href={source.url} target="_blank" rel="noreferrer">{source.publisher.split(' · ')[0]}<span className="sr-only">: {source.title} (opens in a new tab)</span></a></Fragment>)}</p>
}

export function SourcesCard({ ids, title = 'Where these facts come from', children }) {
  const unique = [...new Set(ids)].filter(id => sources[id])
  return <aside className="research-source-card saturn-sources" aria-labelledby="page-sources-title">
    <p className="eyebrow">Sources</p>
    <h2 id="page-sources-title">{title}</h2>
    {children}
    <ul className="saturn-source-list">{sourceList(unique).map(source => <li key={source.id}><Outbound href={source.url}>{source.title}</Outbound><span>{source.publisher}</span></li>)}</ul>
  </aside>
}
