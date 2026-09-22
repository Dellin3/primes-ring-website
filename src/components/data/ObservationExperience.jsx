import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { estimatedRecordCount, loadExactRange, loadObservationSummary, overviewSamples, downloadExactWindow } from '../../lib/webObservation.js'
import { getExample } from '../../content/explorationExamples.js'
import { downloadText, explorationHref, observationMarkdown, readExplorations, saveDraft, saveExploration, viewHref } from '../../lib/explorations.js'
import { emitExplorationEvent } from '../../lib/explorationEvents.js'
import DataFieldsPanel from './DataFieldsPanel.jsx'
import ExactSampleInspector from './ExactSampleInspector.jsx'
import ObservationNavigator from './ObservationNavigator.jsx'
import ObservationRadialScene from './ObservationRadialScene.jsx'
import ProvenanceCorridor from './ProvenanceCorridor.jsx'
import ScientificProfileCanvas from './ScientificProfileCanvas.jsx'
import '../../styles/workbench-refinements.css'

const format = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value)
const noSelectedIndices = []
const finite = (value) => value !== null && String(value).trim() !== '' && Number.isFinite(Number(value))

function RangeForm({ range, fullRange, onApply }) {
  const [lower, setLower] = useState(String(range[0]))
  const [upper, setUpper] = useState(String(range[1]))
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    if (!finite(lower) || !finite(upper)) return setError('Enter both radius boundaries as numbers.')
    const values = [Number(lower), Number(upper)]
    if (values[0] > values[1]) return setError('The lower radius must be less than or equal to the upper radius.')
    if (values[0] < fullRange[0] || values[1] > fullRange[1]) return setError(`Use a range within ${format(fullRange[0])}–${format(fullRange[1])} km.`)
    setError('')
    onApply(values)
  }
  return <form className="exact-range-form" onSubmit={submit} noValidate>
    <label>Lower radius (km)<input type="number" step="any" value={lower} onChange={(e) => setLower(e.target.value)} /></label>
    <label>Upper radius (km)<input type="number" step="any" value={upper} onChange={(e) => setUpper(e.target.value)} /></label>
    <button className="button button-secondary" type="submit">Apply range</button>
    {error && <p role="alert">{error}</p>}
  </form>
}

function ExactTable({ samples, variable, onInspect }) {
  const [page, setPage] = useState(0)
  const pageSize = 30
  const activePage = Math.min(page, Math.max(0, Math.ceil(samples.length / pageSize) - 1))
  return <details className="exact-table"><summary>View exact data table ({samples.length.toLocaleString('en-US')} rows)</summary>
    <p>All rows in the inclusive window, in source record order. Missing values remain missing.</p>
    <div className="table-scroll"><table><thead><tr><th>Source index</th><th>Radius (km)</th><th>{variable.label} ({variable.unit === 'N/A' ? 'dimensionless' : variable.unit})</th><th>Inspect</th></tr></thead>
      <tbody>{samples.slice(activePage * pageSize, (activePage + 1) * pageSize).map((sample) => <tr key={sample.sample_index}><td>{sample.sample_index}</td><td>{String(sample.ring_radius_km)}</td><td>{Number.isFinite(sample[variable.id]) ? String(sample[variable.id]) : 'Missing'}</td><td><button type="button" onClick={() => onInspect(sample)}>Inspect {sample.sample_index}</button></td></tr>)}</tbody></table></div>
    <div className="small-actions"><button type="button" disabled={!activePage} onClick={() => setPage(activePage - 1)}>Previous rows</button><span>Page {activePage + 1} of {Math.max(1, Math.ceil(samples.length / pageSize))}</span><button type="button" disabled={(activePage + 1) * pageSize >= samples.length} onClick={() => setPage(activePage + 1)}>Next rows</button></div>
  </details>
}

