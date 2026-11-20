import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EvidenceTag from '../../components/common/EvidenceTag.jsx'
import { explorerHref, findObservation, formatObservationDate, guidedObservations, shortName } from '../../content/rings.js'
import { activityHref, labActivities } from '../../content/labActivities.js'
import { fetchJsonCached, loadExactRange } from '../../lib/webObservation.js'
import { displayUnit } from '../../lib/profileRendering.js'
import { useInView } from '../../lib/motion.js'

const exact = value => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value) : 'Missing'
const signed = value => Number.isFinite(value) ? `${value > 0 ? '+' : ''}${exact(value)}` : 'Missing'
const km = value => Math.round(value).toLocaleString('en-US')

// Three windows from the guided observations on the Rings page. Their numbers
// are re-measured from the exact data by tests/saturn-content.test.mjs.
const choices = [
  { id: 'encke-gap', label: 'Encke Gap', invitation: 'Choose a point inside the gap.' },
  { id: 'maxwell-ringlet', label: 'Maxwell Gap', invitation: 'Find the narrow spike inside the gap.' },
  { id: 'c-to-b', label: 'C ring meets B ring', invitation: 'Find the radius where optical depth jumps.' },
].map(choice => {
  const guided = guidedObservations.find(item => item.id === choice.id)
  return { ...choice, guided, observation: findObservation(guided.slug) }
})

