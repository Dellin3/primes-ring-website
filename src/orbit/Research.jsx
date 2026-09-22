import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import ResearchMethod from './ResearchMethod.jsx'
import ResearchEvidence from './ResearchEvidence.jsx'
import { project } from '../content/project.js'
import { getExample } from '../content/explorationExamples.js'
import { loadObservationCatalog } from '../lib/webObservation.js'
import './Research.css'

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function exampleHref(observation) {
  const example = getExample(observation.dataset_id)
  if (!example) return `/data/${observation.slug}`
  const params = new URLSearchParams({
    variable: example.variableId,
    from: String(example.range[0]),
    to: String(example.range[1]),
    version: example.webProductVersion,
  })
  return `/data/${example.slug}?${params}`
}

function ResearchData() {
  const [catalog, setCatalog] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    loadObservationCatalog().then(value => {
      if (active) { setCatalog(value); setError(false) }
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [attempt])

  const observations = catalog?.observations ?? []
  const recordCount = observations.reduce((total, observation) => total + observation.record_count, 0)
  const variables = observations[0]?.principal_variables.filter(variable => observations.every(observation => observation.principal_variables.some(item => item.id === variable.id))) ?? []
  const samplingIntervals = [...new Set(observations.map(observation => observation.radial_range.sampling_interval))]

  return <section className="research-data glass-panel" aria-labelledby="research-data-title">
    <div className="research-section-heading">
      <div><p className="eyebrow">The observations</p><h2 id="research-data-title">Real signals.<br /><em>A traceable starting point.</em></h2></div>
      <p>Cassini’s radio signals passed through the rings on their way to Earth. The archived profiles let us inspect how power, phase, and optical depth vary with ring radius.</p>
    </div>
    {catalog ? <>
      <dl className="research-metrics">
        <div><dt>Archived products</dt><dd>{String(observations.length).padStart(2, '0')}</dd></div>
        <div><dt>Source records in the collection</dt><dd>{number.format(recordCount)}</dd></div>
        <div><dt>Signal variables per product</dt><dd>{String(variables.length).padStart(2, '0')}</dd></div>
        <div><dt>Radial sampling interval</dt><dd>{samplingIntervals.map(value => number.format(value)).join(' / ')} <span>km</span></dd></div>
      </dl>
      <p className="research-data-note">These counts describe the explorer’s archive, not the number of records processed in the manuscript’s method tests. Sampling interval is the spacing between records, not reconstructed resolution.</p>
      {globalThis.__SATURN_PREVIEW__?.mode === 'examples' && <p className="research-preview-note">This preview includes one example region per observation. The full archive contains the records counted here.</p>}
      <div className="research-table-wrap" tabIndex={0} role="region" aria-label="All Cassini observations, scroll horizontally on small screens">
        <table className="research-observations">
          <caption>All {observations.length} Cassini observations — open any example region</caption>
          <thead><tr><th scope="col">Observation</th><th scope="col">Source records</th><th scope="col">Ring radius · km</th><th scope="col"><span className="research-sr-only">Open observation</span></th></tr></thead>
          <tbody>{observations.map(observation => <tr key={observation.dataset_id}>
            <th scope="row"><Link to={exampleHref(observation)}>{observation.display_name}</Link><span>{observation.ring_observation_id}</span></th>
            <td>{number.format(observation.record_count)}</td>
            <td>{number.format(observation.radial_range.minimum)}–{number.format(observation.radial_range.maximum)}</td>
            <td><Link className="research-open-observation" to={exampleHref(observation)} aria-label={`Explore ${observation.display_name}`}>Explore <span aria-hidden="true">↗</span></Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="research-data-foot">
        <p>Normal optical depth · normalized signal power · phase shift</p>
        <a href={project.dataSourceUrl} target="_blank" rel="noreferrer">Original NASA PDS collection <span aria-hidden="true">↗</span></a>
      </div>
    </> : <div className="research-catalog-state" role="status">
      {error ? <><p>The observation catalog could not be loaded.</p><button type="button" className="button button-secondary" onClick={() => { setError(false); setAttempt(value => value + 1) }}>Try again</button></> : <p>Loading the Cassini data collection…</p>}
    </div>}
    <p className="research-source-context">These are calibrated diffraction-limited profiles (DLP). The explorer preserves the supplied values, loads exact local samples, and links them to their source records. These calibrated profiles retain diffraction effects; they are inputs to reconstruction, not new reconstructed results.</p>
  </section>
}

export default function Research() {
  return <div className="research-page">
    <PageMeta title="Our research — From a signal to a method" path="/research" description="Our MIT PRIMES team’s research on Cassini signals, stationary roots, and numerical methods toward higher-resolution reconstruction of Saturn’s rings." />
    <section className="research-hero" aria-labelledby="research-title">
      <div className="research-hero-copy"><p className="eyebrow">Our research / {project.program}</p><h1 id="research-title">From a signal.<br /><em>To a method.</em></h1><p>Our team develops methods to find stationary roots, follow their branches, and decide when a local integral needs a more reliable calculation. Explore the workflow and the results reported in our manuscript.</p></div>
      <div className="research-project-card glass-panel"><span className="research-project-orbit" aria-hidden="true" /><p className="eyebrow">The team project</p><h2>{project.title}</h2><p className="research-team-names">{project.authors.join(' · ')}</p><p className="research-mentor">Mentored by {project.mentor}</p></div>
    </section>

    <ResearchMethod />
    <ResearchEvidence />

    <details className="research-archive-disclosure">
      <summary><span><span className="eyebrow">03 / Explore the archive</span><strong>Six observations. Six ways into the data.</strong><span className="research-archive-description">Open the Cassini collection available in the explorer.</span></span><span className="research-archive-plus" aria-hidden="true">+</span></summary>
      <ResearchData />
    </details>

    <section className="research-publication" aria-labelledby="research-publication-title">
      <div><p className="eyebrow">Source & scope</p><h2 id="research-publication-title">A step toward reconstruction.</h2><p>Methods and results are transcribed from the team’s working manuscript, <cite>{project.title}</cite>, sections 3–6. The experiments test synthetic root functions and a scalar phase model with Cassini-derived parameters. A complete high-resolution ring-profile reconstruction and its accuracy are not established by these results.</p><p className="research-publication-status">This page presents the manuscript’s reported evidence. The full manuscript and scientific solver are not hosted here; the linked repository contains the website.</p></div>
      <div className="research-publication-links"><Link className="button button-primary" to="/data">Explore the source data <span aria-hidden="true">↗</span></Link><a href={project.repositoryUrl} target="_blank" rel="noreferrer">Website source code <span aria-hidden="true">↗</span></a></div>
    </section>
  </div>
}
