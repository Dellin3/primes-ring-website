import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { parseCsvText, parseNumericValue } from '../src/lib/csv.js'
import {
  buildExactWindowCsv, chunksIntersectingRange, clearObservationCaches,
  estimatedRecordCount, exactWindowBounds, exactWindowFilename, loadExactRange,
  nearestSample, normalizeRadialRange, sampleAtOffset,
} from '../src/lib/webObservation.js'
import { getExample } from '../src/content/explorationExamples.js'
import { displayUnit, isFiniteProfileSample, numericExtent, radialDisplayInterval, shouldBreakProfile } from '../src/lib/profileRendering.js'
import { requiresContinuityNeutralPoints } from '../src/lib/profileSegments.js'

const root = new URL('../', import.meta.url)
const json = async (path) => JSON.parse(await readFile(new URL(path, root)))
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const columns = [
  { id: 'ring_radius_km', label: 'Ring Radius', unit: 'KILOMETER', source_column: 'RING RADIUS' },
  { id: 'optical_depth', label: 'Normal Optical Depth', unit: 'N/A', source_column: 'NORMAL OPTICAL DEPTH' },
  { id: 'signal_power', label: 'Normalized Signal Power', unit: 'N/A', source_column: 'NORMALIZED SIGNAL POWER' },
  { id: 'phase_shift', label: 'Phase Shift', unit: 'DEGREE', source_column: 'PHASE SHIFT' },
]
const metadata = {
  dataset_id: 'fixture', web_product_version: 'test-1', schema_version: 1,
  binary_columns: columns,
  pds_identity: { product_id: 'FIXTURE.TAB', data_set_id: 'CO-SR-RSS-4/5-OCC-V2.0' },
  observation: { record_count: 3, radial_range: { minimum: 1.125, maximum: 1.625 } },
}

test('whitespace and absent numeric fields remain missing; real zero and negatives survive', () => {
  for (const value of [null, undefined, '', ' ', '\n\t ', 'NaN', 'Infinity']) {
    assert.equal(parseNumericValue(value), null)
  }
  assert.equal(parseNumericValue(' 0 '), 0)
  assert.equal(parseNumericValue(' -0.0125 '), -0.0125)
})

test('plot extents ignore missing values and invalid radius pairs without fabricating zero', () => {
  const samples = [
    { ring_radius_km: 1, optical_depth: 3 },
    { ring_radius_km: 2, optical_depth: null },
    { ring_radius_km: 3, optical_depth: undefined },
    { ring_radius_km: 4, optical_depth: NaN },
    { ring_radius_km: null, optical_depth: -1000 },
    { ring_radius_km: 5, optical_depth: 5 },
  ]
  assert.deepEqual(numericExtent(samples, 'optical_depth', 0), [3, 5])
  assert.equal(numericExtent(samples, 'absent_field'), null)
  assert.equal(isFiniteProfileSample(samples[1], 'optical_depth'), false)
  assert.equal(isFiniteProfileSample({ ring_radius_km: 1, optical_depth: -0.1 }, 'optical_depth'), true)
  assert.deepEqual(numericExtent(Array.from({ length: 293530 }, (_, n) => ({ ring_radius_km: n, optical_depth: n })), 'optical_depth', 0), [0, 293529])
})

test('exact line segments break on source gaps or documented radial gaps; sparse overview and descending samples remain valid', () => {
  const previous = { sample_index: 10, ring_radius_km: 100 }
  assert.equal(shouldBreakProfile(null, previous, 'exact', 0.25), true)
  assert.equal(shouldBreakProfile(previous, { sample_index: 11, ring_radius_km: 100.25 }, 'exact', 0.25), false)
  assert.equal(shouldBreakProfile(previous, { sample_index: 11, ring_radius_km: 99.75 }, 'exact', 0.25), false)
  assert.equal(shouldBreakProfile(previous, { sample_index: 13, ring_radius_km: 100.25 }, 'exact', 0.25), true)
  assert.equal(shouldBreakProfile(previous, { sample_index: 11, ring_radius_km: 101 }, 'exact', 0.25), true)
  assert.equal(shouldBreakProfile(previous, { sample_index: 400, ring_radius_km: 10000 }, 'overview', 0.25), false)
  assert.equal(radialDisplayInterval([previous], 0.25), 0.25)
  assert.equal(radialDisplayInterval([previous, { sample_index: 11, ring_radius_km: 99.75 }]), 0.25)
  assert.equal(radialDisplayInterval([previous, { sample_index: 15, ring_radius_km: 101.25 }]), null)
  assert.equal(requiresContinuityNeutralPoints({ id: 'phase_shift' }), true)
  assert.equal(displayUnit('N/A'), 'dimensionless')
  assert.equal(displayUnit('DEGREE'), 'degrees')
})

