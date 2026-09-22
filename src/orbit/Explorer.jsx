import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ScientificProfileCanvas from '../components/data/ScientificProfileCanvas.jsx'
import PageMeta from '../components/common/PageMeta.jsx'
import { getExample } from '../content/explorationExamples.js'
import { getFeaturedObservation } from '../content/observations.js'
import { displayUnit } from '../lib/profileRendering.js'
import { buildExactWindowCsv, estimatedRecordCount, exactWindowFilename, loadExactRange, loadObservationCatalog, loadObservationSummary, overviewSamples, sourceDatasetUrl } from '../lib/webObservation.js'
import { downloadText, observationMarkdown, readExplorations, saveDraft, saveExploration } from '../lib/explorations.js'
import { canonicalSessionParams, restoreExplorerSession } from '../lib/explorerSession.js'
import './Explorer.css'

const number = (value, digits = 6) => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) : 'Missing'
const scientific = (value) => !Number.isFinite(value) ? 'Missing' : value !== 0 && (Math.abs(value) < 0.00001 || Math.abs(value) >= 1e7) ? value.toExponential(5) : number(value)
const signed = (value) => Number.isFinite(value) ? `${value > 0 ? '+' : ''}${scientific(value)}` : 'Unavailable'
const validNumber = (value) => value !== null && String(value).trim() !== '' && Number.isFinite(Number(value))
const metricNames = { optical_depth: 'Optical depth', signal_power: 'Signal power', phase_shift: 'Phase shift' }
const emptySelection = []

function RangeForm({ range, fullRange, onApply }) {
  const [from, setFrom] = useState(String(range[0]))
  const [to, setTo] = useState(String(range[1]))
  const [error, setError] = useState('')
  function apply(event) {
    event.preventDefault()
    if (!validNumber(from) || !validNumber(to)) return setError('Enter two radius boundaries.')
    const next = [Number(from), Number(to)]
    if (next[0] > next[1]) return setError('Start radius must be at or below end radius.')
    if (next[0] < fullRange[0] || next[1] > fullRange[1]) return setError(`Choose radii between ${number(fullRange[0])} and ${number(fullRange[1])} km.`)
    setError('')
    onApply(next)
  }
  return <form className="explorer-range" onSubmit={apply} noValidate>
    <label>From <span>km</span><input aria-label="From radius (km)" type="number" step="any" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
    <span className="explorer-range-dash" aria-hidden="true">—</span>
    <label>To <span>km</span><input aria-label="To radius (km)" type="number" step="any" value={to} onChange={(event) => setTo(event.target.value)} /></label>
    <button className="button button-secondary" type="submit">Apply</button>
    {error && <p className="explorer-alert" role="alert">{error}</p>}
  </form>
}

