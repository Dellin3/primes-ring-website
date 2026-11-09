import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getExample } from '../content/explorationExamples.js'
import { formatObservationDate, observationCoverage } from '../content/rings.js'
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

// With "keep this window" on, a switch keeps the current radial window (and
// threshold or activity) whenever the other observation covers it.
function windowHref(observation, keepWindow) {
  if (!keepWindow) return exampleHref(observation)
  const [from, to] = [Number(keepWindow.get('from')), Number(keepWindow.get('to'))]
  const covers = Number.isFinite(from) && Number.isFinite(to) && observation.radial_range.minimum <= from && observation.radial_range.maximum >= to
  return covers ? `/data/${observation.slug}?${keepWindow}` : exampleHref(observation)
}

export default function ObservationPicker({ catalog, currentDatasetId, onChoose, notebook = false, windowParams = null, keepWindowDefault = false }) {
  const [request, setRequest] = useState({ status: 'loading' })
  const [keepWindow, setKeepWindow] = useState(keepWindowDefault)
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
    <div className="orbit-observation-picker-heading"><h2>{observations ? `${notebook ? 'Browse all' : 'Choose from'} ${observations.length} observations` : 'Browse Cassini observations'}</h2><p>{notebook ? 'Your notebook holds your own drafts and saved views. Open any observation below to start exploring.' : keepWindow ? 'Switching keeps this radial window wherever the other observation covers it.' : 'Each observation opens at an example region. Your previous notes stay in your notebook.'}</p></div>
    <div className="orbit-observation-tools">{windowParams && <label className="orbit-observation-keep"><input type="checkbox" checked={keepWindow} onChange={(event) => setKeepWindow(event.target.checked)} />Keep this window when switching</label>}<details className="orbit-observation-legend"><summary>What do these labels mean?</summary><dl><div><dt>Rev</dt><dd>Cassini’s label for an orbit of Saturn.</dd></div><div><dt>Date</dt><dd>The day of the occultation, from the PDS ring observation ID.</dd></div><div><dt>Ingress / egress</dt><dd>The two directions in which the signal path can cross the rings during an occultation; each profile records one.</dd></div><div><dt>X-band · DSN</dt><dd>The 3.6 cm radio signal, and the NASA Deep Space Network antenna number that received it.</dd></div><div><dt>Coverage</dt><dd>The main rings inside the profile’s radial range, from the PDS ring table.</dd></div><div><dt>Rows</dt><dd>Source records, one every {observations?.[0]?.radial_range.sampling_interval ?? 0.25} km of ring radius.</dd></div></dl></details></div>
    {observations ? <div className="orbit-observation-choices">{observations.map((observation) => {
      const current = observation.dataset_id === currentDatasetId
      const content = <><span className="orbit-observation-choice-title"><strong>Rev {String(observation.revolution_number).padStart(3, '0')}</strong><span aria-hidden="true">{current ? '●' : '↗'}</span></span><span className="orbit-observation-date">{formatObservationDate(observation)}</span><span>{observation.ring_profile_direction === 'INGRESS' ? 'Ingress' : 'Egress'} · {observation.band}-band · DSN {observation.dsn_station_number}</span><span>{observationCoverage(observation)}</span><span className="orbit-observation-rows">{observation.record_count.toLocaleString('en-US')} rows</span></>
      return current ? <div key={observation.dataset_id} className="orbit-observation-choice is-current" aria-current="true" aria-label={`${observation.display_name}, current observation`}>{content}</div> : <Link key={observation.dataset_id} className="orbit-observation-choice" to={windowHref(observation, keepWindow ? windowParams : null)} aria-label={`Explore ${observation.display_name}, ${formatObservationDate(observation)}`} onClick={onChoose}>{content}</Link>
    })}</div> : request.status === 'error' ? <p className="orbit-observation-picker-error" role="alert">The observation list could not be loaded. <button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button> or <Link to="/data">open the explorer ↗</Link>.</p> : <p className="orbit-observation-picker-loading" role="status">Loading the observation list…</p>}
  </section>
}