function LoadedObservationExperience({ observation, metadata, overview }) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [entryKey] = useState(location.key)
  const [initialStore] = useState(readExplorations)
  const recordId = params.get('record')
  const requestedDraft = initialStore.drafts[params.get('draft')]
  const [mismatchedDraft] = useState(() => Boolean(requestedDraft && requestedDraft.datasetId !== metadata.dataset_id))
  const [restored] = useState(() => {
    const saved = recordId ? initialStore.records.find((record) => record.id === recordId && record.datasetId === metadata.dataset_id) : null
    const requestedDraftId = params.get('draft')
    const candidateDraft = requestedDraftId && requestedDraftId !== '1' ? initialStore.drafts[requestedDraftId] : initialStore.drafts[metadata.dataset_id]
    const draft = candidateDraft?.datasetId === metadata.dataset_id ? candidateDraft : null
    if (params.has('draft') && draft && (!recordId || draft.originRecordId === recordId)) return { ...draft, id: draft.originRecordId }
    return saved || (!params.has('version') ? draft : null)
  })
  const [draftId] = useState(() => restored?.draftId || (!mismatchedDraft && params.has('draft') && params.get('draft') !== '1' && /^[a-zA-Z0-9_-]{1,128}$/.test(params.get('draft')) ? params.get('draft') : globalThis.crypto.randomUUID()))
  const variables = metadata.principal_variables
  const version = metadata.web_product_version
  const example = getExample(metadata.dataset_id)
  const fullRange = useMemo(() => [metadata.observation.radial_range.minimum, metadata.observation.radial_range.maximum], [metadata])
  const requestedRange = [params.get('from'), params.get('to')]
  const validQueryRange = requestedRange.every(finite) && Number(requestedRange[0]) <= Number(requestedRange[1]) && Number(requestedRange[0]) >= fullRange[0] && Number(requestedRange[1]) <= fullRange[1]
  const guide = params.has('guide') ? params.get('guide') === '1' : Boolean(restored?.guide)
  const restoredRange = restored?.range
  const validRestoredRange = restoredRange?.length === 2 && restoredRange.every(Number.isFinite) && restoredRange[0] <= restoredRange[1] && restoredRange[0] >= fullRange[0] && restoredRange[1] <= fullRange[1]
  const defaultRange = !params.has('from') && !params.has('to') && validRestoredRange ? restoredRange : guide && example ? example.range : fullRange
  const lower = validQueryRange ? Number(requestedRange[0]) : defaultRange[0]
  const upper = validQueryRange ? Number(requestedRange[1]) : defaultRange[1]
  const range = useMemo(() => [lower, upper], [lower, upper])
  const variableId = params.get('variable') || restored?.variable || 'optical_depth'
  const variable = variables.find((item) => item.id === variableId) || variables[0]
  const mode = (params.get('mode') || restored?.mode) === 'research' ? 'research' : 'explore'
  const [tab, setTab] = useState(guide ? 'Guide' : 'Inspect')
  const [title, setTitle] = useState(restored?.title || `Rev ${String(observation.revolution_number).padStart(3, '0')} · ring profile`)
  const [notes, setNotes] = useState(restored?.notes || '')
  const [selection, setSelection] = useState(() => ({ indices: restored?.selectedSamples || [], range: restored?.range || range }))
  const selectedIndices = selection.range[0] === lower && selection.range[1] === upper ? selection.indices : noSelectedIndices
  function setSelectedIndices(next, forRange = range) {
    setSelection((previous) => ({ range: forRange, indices: typeof next === 'function' ? next(previous.range[0] === forRange[0] && previous.range[1] === forRange[1] ? previous.indices : noSelectedIndices) : next }))
  }
  const [progress, setProgress] = useState(restored?.guideProgress || 'explore')
  const [savedId, setSavedId] = useState(restored?.id)
  const [createdAt] = useState(restored?.createdAt || new Date().toISOString())
  const [draftReceipt, setDraftReceipt] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const [exact, setExact] = useState({ key: '', status: 'loading', samples: [] })
  const [csvStatus, setCsvStatus] = useState('')
  const [notesExportStatus, setNotesExportStatus] = useState('')
  const [previousView, setPreviousView] = useState(null)
  const notesInput = useRef(null)
  const [savedLink, setSavedLink] = useState('')
  const latestKey = useRef('')
  const key = `${metadata.dataset_id}:${version}:${lower}:${upper}`
  const estimatedRows = estimatedRecordCount(metadata, range)
  const exactAllowed = estimatedRows <= metadata.data_product.recommended_exact_window_records
  const exactStatus = !exactAllowed ? 'overview' : exact.key === key ? exact.status : 'loading'
  const samples = useMemo(() => exactStatus === 'ready' ? exact.samples : [], [exactStatus, exact.samples])
  const overviewRows = useMemo(() => overviewSamples(overview), [overview])
  const profileRows = useMemo(() => exactStatus === 'ready' ? samples : overviewRows.filter((sample) => sample.ring_radius_km >= lower && sample.ring_radius_km <= upper), [exactStatus, samples, overviewRows, lower, upper])
  const profileMode = exactStatus === 'ready' ? 'exact' : exactStatus === 'loading' ? 'loading_exact' : exactStatus
  const inspected = samples.find((sample) => sample.sample_index === selectedIndices.at(-1)) || null
  const comparison = selectedIndices.length > 1 ? samples.find((sample) => sample.sample_index === selectedIndices[0]) : null
  const requestedVersion = params.get('version') || restored?.version
  const currentRecord = useMemo(() => ({ id: savedId, draftId, title, observationName: observation.displayName, datasetId: metadata.dataset_id, slug: observation.slug, version, variable: variable.id, range, selectedSamples: selectedIndices, guideProgress: progress, notes, createdAt, guide, mode, displayMode: exactStatus === 'ready' ? 'exact' : 'overview' }), [savedId, draftId, title, observation.displayName, metadata.dataset_id, observation.slug, version, variable.id, range, selectedIndices, progress, notes, createdAt, guide, mode, exactStatus])

  const draftSignature = JSON.stringify(currentRecord)
  const storageStatus = draftReceipt?.signature !== draftSignature ? 'Saving draft…' : !draftReceipt.persistent ? draftReceipt.error : saveMessage || 'Draft saved.'
  const notesPlaceholder = comparison && inspected ? 'What changed between these two positions? What needs more evidence?' : inspected ? 'What do you notice at this position? Choose another point to compare.' : 'What do you notice in this region? What would you check next?'

  useEffect(() => {
    if (params.get('draft') !== draftId || !params.has('from') || !params.has('to') || !params.has('variable') || !params.has('version')) {
      const next = new URLSearchParams(params)
      next.set('draft', draftId)
      if (mismatchedDraft) next.set('notice', 'draft-mismatch')
      if (!params.has('from')) next.set('from', String(lower))
      if (!params.has('to')) next.set('to', String(upper))
      if (!params.has('variable')) next.set('variable', variable.id)
      if (!params.has('version')) next.set('version', requestedVersion || version)
      setParams(next, { replace: true, preventScrollReset: true })
    }
  }, [params, setParams, draftId, lower, upper, variable.id, requestedVersion, version, mismatchedDraft])

  useEffect(() => {
    if (guide) emitExplorationEvent('exploration_started', { datasetId: metadata.dataset_id }, entryKey)
    if (restored) emitExplorationEvent('exploration_resumed', { datasetId: metadata.dataset_id }, entryKey)
  }, [entryKey, guide, metadata.dataset_id, restored])

  useEffect(() => {
    latestKey.current = key
    if (!exactAllowed) return undefined
    let cancelled = false
    const timer = setTimeout(() => {
      loadExactRange(observation.basePath, range).then((result) => {
        if (cancelled) return
        setExact({ key, status: 'ready', samples: result.samples })
        emitExplorationEvent('exact_window_loaded', { datasetId: metadata.dataset_id, rowCount: result.samples.length }, `${entryKey}:${key}`)
      }).catch(() => { if (!cancelled) setExact({ key, status: 'error', samples: [] }) })
    }, 100)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [key, exactAllowed, observation.basePath, range, retry, metadata.dataset_id, entryKey])

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = saveDraft({ ...currentRecord, updatedAt: new Date().toISOString() })
      setDraftReceipt({ signature: draftSignature, persistent: result.persistent, error: result.error })
    }, 350)
    return () => clearTimeout(timer)
  }, [currentRecord, draftSignature])

  // Flush notes before internal navigation, refresh, or a closed tab.
  const draftRef = useRef(currentRecord)
  useEffect(() => { draftRef.current = currentRecord }, [currentRecord])
  useEffect(() => {
    function flush() { saveDraft({ ...draftRef.current, updatedAt: new Date().toISOString() }) }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [])

  function updateView(nextRange = range, nextVariable = variable.id, options = {}) {
    const next = new URLSearchParams(params)
    next.set('draft', draftId)
    next.set('variable', nextVariable)
    next.set('from', String(nextRange[0]))
    next.set('to', String(nextRange[1]))
    if (!requestedVersion) next.set('version', version)
    if (options.guide !== undefined) next.set('guide', options.guide ? '1' : '0')
    if (options.mode) next.set('mode', options.mode)
    setParams(next, { replace: options.replace ?? false, preventScrollReset: true })
    setSaveMessage('')
    setShareUrl('')
    setCsvStatus('')
    setNotesExportStatus('')
  }
  function applyRange(nextRange, replace = false) {
    if (nextRange[0] === lower && nextRange[1] === upper) return
    setPreviousView(null)
    setSelectedIndices([])
    updateView(nextRange, variable.id, { replace })
  }
  function openExample() {
    if (!example) return
    setPreviousView({ range, variable: variable.id, guide, selectedIndices })
    setSelectedIndices([])
    updateView(example.range, example.variableId, { guide: true })
    setTab('Guide')
  }
  function restorePreviousView() {
    if (!previousView) return
    updateView(previousView.range, previousView.variable, { guide: previousView.guide })
    setSelectedIndices(previousView.selectedIndices, previousView.range)
    setPreviousView(null)
  }
  function addNote() {
    setTab('Notes')
    requestAnimationFrame(() => { notesInput.current?.focus(); notesInput.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) })
  }
  function inspect(sample) {
    if (!sample) return setSelectedIndices([])
    setSelectedIndices((previous) => previous.at(-1) === sample.sample_index ? previous : [...previous.filter((id) => id !== sample.sample_index), sample.sample_index].slice(-2))
    setProgress('inspect')
    setTab('Inspect')
    emitExplorationEvent('sample_inspected', { datasetId: metadata.dataset_id, variable: variable.id }, `${entryKey}:${key}:${sample.sample_index}`)
  }
  function save() {
    const result = saveExploration({ ...currentRecord, selectedSamples: exactStatus === 'ready' ? [comparison, inspected].filter(Boolean).map((sample) => sample.sample_index) : selectedIndices })
    setSavedId(result.record.id)
    if (result.persistent) {
      setDraftReceipt({ signature: draftSignature, persistent: true, error: '' })
      setSaveMessage('Exploration saved.')
      setSavedLink(explorationHref(result.record))
      if (requestedVersion !== version) {
        const next = new URLSearchParams(params)
        next.set('version', version)
        setParams(next, { replace: true, preventScrollReset: true })
      }
      emitExplorationEvent('exploration_saved', { datasetId: metadata.dataset_id }, `${result.record.id}:${key}:${variable.id}`)
    } else { setSaveMessage(''); setDraftReceipt({ signature: draftSignature, persistent: false, error: result.error }) }
  }
  function exportCsv() {
    if (!samples.length || exactStatus !== 'ready' || latestKey.current !== key) return
    try {
      downloadExactWindow(metadata, samples, { range, variableId: variable.id })
      setCsvStatus(`${samples.length.toLocaleString('en-US')} exact rows prepared for download. Boundaries are inclusive.`)
      emitExplorationEvent('data_exported', { datasetId: metadata.dataset_id, rowCount: samples.length, format: 'csv' }, `${entryKey}:${key}:csv`)
    } catch { setCsvStatus('Download could not start. Please retry; your window and notes are preserved.') }
  }
  function exportRecord() {
    try {
      downloadText(observationMarkdown({ ...currentRecord, updatedAt: new Date().toISOString() }, metadata, window.location.origin), `${metadata.dataset_id}_observation.md`)
      setNotesExportStatus('Notes prepared for download.')
      emitExplorationEvent('data_exported', { datasetId: metadata.dataset_id, format: 'markdown' }, `${entryKey}:${key}:md`)
    } catch { setNotesExportStatus('Download could not start. Retry Export notes; your notes remain in this session.') }
  }
  async function share() {
    const url = `${window.location.origin}${viewHref(currentRecord)}`
    setShareUrl(url)
    try {
      await navigator.clipboard.writeText(url)
      setShareMessage('View link copied. Your notes are not included.')
      emitExplorationEvent('view_shared', { datasetId: metadata.dataset_id }, `${entryKey}:${url}`)
    } catch { setShareMessage('Copy the selected view link below. Your notes are not included.') }
  }

  return <article className="observation-experience guided-workbench" data-dataset-id={metadata.dataset_id} data-data-version={version}>
    <header className="workbench-header"><div><Link to="/data">← All observations</Link><h1>{observation.displayName}</h1><p className="observation-source-meta"><span>{metadata.pds_identity.ring_observation_id}</span><span>Source date: {metadata.pds_identity.ring_observation_id.split('_')[1]}, day {metadata.pds_identity.ring_observation_id.split('_')[2]}</span><span className="radius-value">{format(fullRange[0])}–{format(fullRange[1])} km</span><span>{metadata.observation.record_count.toLocaleString('en-US')} records</span></p></div><Link to="/explorations">My Explorations →</Link></header>
    {requestedVersion && requestedVersion !== version && <p className="workbench-alert" role="alert">Data version changed: this view requested {requestedVersion}; available version is {version}. This is not an exact reproduction of the saved data. Your original saved record is retained until you explicitly save again.</p>}
    {(mismatchedDraft || params.get('notice') === 'draft-mismatch') && <p className="workbench-alert" role="alert">That draft belongs to another observation. A separate draft is open here; the original remains in My Explorations.</p>}
    {recordId && !restored?.id && <p className="workbench-alert" role="alert">This saved record is not available in this browser. The linked data view is open; its notes have not been substituted.</p>}
    {!variables.some((item) => item.id === variableId) && <p className="workbench-alert" role="alert">The requested variable “{variableId}” is unavailable. Showing {variable.label}; choose an available variable below.</p>}
    {(params.has('from') || params.has('to')) && !validQueryRange && <p className="workbench-alert" role="alert">The requested range is invalid or outside this observation. Showing {guide ? 'the example region' : 'the full coverage'}; set a valid range below.</p>}
    {['intersection', 'reset'].includes(params.get('notice')) && <p className="workbench-alert" role="status">{params.get('notice') === 'intersection' ? 'The radius window was limited to the shared coverage of the new observation.' : 'The observations have no common radius window. Opened the example for this observation.'}</p>}
    <section className="observation-instrument" aria-labelledby="observation-profile-title">
      <div className="observation-instrument-toolbar"><div><p className="eyebrow">Cassini · selected profile</p><h2 id="observation-profile-title">{variable.label} <small>({variable.unit === 'N/A' ? 'dimensionless' : variable.unit.toLowerCase()})</small></h2></div><fieldset><legend>Selected variable</legend><div>{variables.map((item) => <button type="button" key={item.id} aria-pressed={item.id === variable.id} onClick={() => updateView(range, item.id)}>{item.label}</button>)}</div></fieldset></div>
      <div className="guide-strip"><span>{guide ? 'Guided exploration' : 'Free exploration'}</span>{guide && <ol><li aria-current={progress === 'explore' ? 'step' : undefined}>1 Explore</li><li aria-current={progress === 'inspect' ? 'step' : undefined}>2 Inspect</li><li aria-current={progress === 'save' ? 'step' : undefined}>3 Save</li></ol>}<button type="button" onClick={() => { updateView(range, variable.id, { guide: !guide }); setTab(guide ? 'Inspect' : 'Guide') }}>{guide ? 'Skip guide' : 'Open guide'}</button></div>
      <div className="observation-profile-workspace">
        <div className="workbench-plot-column">
          {variable.id === 'phase_shift' && <p className="phase-display-note"><strong>Phase continuity not inferred.</strong> Stored values are shown as unconnected points, without unwrapping.</p>}
          <ScientificProfileCanvas requestedRange={range} samplingInterval={metadata.observation.radial_range.sampling_interval} samples={profileRows} variable={variable} inspectedSample={inspected} onInspect={inspect} dataMode={profileMode} scopeLabel={mode === 'research' ? 'Research window · data inspection' : 'Selected radial window'} statusMessage={exactStatus === 'error' ? 'Exact data could not be verified. Retry below.' : exactStatus === 'loading' ? 'Loading exact converted samples…' : exactStatus === 'ready' && !samples.length ? 'No source samples lie within these boundaries. Expand the range or open the example region.' : ''} />
          <p className="axis-explainer">Radius is distance from Saturn’s center to the ring-plane intercept, in kilometers. {samples.length > 0 && `${samples.length.toLocaleString('en-US')} exact rows in this inclusive window.`}</p>
          {exactStatus === 'error' && <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry exact data</button>}
          <RangeForm key={`${lower}:${upper}`} range={range} fullRange={fullRange} onApply={applyRange} />
          <div className="small-actions"><button type="button" onClick={openExample} disabled={!example}>Open example region</button><button type="button" onClick={() => applyRange(fullRange)}>Reset view</button><button type="button" onClick={() => { setTab('Notes'); updateView(range, variable.id, { mode: 'research' }) }}>Open as Research Window</button></div>
          {previousView && <div className="workbench-notice" role="status">Example region opened: <span className="radius-value">{format(lower)}–{format(upper)} km</span>. <button type="button" onClick={restorePreviousView}>Restore previous view</button></div>}
          {!exactAllowed && <div className="workbench-notice"><p>This broad view is an overview. Open a smaller region to inspect individual samples. You can save this view and your notes now.</p><button type="button" onClick={openExample} disabled={!example}>Open example region</button></div>}
          <details className="navigator-disclosure"><summary>Overview range navigator — drag or use keyboard controls</summary><ObservationNavigator samples={overviewRows} variable={variable} fullRange={fullRange} selectedRange={range} minimumWindowSpan={metadata.observation.radial_range.sampling_interval} onRangeChange={(next) => applyRange(next, true)} onRangeCommit={(next) => applyRange(next, true)} /></details>
          <div className="observation-actions"><button className={`button ${tab === 'Notes' ? 'button-secondary' : 'button-primary'}`} type="button" onClick={addNote}>Add a note</button><button className="button button-secondary" type="button" disabled={!samples.length || exactStatus !== 'ready'} onClick={exportCsv}>Download selected data</button></div>
          {csvStatus && <p className="download-status" role="status">{csvStatus}</p>}
          <p className="download-explanation">CSV for spreadsheets or code, with all four fields and source sample IDs. Your browser may ask permission to download.</p>
          {samples.length > 0 && <ExactTable samples={samples} variable={variable} onInspect={inspect} />}
        </div>
        <aside className="workbench-context"><div className="context-tabs" role="tablist" aria-label="Exploration context">{['Guide', 'Inspect', 'Notes'].map((name) => <button id={`context-${name}`} aria-controls="context-panel" role="tab" tabIndex={tab === name ? 0 : -1} aria-selected={tab === name} key={name} onClick={() => setTab(name)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { const tabs = ['Guide', 'Inspect', 'Notes']; const next = tabs[(tabs.indexOf(name) + (event.key === 'ArrowRight' ? 1 : 2)) % 3]; setTab(next); document.getElementById(`context-${next}`)?.focus() } }}>{name}</button>)}</div>
          <div id="context-panel" role="tabpanel" aria-labelledby={`context-${tab}`}>
            {tab === 'Guide' && <div className="exploration-guide"><p className="eyebrow">A question to begin</p><h3>How does optical depth change across this region?</h3><p>Compare two nearby positions. Record what you observe and what the plot alone cannot tell you.</p><ol><li>Explore the profile and adjust the radius window.</li><li>Click a point, or focus the chart and press ← / →. Select a second point to compare.</li><li>Write an optional observation, then save or export it.</li></ol><button type="button" onClick={() => { setTab('Inspect'); document.querySelector('.workbench-plot-column canvas')?.focus() }}>Inspect the profile</button><p className="science-caution">Optical depth describes attenuation, not mass density. A spike alone is not a discovery.</p></div>}
            {tab === 'Inspect' && <ExactSampleInspector sample={inspected} comparison={comparison} variable={variable} exactSampleCount={samples.length} status={profileMode} observationId={metadata.pds_identity.ring_observation_id} onOpenExample={openExample} onFocusChart={() => document.querySelector('.workbench-plot-column canvas')?.focus()} />}
            {tab === 'Notes' && <div className="exploration-notes">
              <h3>Keep an observation</h3>
              <label>Title<input value={title} maxLength={160} onChange={(event) => { setTitle(event.target.value); setSaveMessage('') }} /></label>
              <label>Observations and limitations<textarea ref={notesInput} rows={5} value={notes} maxLength={20000} placeholder={notesPlaceholder} onChange={(event) => { setNotes(event.target.value); setSaveMessage(''); setNotesExportStatus('') }} /></label>
              <p className="storage-scope">Drafts and saved explorations stay in this browser. Export notes to keep a portable copy.</p>
              <button className="button button-primary" type="button" onClick={save}>Save exploration</button>
              <p className="save-status" role="status">{storageStatus}</p>
              {savedLink && <p><Link to={savedLink}>Continue saved exploration →</Link></p>}
              <button type="button" onClick={exportRecord}>Export notes</button>
              {notesExportStatus && <p className="download-status" role="status">{notesExportStatus}</p>}
              <p className="download-explanation">Markdown (.md) text file. Your browser may ask permission to download.</p>
              <button type="button" onClick={share}>Share view</button>
              {shareUrl && <label>View link<input readOnly value={shareUrl} onFocus={(event) => event.target.select()} onCopy={() => emitExplorationEvent('view_shared', { datasetId: metadata.dataset_id }, `${entryKey}:${shareUrl}`)} /><span role="status">{shareMessage}</span></label>}
              {savedId && <div className="next-exploration"><h4>Keep investigating</h4><p>Compare variables over the same radii, or widen the view.</p><button type="button" onClick={() => { updateView(range, variables[(variables.findIndex((item) => item.id === variable.id) + 1) % variables.length].id); setTab('Inspect') }}>Try another variable</button><button type="button" onClick={() => applyRange([Math.max(fullRange[0], lower - (upper - lower) / 2), Math.min(fullRange[1], upper + (upper - lower) / 2)])}>Widen this window</button><Link to="/research/reliability-and-reconstruction">Develop a research question →</Link></div>}
            </div>}
          </div>
        </aside>
      </div>
      <details className="workbench-methods"><summary>Data & processing</summary><p>These calibrated Diffraction-Limited Profiles (DLP) still contain diffraction effects. They are not this project’s high-resolution reconstructions. Conversion verification checks the data conversion, not scientific validation of the research method.</p><p>NASA’s Planetary Data System (PDS) archives mission data. Cassini’s Radio Science Subsystem (RSS) supplied the radio occultation observations; the Deep Space Network (DSN) received the radio signals on Earth.</p><p><strong>{variable.label}:</strong> {variable.description}</p><p>Individual-sample loading is limited to {metadata.data_product.recommended_exact_window_records.toLocaleString('en-US')} estimated records per view. A broader view uses reduced overview points; saving it does not imply individual-sample inspection.</p><p>Web data version {version}. Per-sample quality flags are not included in this four-field derivative. Source negative values are preserved. Source files, converted records, display overview, and exact samples have distinct roles.</p><p><a href="https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=CO-SR-RSS-4%2F5-OCC-V2.0" target="_blank" rel="noreferrer">Official PDS dataset documentation ↗</a></p><p><strong>Research output status:</strong> stationary roots, branch records, project diagnostics and reconstructed profiles are not published. <Link to="/research">Read the research and available teaching examples →</Link></p><ObservationRadialScene radialDomain={observation.catalogRadialDomain || { minimum: fullRange[0], maximum: fullRange[1] }} observationRange={fullRange} selectedRange={range} inspectedRadius={inspected?.ring_radius_km || null} compact /><ProvenanceCorridor metadata={metadata} catalogVerification={observation.web_data} /><DataFieldsPanel fields={metadata.field_documentation} publishedColumns={metadata.binary_columns} /></details>
    </section>
  </article>
}