test('range normalization, overlap and record estimates use inclusive finite bounds', () => {
  assert.deepEqual(normalizeRadialRange([2, 1]), [1, 2])
  assert.throws(() => normalizeRadialRange([NaN, 1]), /finite/)
  assert.throws(() => normalizeRadialRange(['', 1]), /finite/)
  const index = { chunks: [
    { radius_minimum_km: 1, radius_maximum_km: 2 },
    { radius_minimum_km: 3, radius_maximum_km: 4 },
  ] }
  assert.equal(chunksIntersectingRange(index, [3, 2]).length, 2)
  assert.equal(chunksIntersectingRange(index, [2.1, 2.9]).length, 0)
  assert.equal(estimatedRecordCount(metadata, [0, 2]), 3)
  assert.equal(estimatedRecordCount(metadata, [2, 3]), 0)
  assert.equal(estimatedRecordCount(metadata, [1.125, 1.125]), 1)
})

test('nearest sample supports both radius directions without relabeling source indices', () => {
  const ascending = [1, 2, 3, 4].map((radius, n) => ({ sample_index: n + 91, ring_radius_km: radius }))
  const descending = [...ascending].reverse()
  for (const samples of [ascending, descending]) {
    assert.equal(nearestSample(samples, 2.2).sample_index, 92)
    assert.equal(nearestSample(samples, 99).ring_radius_km, 4)
    assert.equal(nearestSample(samples, -1).ring_radius_km, 1)
    assert.equal(nearestSample(samples, NaN), null)
  }
  assert.equal(nearestSample([{ ring_radius_km: NaN }, ...ascending], 2).sample_index, 92)
  assert.equal(sampleAtOffset(descending, descending[1], 1).sample_index, 92)
})

test('exact loading retains missing target fields, source order and precise closed boundaries; failed hash cannot hit stale cache', async (t) => {
  clearObservationCaches()
  const values = [
    [1.625, -0.001, 1.05, -179.9],
    [1.375, NaN, 0.5, 179.9],
    [1.125, 0, 1, 0],
  ]
  const bytes = Buffer.alloc(values.length * 32)
  values.forEach((row, r) => row.forEach((value, c) => bytes.writeDoubleLE(value, r * 32 + c * 8)))
  const chunk = {
    file_name: 'exact/chunk_000.bin', byte_length: bytes.length, row_count: 3,
    first_sample_index: 700, last_sample_index: 702,
    radius_minimum_km: 1.125, radius_maximum_km: 1.625, sha256: digest(bytes),
  }
  const index = {
    storage: { data_type: 'Float64', byte_order: 'little-endian', bytes_per_value: 8, bytes_per_record: 32, columns },
    chunks: [chunk],
  }
  t.mock.method(globalThis, 'fetch', async () => new Response(bytes))
  const { samples } = await loadExactRange('/fixture', [1.625, 1.125], index)
  assert.deepEqual(samples.map((row) => row.sample_index), [700, 701, 702])
  assert.equal(samples.length, 3)
  assert.ok(Number.isNaN(samples[1].optical_depth))
  assert.equal((await loadExactRange('/fixture', [1.375, 1.375], index)).samples.length, 1)
  assert.equal((await loadExactRange('/fixture', [1.126, 1.624], index)).samples.length, 1)
  const invalidIndex = { ...index, chunks: [{ ...chunk, sha256: '0'.repeat(64) }] }
  await assert.rejects(loadExactRange('/fixture', [1, 2], invalidIndex), /SHA-256 verification failed/)
  const csv = buildExactWindowCsv(metadata, samples, new Date('2026-09-08T00:00:00Z'), { range: [1.1249, 1.6251], variableId: 'optical_depth' })
  const parsed = parseCsvText(csv)
  assert.equal(parsed.length, 3)
  assert.equal(parsed[1].optical_depth, '')
  assert.equal(parsed[0].optical_depth, '-0.001')
  assert.match(csv, /radius_minimum_km: 1.125/)
  assert.match(csv, /radius_maximum_km: 1.625/)
  assert.match(csv, /selected_radius_minimum_km: 1.1249/)
  assert.match(csv, /web_product_version: test-1/)
  assert.match(csv, /unit=dimensionless \(PDS unit: N\/A\)/)
  assert.match(csv, /phase_shift: Phase Shift; source=PHASE SHIFT; unit=DEGREE/)
  assert.match(exactWindowFilename(metadata, samples), /1.125_1.625km\.csv$/)
})

