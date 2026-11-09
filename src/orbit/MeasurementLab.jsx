import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EvidenceTag from '../components/common/EvidenceTag.jsx'
import { activityHref } from '../content/labActivities.js'
import { findObservation, formatObservationDate, shortName } from '../content/rings.js'
import { downloadText } from '../lib/explorations.js'
import { readLab, writeLab } from '../lib/labStore.js'
import { compareMeasurements, measureWindow, measurementMethod, reproductionMarkdown, reproductionRecord } from '../lib/windowMeasurements.js'

export const DEFAULT_THRESHOLD = '0.1'
// The explorer remounts while it settles the URL (which drops the #measure
// hash), so the request to bring the lab into view outlives one mount.
let pendingScroll = false
const format = (value, digits = 4) => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) : '—'
const signed = (value, digits = 4) => !Number.isFinite(value) ? '—' : value === 0 ? '0' : `${value > 0 ? '+' : '−'}${format(Math.abs(value), digits)}`
const percent = (value) => Number.isFinite(value) ? `${format(value * 100, 1)}%` : '—'

function resultRows(measurement) {
  const { statistics, gap } = measurement.result
  const rows = [
    ['Rows in window', format(statistics.rowCount, 0), null],
    ['Median', format(statistics.median, 6), 'median'],
    ['Mean', format(statistics.mean, 6), 'mean'],
    ['Minimum', format(statistics.minimum, 6), 'minimum'],
    ['Maximum', format(statistics.maximum, 6), 'maximum'],
  ]
  if (gap) {
    rows.unshift(
      ['Gap width (km)', gap.gap ? format(gap.gap.width, 2) : 'No gap', 'gapWidth'],
      ['Gap edges (km)', gap.gap ? `${format(gap.gap.inner, 2)} – ${format(gap.gap.outer, 2)}` : '—', null],
      ['Share of values below threshold', percent(gap.fractionBelow), 'fractionBelow'],
    )
  }
  return rows
}

function parameterRows(measurement) {
  const { config } = measurement
  return [
    ['Observation', `${shortName(config.slug)} · ${config.observationDate}`],
    ['Variable', `${config.variableLabel} (${config.unit})`],
    ['Window (km)', `${format(config.range[0], 3)} – ${format(config.range[1], 3)}`],
    ['Threshold', config.variableId === 'optical_depth' && Number.isFinite(config.threshold) ? format(config.threshold, 4) : 'Not used'],
  ]
}

