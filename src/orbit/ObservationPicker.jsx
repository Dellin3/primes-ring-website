import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getExample } from '../content/explorationExamples.js'
import { loadObservationCatalog } from '../lib/webObservation.js'
import './ObservationPicker.css'

function exampleHref(observation) {
  const example = getExample(observation.dataset_id)
  const params = example ? new URLSearchParams({
    from: String(example.range[0]),
    to: String(example.range[1]),
    variable: example.variableId,
    version: example.webProductVersion,
  }) : null
  // Explicit example URLs open a fresh draft. Existing saved views retain
  // their own identities and remain available from the notebook.
  return `/data/${observation.slug}${params ? `?${params}` : ''}`
}

export default function ObservationPicker({ catalog, currentDatasetId, onChoose, notebook = false }) {
  const [request, setRequest] = useState({ status: 'loading' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (catalog) return undefined
    let cancelled = false
    loadObservationCatalog().then((loaded) => {
      if (loaded.validation_status !== 'pass' || !loaded.observations?.length) throw new Error('Observation catalog unavailable')
      if (!cancelled) setRequest({ status: 'ready', catalog: loaded })
    }).catch(() => { if (!cancelled) setRequest({ status: 'error' }) })
    return () => { cancelled = true }
  }, [catalog, retry])
  const observations = (catalog || request.catalog)?.observations

  return <section className={`orbit-observation-picker${notebook ? ' is-notebook' : ''}`} aria-label="Available Cassini observations">
    <div className="orbit-observation-picker-heading"><h2>{observations ? `${notebook ? 'Browse all' : 'Choose from'} ${observations.length} observations` : 'Browse Cassini observations'}</h2><p>{notebook ? 'Your notebook holds your own drafts and saved views. Open any observation below to start exploring.' : 'Each observation opens at an example region. Your previous notes stay in your notebook.'}</p></div>
    {observations ? <div className="orbit-observation-choices">{observations.map((observation) => {
      const current = observation.dataset_id === currentDatasetId
      const content = <><span className="orbit-observation-choice-title"><strong>Rev {String(observation.revolution_number).padStart(3, '0')}</strong><span aria-hidden="true">{current ? '●' : '↗'}</span></span><span>{observation.ring_profile_direction === 'INGRESS' ? 'Ingress' : 'Egress'} · {observation.band}{observation.dsn_station_number}</span></>
      return current ? <div key={observation.dataset_id} className="orbit-observation-choice is-current" aria-current="true" aria-label={`${observation.display_name}, current observation`}>{content}</div> : <Link key={observation.dataset_id} className="orbit-observation-choice" to={exampleHref(observation)} aria-label={`Explore ${observation.display_name}`} onClick={onChoose}>{content}</Link>
    })}</div> : request.status === 'error' ? <p className="orbit-observation-picker-error" role="alert">The observation list could not be loaded. <button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button> or <Link to="/data">open the explorer ↗</Link>.</p> : <p className="orbit-observation-picker-loading" role="status">Loading the observation list…</p>}
  </section>
}