export default function ObservationPreview() {
  const sectionRef = useRef(null)
  const near = useInView(sectionRef, '500px 0px')
  const [choiceId, setChoiceId] = useState(choices[0].id)
  const choice = choices.find(item => item.id === choiceId)
  const [zoom, setZoom] = useState(null)
  const [load, setLoad] = useState({ key: '', status: 'idle' })
  const [retry, setRetry] = useState(0)
  const [selection, setSelection] = useState({ key: '', indices: [] })
  const key = `${choice.id}:${retry}`
  const range = zoom?.key === choice.id ? zoom.range : choice.guided.range
  // The chart is the explorer's own component, loaded with the data.
  const [Chart, setChart] = useState(null)
  useEffect(() => {
    if (!near || Chart) return undefined
    let cancelled = false
    import('../../components/data/ScientificProfileCanvas.jsx').then(module => { if (!cancelled) setChart(() => module.default) }).catch(() => { if (!cancelled) setLoad({ key, status: 'error' }) })
    return () => { cancelled = true }
  }, [near, Chart, key])

  useEffect(() => {
    if (!near) return undefined
    let cancelled = false
    const base = choice.observation.base_path
    Promise.all([fetchJsonCached(`${base}/metadata.json`), loadExactRange(base, choice.guided.range)]).then(([metadata, result]) => {
      if (metadata.dataset_id !== choice.observation.dataset_id || result.index.dataset_id !== choice.observation.dataset_id) throw new Error('Observation identity mismatch')
      const variable = metadata.principal_variables.find(item => item.id === 'optical_depth')
      if (!cancelled) setLoad({ key, status: 'ready', rows: result.samples, variable, interval: metadata.observation.radial_range.sampling_interval })
    }).catch(() => { if (!cancelled) setLoad({ key, status: 'error' }) })
    return () => { cancelled = true }
  }, [near, key, choice])

  const ready = load.key === key && load.status === 'ready'
  const rows = useMemo(() => ready ? load.rows.filter(row => row.ring_radius_km >= range[0] && row.ring_radius_km <= range[1]) : [], [ready, load.rows, range])
  const indices = selection.key === `${key}:${range[0]}:${range[1]}` ? selection.indices : []
  const points = indices.map(index => rows.find(row => row.sample_index === index)).filter(Boolean)
  const [pointA, pointB] = points
  const variable = load.variable || { id: 'optical_depth', label: 'Normal optical depth', unit: 'dimensionless' }
  const unit = displayUnit(variable.unit)

  function inspect(sample) {
    const selectionKey = `${key}:${range[0]}:${range[1]}`
    if (!sample) return setSelection({ key: selectionKey, indices: [] })
    setSelection(previous => {
      const current = previous.key === selectionKey ? previous.indices : []
      if (current.at(-1) === sample.sample_index) return previous
      return { key: selectionKey, indices: [...current.filter(index => index !== sample.sample_index), sample.sample_index].slice(-2) }
    })
  }
  function zoomTo(next) {
    const from = Math.max(choice.guided.range[0], Math.min(next[0], next[1]))
    const to = Math.min(choice.guided.range[1], Math.max(next[0], next[1]))
    if (to - from < (load.interval || 0.25) * 4) return
    setZoom({ key: choice.id, range: [Number(from.toFixed(2)), Number(to.toFixed(2))] })
  }
  const zoomed = range[0] !== choice.guided.range[0] || range[1] !== choice.guided.range[1]
  const viewRange = range.map(value => Math.round(value * 4) / 4)
  const statusMessage = load.status === 'error' && load.key === key ? 'The exact samples could not be loaded.' : !ready ? 'Loading verified samples…' : !rows.length ? 'No samples in this window.' : ''

  return <section ref={sectionRef} className="home-band home-try" id="try-observation" aria-labelledby="try-title">
    <div className="home-band-inner try-layout">
      <div className="try-copy" data-reveal>
        <p className="home-kicker"><span className="mono">02</span> Try one real observation</p>
        <h2 id="try-title">{choice.invitation}</h2>
        <p className="try-question">{choice.guided.question}</p>
        <p className="try-context">{shortName(choice.guided.slug)}, recorded {formatObservationDate(choice.observation)}: {km(choice.guided.range[0])}–{km(choice.guided.range[1])} km from Saturn’s center, every exact sample in that window.</p>
      </div>
      <div className="try-tools">
        <ol className="try-actions-list">
          <li><strong>Inspect a point.</strong> Click or tap the chart; arrow keys step from sample to sample. Pick a second point to compare.</li>
          <li><strong>Change the region.</strong> Drag across the chart to zoom in, or choose another region below.</li>
          <li><strong>Measure it properly.</strong> The guided measurement compares two observations with one rule.</li>
        </ol>
        <div className="try-choices" role="group" aria-label="Choose a region">
          {choices.map(item => <button key={item.id} type="button" aria-pressed={item.id === choice.id} onClick={() => { setChoiceId(item.id); setZoom(null) }}><span>{item.label}</span><small>{shortName(item.guided.slug)}</small></button>)}
        </div>
      </div>
      <div className="try-instrument surface-instrument" data-reveal>
        <div className="try-instrument-head">
          <p><strong>{shortName(choice.guided.slug)}</strong> <span className="mono">{exact(range[0])}–{exact(range[1])} km</span></p>
          <EvidenceTag kind="observation" />
        </div>
        <div className="try-chart">
          {Chart ? <Chart samples={rows} variable={variable} inspectedSample={pointB || pointA} comparisonSample={pointB ? pointA : null} onInspect={inspect} dataMode={ready ? 'exact' : 'loading_exact'} scopeLabel={`${shortName(choice.guided.slug)}, ${choice.label}`} statusMessage={statusMessage} samplingInterval={load.interval || 0.25} requestedRange={range} onSelectRange={zoomTo} />
            : <div className="scientific-profile"><p className="try-legend-placeholder" aria-hidden="true" /><div className="scientific-profile-frame"><p className="scientific-profile-status" role="status">{statusMessage || 'Loading verified samples…'}</p></div></div>}
        </div>
        {load.status === 'error' && load.key === key && <button className="button button-secondary" type="button" onClick={() => setRetry(value => value + 1)}>Try loading again</button>}
        <div className="try-readout" aria-live="polite">
          {[['A', pointA], ['B', pointB]].map(([label, sample]) => <div key={label} className={`try-point is-${label.toLowerCase()}${sample ? ' has-sample' : ''}`}>
            <span className="try-point-label">Point {label}</span>
            {sample ? <><strong className="mono">{exact(sample[variable.id])}</strong><span className="mono">{exact(sample.ring_radius_km)} km · sample {sample.sample_index.toLocaleString('en-US')}</span></> : <span>{label === 'A' ? 'Choose a point on the chart.' : 'Choose a second point to compare.'}</span>}
          </div>)}
          <div className="try-point is-delta"><span className="try-point-label">Difference B − A</span>{pointB ? <><strong className="mono">{signed(pointB[variable.id] - pointA[variable.id])}</strong><span className="mono">{unit === 'dimensionless' ? 'no unit' : unit} · Δ radius {signed(pointB.ring_radius_km - pointA.ring_radius_km)} km</span></> : <span>—</span>}</div>
        </div>
        <div className="try-links">
          {zoomed && <button type="button" className="button button-quiet" onClick={() => setZoom(null)}>Show the whole window</button>}
          <Link className="button button-secondary" to={explorerHref(choice.guided.slug, viewRange)}>Open this view in the explorer <span aria-hidden="true">→</span></Link>
          {choice.id === 'encke-gap' ? <Link className="button button-primary" to={activityHref(labActivities['encke-width'])}>Measure the gap’s width <span aria-hidden="true">→</span></Link> : <Link className="button button-primary" to={`/rings#guided-${choice.id}`}>Read what the data show <span aria-hidden="true">→</span></Link>}
        </div>
      </div>
    </div>
  </section>
}