test('a failed exact fetch can be retried without changing the requested range', async (t) => {
  clearObservationCaches()
  const catalog = await json('public/data/observations/catalog.json')
  const observation = catalog.observations[0]
  const example = getExample(observation.dataset_id)
  const index = await json(`public${observation.index_url}`)
  let fail = true
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (fail) { fail = false; return new Response('', { status: 503 }) }
    return new Response(await readFile(new URL(`public${url}`, root)))
  })
  await assert.rejects(loadExactRange(observation.base_path, example.range, index), /503/)
  const result = await loadExactRange(observation.base_path, example.range, index)
  assert.equal(result.samples.length, 1025)
})

test('large exact exports avoid argument-stack limits and preserve Float64 values', () => {
  const rows = Array.from({ length: 293530 }, (_, n) => ({
    sample_index: n, ring_radius_km: 71737.75 + 0.25 * n,
    optical_depth: n === 0 ? null : -0.000000123456789012345,
    signal_power: n === 2 ? undefined : 0.5000000000000001, phase_shift: -179.99963,
  }))
  assert.deepEqual(exactWindowBounds(rows), [71737.75, 145120])
  const csv = buildExactWindowCsv(metadata, rows)
  assert.match(csv, /exact_row_count: 293530/)
  assert.match(csv, /-1.23456789012345e-7,0.5000000000000001,-179.99963/)
  assert.equal(csv.split('\n').filter((line) => line && !line.startsWith('#')).length, rows.length + 1)
})