export default function ObservationExperience({ observation }) {
  const [params] = useSearchParams()
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState({ datasetId: '', status: 'loading' })
  useEffect(() => {
    let cancelled = false
    loadObservationSummary(observation.basePath).then(({ metadata, overview }) => {
      if (metadata.dataset_id !== observation.datasetId || overview.dataset_id !== observation.datasetId) throw new Error('Observation identity mismatch')
      if (!cancelled) setRequest({ datasetId: observation.datasetId, status: 'ready', metadata, overview })
    }).catch(() => { if (!cancelled) setRequest({ datasetId: observation.datasetId, status: 'error' }) })
    return () => { cancelled = true }
  }, [observation, retry])
  if (request.datasetId !== observation.datasetId || request.status === 'loading') return <div className="observation-loading-record" role="status">Loading {observation.displayName}…</div>
  if (request.status === 'error') return <div className="observation-loading-record is-error" role="alert"><p>The observation could not be loaded. Your view parameters and saved notes are preserved.</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Retry observation</button><Link to="/explorations">Open My Explorations</Link></div>
  return <LoadedObservationExperience key={`${observation.datasetId}:${params.get('record') || 'draft'}:${params.get('draft') || 'new'}`} observation={observation} metadata={request.metadata} overview={request.overview} />
}