function ActivityGuide({ activity, currentSlug, threshold, onThresholdChange, answer, onAnswer }) {
  const widths = Object.entries(activity.expectedWidths)
  return <section className="lab-activity" aria-labelledby="lab-activity-title">
    <p className="eyebrow">Guided activity</p>
    <h3 id="lab-activity-title">{activity.title}</h3>
    <ol className="lab-activity-steps">{activity.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    <div className="lab-activity-links">
      <Link className={currentSlug === activity.baselineSlug ? 'is-current' : undefined} aria-current={currentSlug === activity.baselineSlug ? 'page' : undefined} to={`${activityHref(activity, activity.baselineSlug)}#measure`}>Step 1 · {shortName(activity.baselineSlug)}</Link>
      <Link className={currentSlug === activity.compareSlug ? 'is-current' : undefined} aria-current={currentSlug === activity.compareSlug ? 'page' : undefined} to={`${activityHref(activity, activity.compareSlug)}#measure`}>Step 2 · {shortName(activity.compareSlug)}</Link>
      <button type="button" aria-pressed={threshold === String(activity.lowThreshold.threshold)} onClick={() => onThresholdChange(String(activity.lowThreshold.threshold))}>Step 3 · threshold {activity.lowThreshold.threshold}</button>
    </div>
    <label className="lab-answer">Your answer<textarea rows={3} maxLength={4000} value={answer} placeholder="What did you measure, and what could explain the difference?" onChange={(event) => onAnswer(event.target.value)} /></label>
    <details className="lab-check">
      <summary>Check your result</summary>
      <p>{activity.finding}</p>
      <p>{activity.interpretation}</p>
      <table>
        <caption>Gap width at threshold {activity.threshold}, same window</caption>
        <thead><tr><th scope="col">Observation</th><th scope="col">Date</th><th scope="col" className="numeric">Width (km)</th></tr></thead>
        <tbody>{widths.map(([slug, width]) => <tr key={slug}><th scope="row">{shortName(slug)}</th><td>{formatObservationDate(findObservation(slug))}</td><td className="numeric">{format(width, 2)}</td></tr>)}</tbody>
      </table>
    </details>
  </section>
}

export default function MeasurementLab({ config, exactRows, estimate, loadExactWindow, threshold, onThresholdChange, activity, onSaveToNotebook }) {
  const [lab, setLab] = useState(() => readLab())
  const [loaded, setLoaded] = useState({ key: '', status: 'idle', rows: null })
  const [message, setMessage] = useState('')
  const key = `${config.datasetId}:${config.range[0]}:${config.range[1]}`
  const rows = exactRows ?? (loaded.key === key ? loaded.rows : null)
  const loadStatus = exactRows ? 'ready' : loaded.key === key ? loaded.status : 'idle'
  const usesThreshold = config.variableId === 'optical_depth'
  const thresholdValue = Number(threshold)
  const thresholdValid = String(threshold).trim() !== '' && Number.isFinite(thresholdValue) && thresholdValue >= 0
  const result = useMemo(() => rows ? measureWindow(rows, config.variableId, usesThreshold && thresholdValid ? thresholdValue : Number.NaN) : null, [rows, config.variableId, usesThreshold, thresholdValid, thresholdValue])
  const current = result ? { config: { ...config, threshold: usesThreshold && thresholdValid ? thresholdValue : null }, result } : null
  const baseline = lab.baseline
  const comparison = baseline && current ? compareMeasurements(baseline, current) : null
  const question = activity?.question

  // Activity steps link to #measure, so switching observations keeps the lab in view.
  useEffect(() => {
    if (window.location.hash === '#measure') pendingScroll = true
    if (!pendingScroll) return undefined
    const timer = setTimeout(() => {
      document.getElementById('measure')?.scrollIntoView({ block: 'start' })
      pendingScroll = false
    }, 250)
    return () => clearTimeout(timer)
  }, [])

  function update(next) {
    setLab(next)
    return writeLab(next)
  }
  async function loadRows() {
    setLoaded({ key, status: 'loading', rows: null })
    setMessage('')
    try {
      const loadedRows = await loadExactWindow()
      setLoaded({ key, status: 'ready', rows: loadedRows })
    } catch {
      setLoaded({ key, status: 'error', rows: null })
    }
  }
  function saveBaseline() {
    const stored = update({ ...lab, baseline: current })
    const width = current.result.gap?.gap?.width
    setMessage(`Baseline saved: ${shortName(config.slug)}${Number.isFinite(width) ? `, gap width ${format(width, 2)} km` : ''}.${stored ? ' Change one setting or open another observation to compare.' : ' Browser storage is unavailable, so the baseline lasts only while this page is open.'}`)
  }
  function reset() {
    update({ ...lab, baseline: null, answer: '' })
    onThresholdChange(DEFAULT_THRESHOLD)
    setMessage('The lab is reset: no baseline, threshold back to 0.1.')
  }
  function markdown() {
    const text = reproductionMarkdown({ baseline, current, question })
    return lab.answer?.trim() ? `${text}\n## My answer\n\n${lab.answer.trim()}\n` : text
  }
  async function copyRecord() {
    try {
      await navigator.clipboard.writeText(markdown())
      setMessage('Copied the reproduction record (Markdown) to your clipboard.')
    } catch {
      setMessage('Copying is blocked in this browser. Use “Download JSON” instead.')
    }
  }
  function downloadJson() {
    const record = { ...reproductionRecord({ baseline, current, question, origin: window.location.origin }), answer: lab.answer?.trim() || null }
    downloadText(`${JSON.stringify(record, null, 2)}\n`, `saturn-ring-measurement_${config.datasetId}_${config.range[0]}-${config.range[1]}km.json`, 'application/json;charset=utf-8')
    setMessage('Downloaded the reproduction record as JSON.')
  }
  function saveNote() {
    const title = baseline && baseline.config.slug !== config.slug ? `${question ? 'Encke Gap width' : 'Measurement'}: ${shortName(baseline.config.slug)} vs ${shortName(config.slug)}` : `Measurement: ${shortName(config.slug)}, ${format(config.range[0], 0)}–${format(config.range[1], 0)} km`
    setMessage(onSaveToNotebook({ title, notes: markdown() }))
  }

  const statusText = loadStatus === 'loading' ? `Loading ${format(estimate, 0)} exact rows…`
    : loadStatus === 'error' ? 'The exact rows could not be loaded or verified.'
      : !rows ? `This window has about ${format(estimate, 0)} rows. The chart shows an overview, so the lab first loads the exact rows.`
        : rows.length === 0 ? 'No source rows fall inside this window. Widen the range.'
          : usesThreshold && !thresholdValid ? 'Enter a threshold of 0 or more to measure a gap.' : ''

  return <section className="lab-panel surface-instrument" id="measure" aria-labelledby="lab-title">
    <header className="lab-header">
      <div><EvidenceTag kind="derived" /><h2 id="lab-title">Measure this window</h2><p>Statistics and a gap width computed from the exact Cassini rows in the window shown above. Save a baseline, change one setting, and compare.</p></div>
    </header>
    {activity && <ActivityGuide activity={activity} currentSlug={config.slug} threshold={threshold} onThresholdChange={onThresholdChange} answer={lab.answer || ''} onAnswer={(answer) => update({ ...lab, answer })} />}
    <div className="lab-parameters">
      {parameterRows({ config: { ...config, threshold: thresholdValue } }).slice(0, 3).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      {usesThreshold ? <label className="lab-threshold"><span>Threshold <small>optical depth</small></span><input type="number" inputMode="decimal" min="0" step="0.01" value={threshold} aria-describedby="lab-threshold-help" onChange={(event) => onThresholdChange(event.target.value)} /><small id="lab-threshold-help">The gap is the longest unbroken run below this value.</small></label>
        : <div><span>Threshold</span><strong>Gap widths use optical depth</strong></div>}
    </div>
    {!rows && <div className="lab-load"><button className="button button-secondary" type="button" onClick={loadRows} disabled={loadStatus === 'loading'}>{loadStatus === 'error' ? 'Retry loading exact rows' : `Load ${format(estimate, 0)} exact rows and measure`}</button></div>}
    {statusText && <p className={`lab-status${loadStatus === 'error' ? ' is-error' : ''}`} role={loadStatus === 'error' ? 'alert' : 'status'}>{statusText}</p>}
    {current && rows.length > 0 && <div className="lab-results">
      <table className="lab-table">
        <caption>{baseline ? 'Baseline and current measurement' : 'Current measurement'}</caption>
        <thead><tr><th scope="col">Quantity</th>{baseline && <th scope="col" className="numeric">Baseline</th>}<th scope="col" className="numeric">Current</th>{baseline && <th scope="col" className="numeric">Change</th>}</tr></thead>
        <tbody>
          {baseline && parameterRows(current).map(([label, value], index) => {
            const before = baseline ? parameterRows(baseline)[index][1] : null
            return <tr key={label} className={`is-parameter${baseline && before !== value ? ' is-changed' : ''}`}><th scope="row">{label}</th>{baseline && <td className="numeric">{before}</td>}<td className="numeric">{value}</td>{baseline && <td className="numeric">{before !== value ? 'Changed' : 'Same'}</td>}</tr>
          })}
          {resultRows(current).map(([label, value, diffKey], index) => {
            const before = baseline ? resultRows(baseline)[index]?.[1] ?? '—' : null
            return <tr key={label}><th scope="row">{label}</th>{baseline && <td className="numeric">{before}</td>}<td className="numeric">{value}</td>{baseline && <td className="numeric">{diffKey && comparison?.sameVariable ? diffKey === 'fractionBelow' ? signed(comparison.differences[diffKey] * 100, 1) + ' pts' : signed(comparison.differences[diffKey], diffKey === 'gapWidth' ? 2 : 6) : '—'}</td>}</tr>
          })}
        </tbody>
      </table>
      {comparison?.warnings.map((warning) => <p key={warning} className="lab-warning" role="note">{warning}</p>)}
    </div>}
    <div className="lab-actions">
      <button className="button button-primary" type="button" onClick={saveBaseline} disabled={!current || !rows?.length}>Save as baseline</button>
      <button className="button button-secondary" type="button" onClick={copyRecord} disabled={!current}>Copy record</button>
      <button className="button button-secondary" type="button" onClick={downloadJson} disabled={!current}>Download JSON</button>
      <button className="button button-secondary" type="button" onClick={saveNote} disabled={!current}>Save to notebook</button>
      <button className="button button-quiet" type="button" onClick={reset}>Reset lab</button>
    </div>
    <p className="lab-message" role="status" aria-live="polite">{message || (lab.unavailable ? 'Browser storage is unavailable: the baseline will last only while this page is open.' : baseline ? `Baseline: ${shortName(baseline.config.slug)}, ${format(baseline.config.range[0], 0)}–${format(baseline.config.range[1], 0)} km.` : 'No baseline yet.')}</p>
    <details className="lab-method">
      <summary>Method and limitations</summary>
      <p>{measurementMethod.statistics}</p>
      <p>{measurementMethod.gap}</p>
      <p>{measurementMethod.limitations}</p>
      <p>The copied or downloaded record lists the dataset, PDS product, web-data version, window, threshold, results and a link that reopens each view.</p>
    </details>
  </section>
}
