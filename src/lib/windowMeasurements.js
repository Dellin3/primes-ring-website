// Derived measurements for one radial window of an archived Cassini profile.
// Everything here is computed from exact converted source rows; nothing is
// interpolated, smoothed or reconstructed.

export const measurementMethod = {
  statistics: 'Computed from every exact converted source row whose ring radius lies inside the window (both boundaries inclusive). Missing values are counted but excluded from the minimum, median, mean and maximum.',
  gap: 'Rows are sorted by ring radius. The gap is the longest unbroken run of rows whose normal optical depth is finite and below the threshold; any row at or above the threshold, or with a missing value, ends a run. Width = outer radius − inner radius of that run, in kilometers.',
  limitations: 'These are diffraction-limited profiles exactly as archived: they still contain diffraction effects and noise, and this site does not run the team’s reconstruction method. A measured width depends on the threshold and on noise; it is not a physical edge position by itself.',
}

function median(sorted) {
  if (!sorted.length) return null
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function windowStatistics(rows, variableId) {
  const values = rows.map((row) => row[variableId]).filter(Number.isFinite).sort((a, b) => a - b)
  const sum = values.reduce((total, value) => total + value, 0)
  return {
    rowCount: rows.length,
    finiteCount: values.length,
    minimum: values.length ? values[0] : null,
    median: median(values),
    mean: values.length ? sum / values.length : null,
    maximum: values.length ? values.at(-1) : null,
  }
}

// Longest run below a threshold, scanned in ring-radius order.
export function gapBelowThreshold(rows, threshold, variableId = 'optical_depth') {
  if (!Number.isFinite(threshold)) return null
  const ordered = rows.filter((row) => Number.isFinite(row.ring_radius_km)).sort((a, b) => a.ring_radius_km - b.ring_radius_km)
  let best = null
  let start = null
  let previous = null
  let count = 0
  let below = 0
  let finite = 0
  const close = () => {
    if (start && (!best || previous.ring_radius_km - start.ring_radius_km > best.width)) {
      best = { inner: start.ring_radius_km, outer: previous.ring_radius_km, width: previous.ring_radius_km - start.ring_radius_km, rows: count, firstSampleIndex: start.sample_index, lastSampleIndex: previous.sample_index }
    }
    start = null
    count = 0
  }
  for (const row of ordered) {
    const value = row[variableId]
    if (Number.isFinite(value)) finite += 1
    if (Number.isFinite(value) && value < threshold) {
      below += 1
      if (!start) start = row
      previous = row
      count += 1
    } else close()
  }
  close()
  return { threshold, gap: best, fractionBelow: finite ? below / finite : null }
}

export function measureWindow(rows, variableId, threshold) {
  const statistics = windowStatistics(rows, variableId)
  const gap = variableId === 'optical_depth' && Number.isFinite(threshold) ? gapBelowThreshold(rows, threshold, variableId) : null
  return { statistics, gap }
}

const numericResults = [
  ['median', (result) => result.statistics.median],
  ['mean', (result) => result.statistics.mean],
  ['minimum', (result) => result.statistics.minimum],
  ['maximum', (result) => result.statistics.maximum],
  ['gapWidth', (result) => result.gap?.gap?.width ?? null],
  ['fractionBelow', (result) => result.gap?.fractionBelow ?? null],
]

// Compare two measurements only where their units and parameters allow it.
export function compareMeasurements(baseline, current) {
  const sameVariable = baseline.config.variableId === current.config.variableId
  const sameThreshold = baseline.config.threshold === current.config.threshold
  const sameWindow = baseline.config.range[0] === current.config.range[0] && baseline.config.range[1] === current.config.range[1]
  const warnings = []
  if (!sameVariable) warnings.push('The two measurements use different variables, so their values are not compared.')
  if (sameVariable && current.config.variableId === 'optical_depth' && !sameThreshold) warnings.push('The thresholds differ, so the gap widths are not a like-for-like comparison.')
  if (!sameWindow) warnings.push('The radial windows differ; window statistics describe different stretches of ring.')
  const differences = {}
  if (sameVariable) {
    for (const [key, read] of numericResults) {
      const a = read(baseline.result)
      const b = read(current.result)
      differences[key] = Number.isFinite(a) && Number.isFinite(b) ? b - a : null
    }
  }
  return { sameVariable, sameThreshold, sameWindow, warnings, differences }
}

const round = (value, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null

function serializeMeasurement(measurement) {
  const { config, result } = measurement
  return {
    observation: config.observationName,
    observation_date: config.observationDate,
    dataset_id: config.datasetId,
    pds_product_id: config.productId,
    pds_ring_observation_id: config.ringObservationId,
    pds_data_set_id: config.dataSetId,
    web_product_version: config.version,
    variable: config.variableId,
    unit: config.unit,
    radius_window_km: config.range,
    threshold: config.variableId === 'optical_depth' ? config.threshold : null,
    view_url: config.viewUrl,
    results: {
      rows_in_window: result.statistics.rowCount,
      finite_values: result.statistics.finiteCount,
      minimum: round(result.statistics.minimum),
      median: round(result.statistics.median),
      mean: round(result.statistics.mean),
      maximum: round(result.statistics.maximum),
      gap_inner_radius_km: result.gap?.gap?.inner ?? null,
      gap_outer_radius_km: result.gap?.gap?.outer ?? null,
      gap_width_km: round(result.gap?.gap?.width ?? null, 4),
      gap_first_sample_index: result.gap?.gap?.firstSampleIndex ?? null,
      gap_last_sample_index: result.gap?.gap?.lastSampleIndex ?? null,
      fraction_below_threshold: round(result.gap?.fractionBelow ?? null, 6),
    },
  }
}

export function reproductionRecord({ baseline, current, question, origin, now = new Date() }) {
  const comparison = baseline && current ? compareMeasurements(baseline, current) : null
  return {
    record_type: 'saturn-rings-measurement',
    schema_version: 1,
    generated_time: now.toISOString(),
    site: origin,
    question: question || null,
    data_kind: 'Derived from archived Cassini RSS diffraction-limited profiles (NASA PDS CO-SR-RSS-4/5-OCC-V2.0)',
    method: measurementMethod,
    baseline: baseline ? serializeMeasurement(baseline) : null,
    comparison: current ? serializeMeasurement(current) : null,
    difference_comparison_minus_baseline: comparison?.sameVariable ? Object.fromEntries(Object.entries(comparison.differences).map(([key, value]) => [key, round(value, key === 'gapWidth' ? 4 : 6)])) : null,
    comparison_warnings: comparison?.warnings ?? [],
  }
}

const format = (value, digits = 4) => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) : 'n/a'

function measurementLines(label, measurement) {
  const { config, result } = measurement
  const gap = result.gap?.gap
  return [
    `### ${label}: ${config.observationName}`,
    '',
    `- Observation date: ${config.observationDate}`,
    `- Dataset: ${config.datasetId} (PDS product ${config.productId}, web data v${config.version})`,
    `- Variable: ${config.variableLabel} (${config.unit})`,
    `- Window: ${format(config.range[0], 3)}–${format(config.range[1], 3)} km from Saturn’s center`,
    ...(config.variableId === 'optical_depth' ? [`- Threshold: optical depth below ${format(config.threshold, 4)}`] : []),
    `- Rows in window: ${format(result.statistics.rowCount, 0)} (${format(result.statistics.finiteCount, 0)} with values)`,
    `- Median ${format(result.statistics.median, 6)} · mean ${format(result.statistics.mean, 6)} · min ${format(result.statistics.minimum, 6)} · max ${format(result.statistics.maximum, 6)}`,
    ...(result.gap ? [gap ? `- Gap below threshold: ${format(gap.inner, 3)}–${format(gap.outer, 3)} km, width ${format(gap.width, 2)} km (${format(gap.rows, 0)} rows)` : '- Gap below threshold: none in this window'] : []),
    `- Reopen this view: ${config.viewUrl}`,
    '',
  ]
}

export function reproductionMarkdown({ baseline, current, question, now = new Date() }) {
  const comparison = baseline && current ? compareMeasurements(baseline, current) : null
  const lines = [
    `# ${question || 'Ring window measurement'}`,
    '',
    `Generated ${now.toISOString()} · derived from archived Cassini RSS profiles (NASA PDS CO-SR-RSS-4/5-OCC-V2.0).`,
    '',
    ...(baseline ? measurementLines('Baseline', baseline) : []),
    ...(current ? measurementLines('Comparison', current) : []),
  ]
  if (comparison?.sameVariable && Number.isFinite(comparison.differences.gapWidth)) lines.push(`**Gap width difference (comparison − baseline): ${comparison.differences.gapWidth > 0 ? '+' : ''}${format(comparison.differences.gapWidth, 2)} km**`, '')
  if (comparison?.warnings.length) lines.push(...comparison.warnings.map((warning) => `> ${warning}`), '')
  lines.push('## Method', '', measurementMethod.statistics, '', measurementMethod.gap, '', '## Limitations', '', measurementMethod.limitations, '')
  return lines.join('\n')
}