function useCsvDownload(metadata, samples, range, variableId) {
  const [asset, setAsset] = useState(null)
  const key = `${metadata.dataset_id}:${range[0]}:${range[1]}:${variableId}`
  useEffect(() => {
    let cancelled = false
    let url
    Promise.resolve().then(() => {
      if (cancelled || !samples.length) return
      try {
        const text = buildExactWindowCsv(metadata, samples, new Date(), { range, variableId })
        url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
        setAsset({ key, url, filename: exactWindowFilename(metadata, samples, range) })
      } catch { setAsset({ key, error: true }) }
    })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [key, metadata, range, samples, variableId])
  return samples.length && asset?.key === key ? asset : null
}

function PointCard({ sample, label, variable }) {
  return <div className={`explorer-point ${sample ? 'has-sample' : ''}`}>
    <div><span className={`explorer-point-marker marker-${label.toLowerCase()}`}>{label}</span><span>{sample ? `Sample ${sample.sample_index.toLocaleString('en-US')}` : `Point ${label}`}</span></div>
    {sample ? <><strong className="mono">{scientific(sample[variable.id])}</strong><span className="explorer-point-radius mono">{number(sample.ring_radius_km)} km</span></> : <p>{label === 'A' ? 'Choose a point on the chart.' : 'Choose another to compare.'}</p>}
  </div>
}

function LoadedExplorer({ catalog, observation, metadata, overview }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [session] = useState(() => restoreExplorerSession(params, metadata, observation, readExplorations(), globalThis.crypto.randomUUID()))
  const restored = session.restored
  const example = getExample(metadata.dataset_id)
  const fullRange = useMemo(() => [metadata.observation.radial_range.minimum, metadata.observation.radial_range.maximum], [metadata])
  const queryRange = [params.get('from'), params.get('to')]
  const queryValid = queryRange.every(validNumber) && Number(queryRange[0]) <= Number(queryRange[1]) && Number(queryRange[0]) >= fullRange[0] && Number(queryRange[1]) <= fullRange[1]
  const restoredValid = restored?.range?.length === 2 && restored.range.every(Number.isFinite) && restored.range[0] >= fullRange[0] && restored.range[1] <= fullRange[1] && restored.range[0] <= restored.range[1]
  const fallback = restoredValid ? restored.range : example?.range || fullRange
  const lower = queryValid ? Number(queryRange[0]) : fallback[0]
  const upper = queryValid ? Number(queryRange[1]) : fallback[1]
  const range = useMemo(() => [lower, upper], [lower, upper])
  const requestedVariable = params.get('variable') || restored?.variable || 'optical_depth'
  const variable = metadata.principal_variables.find((item) => item.id === requestedVariable) || metadata.principal_variables[0]
  const [title, setTitle] = useState(session.title)
  const [notes, setNotes] = useState(restored?.notes || '')
  const [notesOpen, setNotesOpen] = useState(Boolean(params.get('record') || restored?.notes))
  const [savedId, setSavedId] = useState(restored?.id)
  const [createdAt] = useState(restored?.createdAt || new Date().toISOString())
  const [selection, setSelection] = useState({ range: restored?.range || range, indices: restored?.selectedSamples || [] })
  const [exact, setExact] = useState({ key: '', status: 'loading', samples: [] })
  const [retry, setRetry] = useState(0)
  const [receipt, setReceipt] = useState(null)
  const [message, setMessage] = useState('')
  const notesRef = useRef(null)
  const key = `${metadata.dataset_id}:${metadata.web_product_version}:${lower}:${upper}`
  const exactAllowed = estimatedRecordCount(metadata, range) <= metadata.data_product.recommended_exact_window_records
  const status = !exactAllowed ? 'overview' : exact.key === key ? exact.status : 'loading'
  const samples = useMemo(() => status === 'ready' ? exact.samples : [], [exact.samples, status])
  const overviewRows = useMemo(() => overviewSamples(overview), [overview])
  const plotRows = useMemo(() => status === 'ready' ? samples : overviewRows.filter((sample) => sample.ring_radius_km >= lower && sample.ring_radius_km <= upper), [status, samples, overviewRows, lower, upper])
  const selectedIndices = selection.range[0] === lower && selection.range[1] === upper ? selection.indices : emptySelection
  const points = selectedIndices.map((index) => samples.find((sample) => sample.sample_index === index)).filter(Boolean)
  const pointA = points[0]
  const pointB = points[1]
  const inspected = pointB || pointA
  const version = metadata.web_product_version
  const requestedVersion = params.get('version') || restored?.version
  const currentRecord = useMemo(() => ({
    id: savedId, draftId: session.draftId, title, notes, createdAt,
    datasetId: metadata.dataset_id, slug: observation.slug, observationName: observation.display_name,
    version, variable: variable.id, range, selectedSamples: selectedIndices,
    guideProgress: restored?.guideProgress || 'explore', guide: params.has('guide') ? params.get('guide') === '1' : Boolean(restored?.guide),
    mode: params.get('mode') || restored?.mode || 'explore', displayMode: status === 'ready' ? 'exact' : 'overview',
  }), [savedId, session.draftId, title, notes, createdAt, metadata.dataset_id, observation.slug, observation.display_name, version, variable.id, range, selectedIndices, restored, params, status])
  const signature = JSON.stringify(currentRecord)
  const draftRef = useRef(currentRecord)
  const csv = useCsvDownload(metadata, samples, range, variable.id)
  const stats = useMemo(() => {
    const values = samples.map((sample) => sample[variable.id]).filter(Number.isFinite)
    return { count: samples.length, finite: values.length, minimum: values.length ? Math.min(...values) : null, maximum: values.length ? Math.max(...values) : null }
  }, [samples, variable.id])

  useEffect(() => {
    const next = canonicalSessionParams(params, currentRecord, requestedVersion, session.notice)
    if (next.toString() === params.toString()) return
    // Persist before replacing the URL: refresh, Back, and identity remounts
    // must always find the exact draft referenced by the address bar.
    saveDraft({ ...currentRecord, updatedAt: new Date().toISOString() })
    setParams(next, { replace: true, preventScrollReset: true })
  }, [params, currentRecord, requestedVersion, session.notice, setParams])

  useEffect(() => {
    let cancelled = false
    if (!exactAllowed) return undefined
    loadExactRange(observation.base_path, range).then((result) => {
      if (result.index.dataset_id !== metadata.dataset_id) throw new Error('Observation identity mismatch')
      if (!cancelled) setExact({ key, status: 'ready', samples: result.samples })
    }).catch(() => { if (!cancelled) setExact({ key, status: 'error', samples: [] }) })
    return () => { cancelled = true }
  }, [key, exactAllowed, observation.base_path, range, retry, metadata.dataset_id])

  useEffect(() => {
    draftRef.current = currentRecord
    const timer = setTimeout(() => {
      const result = saveDraft({ ...currentRecord, updatedAt: new Date().toISOString() })
      setReceipt({ signature, ...result })
    }, 350)
    return () => clearTimeout(timer)
  }, [currentRecord, signature])

  useEffect(() => {
    function flush() { saveDraft({ ...draftRef.current, updatedAt: new Date().toISOString() }) }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [])

  function updateView(nextRange = range, nextVariable = variable.id) {
    const next = new URLSearchParams(params)
    next.set('from', String(nextRange[0]))
    next.set('to', String(nextRange[1]))
    next.set('variable', nextVariable)
    next.set('version', requestedVersion || version)
    // The draft ID is attached only after saving its content, so links never
    // point to a draft that has not yet reached the shared notebook store.
    saveDraft({ ...currentRecord, updatedAt: new Date().toISOString() })
    next.set('draft', session.draftId)
    setParams(next, { preventScrollReset: true })
    setMessage('')
  }
  function zoom(factor) {
    const center = (lower + upper) / 2
    const span = Math.max(metadata.observation.radial_range.sampling_interval * 4, (upper - lower) * factor)
    const width = Math.min(span, fullRange[1] - fullRange[0])
    const from = Math.max(fullRange[0], Math.min(fullRange[1] - width, center - width / 2))
    updateView([Number(from.toFixed(6)), Number((from + width).toFixed(6))])
  }
  function inspect(sample) {
    if (!sample) return setSelection({ range, indices: [] })
    setSelection((previous) => {
      const indices = previous.range[0] === lower && previous.range[1] === upper ? previous.indices : []
      if (indices.at(-1) === sample.sample_index) return previous
      return { range, indices: [...indices.filter((index) => index !== sample.sample_index), sample.sample_index].slice(-2) }
    })
  }
  function save() {
    const result = saveExploration(currentRecord)
    setSavedId(result.record.id)
    draftRef.current = result.record
    saveDraft({ ...result.record, updatedAt: new Date().toISOString() })
    setMessage(result.persistent ? 'Saved to your notebook.' : result.error)
    if (result.persistent && requestedVersion !== version) {
      const next = new URLSearchParams(params)
      next.set('version', version)
      setParams(next, { replace: true, preventScrollReset: true })
    }
  }
  function exportNotes() {
    try {
      downloadText(observationMarkdown({ ...currentRecord, updatedAt: new Date().toISOString() }, metadata, window.location.origin), `${metadata.dataset_id}_observation.md`)
      setMessage('Notes exported as Markdown.')
    } catch { setMessage('Notes could not be downloaded. Please try again.') }
  }
  const unit = displayUnit(variable.unit)
  const hasDelta = Number.isFinite(pointA?.[variable.id]) && Number.isFinite(pointB?.[variable.id])
  const storageMessage = receipt?.signature === signature ? receipt.persistent ? 'Draft saved in this browser' : receipt.error : session.storageError || 'Saving draft…'
  const plotMode = status === 'ready' ? 'exact' : status === 'loading' ? 'loading_exact' : status
  const plotMessage = status === 'loading' ? 'Loading verified samples…' : status === 'error' ? 'Exact samples could not be verified.' : status === 'ready' && !samples.length ? 'No samples fall inside this window. Widen the range.' : ''

  return <section className="orbit-explorer" aria-labelledby="explorer-title">
    <header className="page-intro explorer-intro"><p className="eyebrow">THE DATA EXPLORER</p><h1 id="explorer-title">Read between the rings.</h1><p>Explore Cassini’s radio signals. Choose a region. Follow what changes.</p></header>
    {(session.notice || params.get('notice') === 'local-note-unavailable') && <p className="explorer-alert" role="alert">{session.notice || 'The requested local note is unavailable for this observation. A fresh draft is open; existing notes are preserved in your notebook.'}</p>}
    {requestedVersion && requestedVersion !== version && <p className="explorer-alert" role="alert">This view requested data version {requestedVersion}; available version is {version}. The original saved note remains unchanged until you save again.</p>}
    {(params.has('from') || params.has('to')) && !queryValid && <p className="explorer-alert" role="alert">The requested radius range is invalid. Showing {number(lower)}–{number(upper)} km; use the radius inputs to choose a valid range.</p>}
    {!metadata.principal_variables.some((item) => item.id === requestedVariable) && <p className="explorer-alert" role="alert">The requested metric is unavailable. Showing {variable.label}.</p>}
    <section className="explorer-workspace glass-panel" aria-label="Cassini observation explorer">
      <div className="explorer-toolbar">
        <label className="explorer-observation-select"><span className="eyebrow">OBSERVATION</span><select value={observation.slug} aria-label="Observation" onChange={(event) => {
          saveDraft({ ...currentRecord, updatedAt: new Date().toISOString() })
          navigate(`/data/${event.target.value}`)
        }}>{catalog.observations.map((item) => <option key={item.dataset_id} value={item.slug}>{item.display_name}</option>)}</select></label>
        <div className="explorer-metrics" role="group" aria-label="Profile metric">{metadata.principal_variables.map((item) => <button key={item.id} type="button" aria-pressed={item.id === variable.id} onClick={() => updateView(range, item.id)}>{metricNames[item.id] || item.label}</button>)}</div>
      </div>
      <div className="explorer-body">
        <div className="explorer-main">
          <div className="explorer-chart-heading"><div><p className="eyebrow">{variable.label}</p><h2>{number(lower, 2)} <span>—</span> {number(upper, 2)} <small>km</small></h2></div><span className={`explorer-data-badge ${status === 'ready' ? 'is-exact' : ''}`}><i />{status === 'ready' ? 'Exact samples' : status === 'overview' ? 'Overview' : status === 'error' ? 'Data unavailable' : 'Loading'}</span></div>
          <ScientificProfileCanvas samples={plotRows} variable={variable} inspectedSample={inspected} comparisonSample={pointB ? pointA : null} onInspect={inspect} dataMode={plotMode} scopeLabel="Selected radial window" statusMessage={plotMessage} samplingInterval={metadata.observation.radial_range.sampling_interval} requestedRange={range} />
          <div className="explorer-chart-caption"><span>{status === 'overview' ? 'Open a smaller region to inspect exact samples.' : variable.id === 'phase_shift' ? 'Stored phase values · unconnected points' : 'Click two points to compare · arrow keys to move'}</span><div className="explorer-zoom"><button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => zoom(2)}>−</button><button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => zoom(0.5)}>+</button></div></div>
          {status === 'error' && <button className="button button-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Retry exact data</button>}
          <div className="explorer-window-controls"><RangeForm key={`${lower}:${upper}`} range={range} fullRange={fullRange} onApply={updateView} /><div className="explorer-presets"><button type="button" className="button button-quiet" onClick={() => updateView(example.range, example.variableId)} disabled={!example}>Example region</button><button type="button" className="button button-quiet" onClick={() => updateView(fullRange)}>Full observation</button></div></div>
          <div className="explorer-bottom">
            <dl className="explorer-stats"><div><dt>Exact rows</dt><dd className="mono">{status === 'ready' ? number(stats.count, 0) : '—'}</dd></div><div><dt>Minimum <span>({unit})</span></dt><dd className="mono">{status === 'ready' ? scientific(stats.minimum) : '—'}</dd></div><div><dt>Maximum <span>({unit})</span></dt><dd className="mono">{status === 'ready' ? scientific(stats.maximum) : '—'}</dd></div></dl>
            <div className="explorer-download">{csv?.url ? <a className="button button-secondary" href={csv.url} download={csv.filename}>Download CSV <span aria-hidden="true">↓</span></a> : <button className="button button-secondary" type="button" disabled>Download CSV <span aria-hidden="true">↓</span></button>}{csv?.error && <span role="alert">CSV could not be prepared.</span>}</div>
          </div>
          {status === 'ready' && stats.finite < stats.count && <p className="explorer-missing">{number(stats.count - stats.finite, 0)} missing {metricNames[variable.id]?.toLowerCase()} values excluded from the minimum and maximum.</p>}
        </div>
        <aside className="explorer-sidebar" aria-label={notesOpen ? 'Observation notes' : 'Sample comparison'}>
          {notesOpen ? <div className="explorer-notes"><div className="explorer-sidebar-heading"><h3>Your observation</h3><button type="button" aria-label="Close notes" className="explorer-close" onClick={() => setNotesOpen(false)}>×</button></div><label>Title<input value={title} maxLength={160} onChange={(event) => { setTitle(event.target.value); setMessage('') }} /></label><label>Notes<textarea ref={notesRef} rows={8} value={notes} maxLength={20000} placeholder="What do you notice? What would you check next?" onChange={(event) => { setNotes(event.target.value); setMessage('') }} /></label><button className="button button-primary" type="button" onClick={save}>Save to notebook <span aria-hidden="true">↗</span></button><div className="explorer-note-links"><button type="button" onClick={exportNotes}>Export notes ↓</button><Link to="/explorations">Notebook →</Link></div><p className="explorer-save-status" role="status">{message || storageMessage}</p></div> : <div className="explorer-inspect"><div className="explorer-sidebar-heading"><h3>Look a little closer.</h3>{points.length > 0 && <button type="button" className="explorer-clear" onClick={() => inspect(null)}>Clear</button>}</div><p className="explorer-inspect-intro">Two points. A change worth noticing.</p><PointCard sample={pointA} label="A" variable={variable} /><PointCard sample={pointB} label="B" variable={variable} /><div className="explorer-delta"><span>Difference <small>B − A</small></span><strong className="mono">{pointB ? hasDelta ? signed(pointB[variable.id] - pointA[variable.id]) : 'Missing' : '—'}</strong><small>{unit}{pointB ? ` · Δ radius ${signed(pointB.ring_radius_km - pointA.ring_radius_km)} km` : ''}</small></div><button className="button button-primary" type="button" onClick={() => { setNotesOpen(true); requestAnimationFrame(() => notesRef.current?.focus()) }}>Save a note <span aria-hidden="true">↗</span></button></div>}
          <details className="explorer-source"><summary>Data source & limits <span aria-hidden="true">+</span></summary><div><p>Cassini Radio Science Subsystem · NASA Planetary Data System. Radius is the ring-plane intercept’s distance from Saturn’s center.</p><p><strong>{variable.label}:</strong> {variable.description}</p><p>These calibrated diffraction-limited profiles retain diffraction effects. They are not high-resolution reconstructions. Optical depth is not mass density. Phase is displayed as stored, without unwrapping or inferred continuity.</p><p>Exact converted Float64 rows are SHA-256 verified. Overview points are a display reduction. Exact inspection and CSV are available for windows up to {number(metadata.data_product.recommended_exact_window_records, 0)} estimated rows. CSV includes all four published fields and original zero-based sample indices within inclusive radius boundaries.</p><p>Missing and negative values are preserved. This derivative has no per-sample quality flags; conversion verification does not validate a physical interpretation.</p><p className="mono">{metadata.pds_identity.product_id}<br />Web data v{version}</p><a href={sourceDatasetUrl(metadata)} target="_blank" rel="noreferrer">Read the PDS documentation ↗</a><p>Notes stay in this browser. Export a copy to take them with you.</p></div></details>
        </aside>
      </div>
    </section>
    <p className="explorer-footer-caption"><span>Six observations. One extraordinary ring system.</span><span>CASSINI / RSS</span></p>
  </section>
}

function ObservationLoader({ catalog, observation }) {
  const [params] = useSearchParams()
  const [request, setRequest] = useState({ status: 'loading' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    loadObservationSummary(observation.base_path).then(({ metadata, overview }) => {
      if (metadata.dataset_id !== observation.dataset_id || overview.dataset_id !== observation.dataset_id) throw new Error('Observation identity mismatch')
      if (!cancelled) setRequest({ status: 'ready', metadata, overview })
    }).catch(() => { if (!cancelled) setRequest({ status: 'error' }) })
    return () => { cancelled = true }
  }, [observation, retry])
  if (request.status !== 'ready') return <div className="explorer-loading glass-panel" role={request.status === 'error' ? 'alert' : 'status'}><p>{request.status === 'error' ? 'This observation could not be loaded. Your saved notes are preserved.' : 'Opening the observation…'}</p>{request.status === 'error' && <button className="button button-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Retry observation</button>}</div>
  return <LoadedExplorer key={`${params.get('record') || ''}:${params.get('draft') || ''}`} catalog={catalog} observation={observation} metadata={request.metadata} overview={request.overview} />
}

export default function Explorer() {
  const { datasetSlug } = useParams()
  const [request, setRequest] = useState({ status: 'loading' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    loadObservationCatalog().then((catalog) => {
      if (catalog.validation_status !== 'pass' || !catalog.observations?.length) throw new Error('Observation catalog unavailable')
      if (!cancelled) setRequest({ status: 'ready', catalog })
    }).catch(() => { if (!cancelled) setRequest({ status: 'error' }) })
    return () => { cancelled = true }
  }, [retry])
  const observation = request.catalog ? datasetSlug ? request.catalog.observations.find((item) => item.slug === datasetSlug) : getFeaturedObservation(request.catalog) : null
  return <>
    <PageMeta title={observation ? `${observation.display_name} — Data Explorer` : 'Cassini Data Explorer'} description="Explore Cassini RSS diffraction-limited ring profiles, compare exact converted samples, and save observation notes." path={datasetSlug ? `/data/${datasetSlug}` : '/data'} />
    {request.status !== 'ready' ? <section className="explorer-loading glass-panel" role={request.status === 'error' ? 'alert' : 'status'}><h1>Read between the rings.</h1><p>{request.status === 'error' ? 'The observation catalog could not be loaded.' : 'Loading Cassini observations…'}</p>{request.status === 'error' && <button className="button button-secondary" type="button" onClick={() => setRetry((value) => value + 1)}>Retry catalog</button>}</section>
      : !observation ? <section className="explorer-loading glass-panel"><h1>Observation not found.</h1><p>Choose one of the six available Cassini observations.</p><Link className="button button-primary" to="/data">Open the explorer</Link></section>
        : <ObservationLoader key={observation.dataset_id} catalog={request.catalog} observation={observation} />}
  </>
}
