import { Fragment } from 'react'
import { sourceList, sources } from '../content/saturn.js'
import { photoSrc } from '../content/photos.js'
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

function SourceLink({ source, children }) {
  return <a href={source.url} target="_blank" rel="noreferrer">{children}<span className="sr-only">: {source.title} (opens in a new tab)</span></a>
}

// A compact “Source:” line under a fact, a card, or a table. Pages from the
// same publisher are grouped so two links never read as the same source.
export function SourceNote({ ids, label = 'Source' }) {
  const list = sourceList(ids)
  const groups = []
  for (const source of list) {
    const publisher = source.publisher.split(' · ')[0]
    const group = groups.find(item => item.publisher === publisher)
    if (group) group.items.push(source)
    else groups.push({ publisher, items: [source] })
  }
  return <p className="saturn-source-note"><span>{list.length > 1 ? `${label}s` : label}:</span> {groups.map((group, index) => <Fragment key={group.publisher}>
    {index > 0 && <span aria-hidden="true"> · </span>}
    {group.items.length === 1
      ? <SourceLink source={group.items[0]}>{group.publisher}</SourceLink>
      : <>{group.publisher}: {group.items.map((source, item) => <Fragment key={source.id}>{item > 0 && ', '}<SourceLink source={source}>{source.short || source.title}</SourceLink></Fragment>)}</>}
  </Fragment>)}</p>
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

const photoWidths = { hero: 1800, wide: 1600, gallery: 900, card: 800, inline: 1000, panel: 1000 }

// A NASA photograph with its caption, how the colors were made, the date,
// and a credit line that links to the NASA page it was checked against.
export function Photo({ photo, variant = 'wide', caption = true }) {
  const meta = [photo.mission, photo.kind, photo.date].filter(Boolean).join(' · ')
  return <figure className={`saturn-photo is-${variant}${photo.fit === 'contain' ? ' is-contain' : ''}`}>
    <div className="saturn-photo-frame"><img src={photoSrc(photo, photoWidths[variant])} width={photo.width} height={photo.height} alt={photo.alt} loading={variant === 'hero' ? 'eager' : 'lazy'} decoding="async" /></div>
    <figcaption>
      {caption && <span className="saturn-photo-caption">{photo.caption}</span>}
      <span className="saturn-photo-meta">{meta}</span>
      <span className="saturn-photo-credit">{photo.credit} · <a href={photo.page} target="_blank" rel="noreferrer">{photo.ref}<span aria-hidden="true"> ↗</span><span className="sr-only">: {photo.title} (opens in a new tab)</span></a></span>
    </figcaption>
  </figure>
}

// A long panorama that keeps its labels legible by scrolling sideways.
export function PhotoStrip({ photo }) {
  return <figure className="saturn-photo is-strip">
    <div className="saturn-photo-frame" role="region" aria-label={`${photo.title}. Scroll sideways to see the whole image.`} tabIndex={0}><img src={photoSrc(photo)} width={photo.width} height={photo.height} alt={photo.alt} loading="lazy" decoding="async" /></div>
    <figcaption>
      <span className="saturn-photo-hint" aria-hidden="true">Scroll sideways to follow the rings outward →</span>
      <span className="saturn-photo-caption">{photo.caption}</span>
      <span className="saturn-photo-meta">{[photo.mission, photo.kind, photo.date].filter(Boolean).join(' · ')}</span>
      <span className="saturn-photo-credit">{photo.credit} · <a href={photo.page} target="_blank" rel="noreferrer">{photo.ref}<span aria-hidden="true"> ↗</span><span className="sr-only">: {photo.title} (opens in a new tab)</span></a></span>
    </figcaption>
  </figure>
}

export function PhotoGallery({ items, label }) {
  return <div className={`saturn-gallery${items.length === 2 ? ' is-two' : ''}`} role="group" aria-label={label}>{items.map(photo => <Photo key={photo.ref + photo.title} photo={photo} variant="gallery" />)}</div>
}