test('all six catalog observations: every chunk hash, source identity, radius, variable range, overview point and guided example agree', async (t) => {
  clearObservationCaches()
  const catalog = await json('public/data/observations/catalog.json')
  assert.equal(catalog.observations.length, 6)
  let verifiedRows = 0
  let verifiedChunks = 0
  let verifiedOverviewPoints = 0
  t.mock.method(globalThis, 'fetch', async (url) => new Response(await readFile(new URL(`public${url}`, root))))
  for (const observation of catalog.observations) {
    const metadata = await json(`public${observation.metadata_url}`)
    const index = await json(`public${observation.index_url}`)
    const overview = await json(`public${observation.overview_url}`)
    assert.equal(metadata.pds_identity.product_id, observation.product_id)
    assert.equal(index.dataset_id, observation.dataset_id)
    assert.equal(metadata.observation.record_count, index.total_records)
    let rows = 0
    const minima = [Infinity, Infinity, Infinity, Infinity]
    const maxima = [-Infinity, -Infinity, -Infinity, -Infinity]
    const bytesByChunk = new Map()
    for (const chunk of index.chunks) {
      const bytes = await readFile(new URL(`public${observation.base_path}/${chunk.file_name}`, root))
      bytesByChunk.set(chunk.chunk, bytes)
      assert.equal(digest(bytes), chunk.sha256)
      assert.equal(bytes.length, chunk.byte_length)
      assert.equal(bytes.length, chunk.row_count * index.storage.bytes_per_record)
      assert.equal(chunk.first_sample_index, rows)
      assert.equal(chunk.last_sample_index, rows + chunk.row_count - 1)
      let chunkMinimum = Infinity
      let chunkMaximum = -Infinity
      for (let row = 0; row < chunk.row_count; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const value = bytes.readDoubleLE(row * 32 + column * 8)
          assert.ok(Number.isFinite(value), 'Current verified source products contain no missing published fields')
          minima[column] = Math.min(minima[column], value)
          maxima[column] = Math.max(maxima[column], value)
          if (column === 0) {
            chunkMinimum = Math.min(chunkMinimum, value)
            chunkMaximum = Math.max(chunkMaximum, value)
          }
        }
      }
      assert.equal(chunkMinimum, chunk.radius_minimum_km)
      assert.equal(chunkMaximum, chunk.radius_maximum_km)
      rows += chunk.row_count
      verifiedChunks += 1
    }
    assert.equal(rows, observation.record_count)
    assert.equal(minima[0], observation.radial_range.minimum)
    assert.equal(maxima[0], observation.radial_range.maximum)
    metadata.principal_variables.forEach((variable) => {
      assert.equal(minima[variable.binary_column_index], variable.verified_value_range.minimum)
      assert.equal(maxima[variable.binary_column_index], variable.verified_value_range.maximum)
    })
    assert.ok(minima[1] < 0, 'Published negative optical depth values are retained')
    for (const point of overview.points) {
      const sample = Object.fromEntries(overview.columns.map((column, n) => [column, point[n]]))
      const chunk = index.chunks.find((chunk) => sample.sample_index >= chunk.first_sample_index && sample.sample_index <= chunk.last_sample_index)
      const bytes = bytesByChunk.get(chunk.chunk)
      index.storage.columns.forEach((column, c) => {
        assert.equal(sample[column.id], bytes.readDoubleLE((sample.sample_index - chunk.first_sample_index) * 32 + c * 8))
      })
    }
    const example = getExample(observation.dataset_id)
    assert.equal(example.webProductVersion, metadata.web_product_version)
    assert.equal(example.slug, observation.slug)
    assert.ok(example.range[0] >= minima[0] && example.range[1] <= maxima[0])
    const exact = await loadExactRange(observation.base_path, example.range, index)
    assert.equal(exact.samples.length, example.sampleCount)
    assert.ok(exact.samples.length <= metadata.data_product.recommended_exact_window_records)
    assert.equal(exact.chunks.length, 1)
    assert.equal(exact.chunks[0].sha256, example.selectionEvidence.chunkSha256)
    assert.equal(exact.samples[0].sample_index, example.selectionEvidence.firstSampleIndex)
    assert.equal(exact.samples.at(-1).sample_index, example.selectionEvidence.lastSampleIndex)
    const values = exact.samples.map((sample) => sample.optical_depth)
    const left = values.slice(0, 256).sort((a, b) => a - b)
    const right = values.slice(769).sort((a, b) => a - b)
    assert.equal(Math.abs(left[128] - right[128]), example.selectionEvidence.outerQuarterMedianDifference)
    assert.ok(example.selectionEvidence.outerQuarterMedianDifference > 0.05)
    const csv = buildExactWindowCsv(metadata, exact.samples, new Date('2026-09-08T00:00:00Z'), { range: example.range, variableId: example.variableId })
    const exported = parseCsvText(csv)
    assert.equal(exported.length, exact.samples.length)
    exported.forEach((row, n) => {
      assert.equal(Number(row.sample_index), exact.samples[n].sample_index)
      index.storage.columns.forEach((column) => assert.equal(Number(row[column.id]), exact.samples[n][column.id]))
    })
    verifiedRows += rows
    verifiedOverviewPoints += overview.points.length
  }
  assert.equal(getExample('unknown-dataset'), null)
  t.diagnostic(`Verified ${verifiedRows} exact rows, ${verifiedChunks} SHA-256 hashes, ${verifiedOverviewPoints} overview points and 6 exact examples.`)
})
