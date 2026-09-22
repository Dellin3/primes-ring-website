import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { loadObservationCatalog, loadObservationSummary, overviewSamples } from '../lib/webObservation.js'
import { explorationHref, readExplorations } from '../lib/explorations.js'
import { getExample } from '../content/explorationExamples.js'

function Arrow() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> }

function SignalPreview() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    loadObservationCatalog().then(async catalog => {
      const observation = catalog.observations.find(item => item.dataset_id === catalog.featured_dataset_id) || catalog.observations[0]
      const summary = await loadObservationSummary(observation.base_path)
      if (active) setData({ observation, samples: overviewSamples(summary.overview) })
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [])
  const chart = useMemo(() => {
    if (!data) return null
    const rows = data.samples
    const values = rows.map(row => row.optical_depth).filter(Number.isFinite)
    if (!values.length) return null
    const minY = Math.min(0, ...values), maxY = Math.max(...values)
    const minX = data.observation.radial_range.minimum, maxX = data.observation.radial_range.maximum
    let connected = false
    const d = rows.map(row => {
      if (!Number.isFinite(row.optical_depth) || !Number.isFinite(row.ring_radius_km)) { connected = false; return '' }
      const prefix = connected ? 'L' : 'M'; connected = true
      return `${prefix}${(12 + (row.ring_radius_km - minX) / (maxX - minX) * 746).toFixed(1)},${(114 - (row.optical_depth - minY) / (maxY - minY || 1) * 99).toFixed(1)}`
    }).join(' ')
    return { d, minX, maxX, minY, maxY }
  }, [data])
  const example = data && getExample(data.observation.dataset_id)
  const href = example ? `/data/${example.slug}?variable=optical_depth&from=${example.range[0]}&to=${example.range[1]}&version=${example.webProductVersion}` : '/data'
  return <Link className="signal-dock glass-panel" to={href} aria-label="Open an example region in the Cassini data explorer">
    <div className="signal-copy"><span className="eyebrow">Your first observation</span><h2>A signal.<br />A place to begin.</h2><span className="signal-source mono">REV 133 · X-BAND · DSN 43</span></div>
    <div className="signal-chart"><div className="signal-labels"><span>Normal optical depth <span className="muted">(dimensionless)</span></span><span className="mono">OVERVIEW</span></div>
      {chart ? <svg viewBox="0 0 780 146" role="img" aria-label="A reduced overview of actual Cassini Rev 133 optical depth, plotted against ring radius in kilometers"><defs><linearGradient id="signal-line"><stop stopColor="#8dbce8" /><stop offset="1" stopColor="#e1c69c" /></linearGradient></defs>{[25, 70, 114].map(y => <line key={y} x1="12" x2="758" y1={y} y2={y} stroke="rgba(178,203,237,.12)" />)}<path d={chart.d} stroke="url(#signal-line)" strokeWidth="1.5" fill="none" /><text x="12" y="140">{Math.round(chart.minX).toLocaleString('en-US')} km</text><text x="758" y="140" textAnchor="end">{Math.round(chart.maxX).toLocaleString('en-US')} km</text></svg> : <div className="signal-loading">{error ? 'Open the explorer to load the observation.' : 'Loading the signal…'}</div>}
      <div className="signal-chart-foot"><span>{data ? `${data.observation.record_count.toLocaleString('en-US')} source records` : 'NASA Planetary Data System'}</span><span>Open a region ↗</span></div>
    </div><span className="dock-arrow" aria-hidden="true">↗</span>
  </Link>
}

export default function Home() {
  const [last] = useState(() => { const store = readExplorations(); return [...store.records, ...Object.values(store.drafts)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] })
  return <><PageMeta title="Saturn — A Cassini Explorer" description="Explore real Cassini observations of Saturn’s rings. Compare exact samples, follow a question, and save your research notes." />
    <section className="home-hero" aria-labelledby="home-title"><div className="hero-copy"><p className="mission-tag"><span />MIT PRIMES <span className="tag-divider">/</span> 2026</p><h1 id="home-title">Every ring.<br /><em>A new question.</em></h1><p className="hero-description">Look closer at Saturn through real Cassini data.<br className="desktop-break" /> Follow a signal. Make an observation.<br className="desktop-break" /> Keep exploring.</p><div className="hero-actions"><Link to="/data" className="button button-primary">Explore the rings <Arrow /></Link><Link to={last ? explorationHref(last) : '/explorations'} className="button button-quiet">{last ? 'Continue exploring' : 'My notebook'} <Arrow /></Link></div><div className="hero-facts"><div><strong>06</strong><span>Observations</span></div><div><strong>03</strong><span>Signal variables</span></div><div><strong>NASA</strong><span>PDS source data</span></div></div></div><div className="planet-caption" aria-hidden="true"><span>SATURN</span><span>RINGS, SEEN DIFFERENTLY</span></div></section>
    <SignalPreview />
  </>
}
