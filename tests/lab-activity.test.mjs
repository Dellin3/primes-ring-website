import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { activityHref, getActivity, labActivities } from '../src/content/labActivities.js'
import { compareMeasurements, gapBelowThreshold, measureWindow, reproductionMarkdown, reproductionRecord, windowStatistics } from '../src/lib/windowMeasurements.js'

const root = new URL('../', import.meta.url)
const catalog = JSON.parse(await readFile(new URL('public/data/observations/catalog.json', root)))

// The same SHA-verified Float64 chunks the browser loads.
async function exactRows(slug, [from, to]) {
  const observation = catalog.observations.find((item) => item.slug === slug)
  const base = new URL(`public${observation.base_path}/`, root)
  const index = JSON.parse(await readFile(new URL('index.json', base)))
  const rows = []
  for (const chunk of index.chunks) {
    if (chunk.radius_maximum_km < from || chunk.radius_minimum_km > to) continue
    const bytes = await readFile(new URL(chunk.file_name, base))
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    for (let row = 0; row < chunk.row_count; row += 1) {
      const sample = { sample_index: chunk.first_sample_index + row }
      index.storage.columns.forEach((column, columnIndex) => { sample[column.id] = view.getFloat64(row * 32 + columnIndex * 8, true) })
      if (sample.ring_radius_km >= from && sample.ring_radius_km <= to) rows.push(sample)
    }
  }
  return rows
}

test('the Encke Gap activity states widths that the exact data reproduce', async () => {
  const activity = getActivity('encke-width')
  for (const observation of catalog.observations) {
    const covers = observation.radial_range.minimum <= activity.range[0] && observation.radial_range.maximum >= activity.range[1]
    assert.equal(observation.slug in activity.expectedWidths, covers, `${observation.slug}: listed exactly when it covers the window`)
    if (!covers) continue
    const rows = await exactRows(observation.slug, activity.range)
    const { gap } = measureWindow(rows, 'optical_depth', activity.threshold)
    assert.equal(gap.gap.width, activity.expectedWidths[observation.slug], `${observation.slug} width`)
  }
  const low = activity.lowThreshold
  const rows = await exactRows(low.slug, activity.range)
  assert.equal(gapBelowThreshold(rows, low.threshold).gap.width, low.width)
  const widths = Object.values(activity.expectedWidths)
  assert(activity.finding.includes(String(Math.round(Math.min(...widths)))) && activity.finding.includes(String(Math.round(Math.max(...widths)))), 'the finding quotes the measured range')
  assert(activity.finding.includes(String(Math.round(low.width))))
  assert(activityHref(activity).startsWith(`/data/${activity.baselineSlug}?`) && activityHref(activity).includes('threshold=0.1') && activityHref(activity).includes('activity=encke-width'))
  assert.equal(Object.keys(labActivities).length, 1)
})

test('window statistics count every row and ignore missing values in summaries', () => {
  const rows = [
    { sample_index: 0, ring_radius_km: 10, optical_depth: 1 },
    { sample_index: 1, ring_radius_km: 10.25, optical_depth: Number.NaN },
    { sample_index: 2, ring_radius_km: 10.5, optical_depth: 3 },
    { sample_index: 3, ring_radius_km: 10.75, optical_depth: 2 },
  ]
  assert.deepEqual(windowStatistics(rows, 'optical_depth'), { rowCount: 4, finiteCount: 3, minimum: 1, median: 2, mean: 2, maximum: 3 })
})

test('a gap is the longest run below the threshold in radius order; missing values end a run', () => {
  const tau = [0.5, 0.01, 0.02, Number.NaN, 0.01, 0.01, 0.01, 0.4, 0.01]
  // Supplied in descending radius order, as an ingress profile would be.
  const rows = tau.map((value, index) => ({ sample_index: index, ring_radius_km: 100 - index * 0.25, optical_depth: value })).reverse()
  const result = gapBelowThreshold(rows, 0.05)
  assert.deepEqual([result.gap.inner, result.gap.outer, result.gap.width, result.gap.rows], [98.5, 99, 0.5, 3])
  assert.equal(result.fractionBelow, 6 / 8)
  assert.equal(gapBelowThreshold(rows, 0.001).gap, null)
})

test('comparisons refuse incompatible variables and flag different thresholds', () => {
  const make = (variableId, threshold, width, range = [1, 2]) => ({ config: { variableId, threshold, range }, result: { statistics: { median: 1, mean: 1, minimum: 0, maximum: 2 }, gap: { gap: { width }, fractionBelow: 0.5 } } })
  const same = compareMeasurements(make('optical_depth', 0.1, 300), make('optical_depth', 0.1, 309))
  assert.equal(same.differences.gapWidth, 9)
  assert.deepEqual(same.warnings, [])
  const threshold = compareMeasurements(make('optical_depth', 0.1, 300), make('optical_depth', 0.05, 72))
  assert(threshold.warnings.some((warning) => warning.includes('thresholds differ')))
  const variable = compareMeasurements(make('optical_depth', 0.1, 300), make('signal_power', 0.1, 300))
  assert.equal(variable.sameVariable, false)
  assert.deepEqual(variable.differences, {})
  assert(compareMeasurements(make('optical_depth', 0.1, 1), make('optical_depth', 0.1, 1, [1, 3])).warnings.some((warning) => warning.includes('windows differ')))
})

test('the reproduction record carries identifiers, settings, results and the method', async () => {
  const activity = getActivity('encke-width')
  const metadata = JSON.parse(await readFile(new URL('public/data/observations/rss_2009_360_x63_e_dlp_500m/metadata.json', root)))
  const rows = await exactRows('rev123e-x63-dlp-500m', activity.range)
  const config = { observationName: 'Rev 123 Egress · X-band · DSN 63', observationDate: '2009-12-26', datasetId: metadata.dataset_id, productId: metadata.pds_identity.product_id, ringObservationId: metadata.pds_identity.ring_observation_id, dataSetId: metadata.pds_identity.data_set_id, version: metadata.web_product_version, variableId: 'optical_depth', variableLabel: 'Normal Optical Depth', unit: 'dimensionless', range: activity.range, threshold: 0.1, viewUrl: 'https://example.org/data/rev123e-x63-dlp-500m' }
  const baseline = { config, result: measureWindow(rows, 'optical_depth', 0.1) }
  const record = reproductionRecord({ baseline, current: baseline, question: activity.question, origin: 'https://example.org', now: new Date('2026-11-09T00:00:00Z') })
  assert.equal(record.baseline.dataset_id, 'rss_2009_360_x63_e_dlp_500m')
  assert.equal(record.baseline.pds_product_id, metadata.pds_identity.product_id)
  assert.equal(record.baseline.results.gap_width_km, 320)
  assert.equal(record.baseline.results.rows_in_window, rows.length)
  assert.equal(record.difference_comparison_minus_baseline.gapWidth, 0)
  assert(record.method.gap.includes('longest unbroken run'))
  const markdown = reproductionMarkdown({ baseline, current: baseline, question: activity.question })
  assert(markdown.includes('width 320 km') && markdown.includes('Limitations'))
})
