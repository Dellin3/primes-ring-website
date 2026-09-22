const jsonCache = new Map()
const chunkCache = new Map()
const MAX_CACHED_CHUNKS = 24
export const OBSERVATION_CATALOG_URL = '/data/observations/catalog.json'

// Range boundaries are inclusive. This never changes source sample identities.
export function normalizeRadialRange(range) {
  if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isFinite)) {
    throw new Error('Enter two finite radius boundaries in kilometers.')
  }
  return range[0] <= range[1] ? [...range] : [range[1], range[0]]
}

function normalizedBasePath(basePath) {
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
}

async function checkedResponse(response, resource) {
  if (!response.ok) {
    throw new Error(`Unable to load ${resource} (${response.status})`)
  }
  return response
}

export function fetchJsonCached(url) {
  if (!jsonCache.has(url)) {
    const request = fetch(url)
      .then((response) => checkedResponse(response, url))
      .then((response) => response.json())
      .catch((error) => {
        jsonCache.delete(url)
        throw error
      })
    jsonCache.set(url, request)
  }
  return jsonCache.get(url)
}

export function loadObservationSummary(basePath) {
  const base = normalizedBasePath(basePath)
  return Promise.all([
    fetchJsonCached(`${base}/metadata.json`),
    fetchJsonCached(`${base}/overview.json`),
  ]).then(([metadata, overview]) => ({ metadata, overview }))
}

export function loadObservationCatalog() {
  return fetchJsonCached(OBSERVATION_CATALOG_URL)
}

export function loadObservationOverview(observation) {
  return fetchJsonCached(observation.overview_url)
}

export function loadObservationIndex(basePath) {
  return fetchJsonCached(`${normalizedBasePath(basePath)}/index.json`)
}

export function overviewSamples(overview) {
  const columnNames = overview.columns
  return overview.points.map((point) => (
    columnNames.reduce((sample, columnName, index) => {
      sample[columnName] = point[index]
      return sample
    }, {})
  ))
}

export function chunksIntersectingRange(index, range) {
  const [minimum, maximum] = normalizeRadialRange(range)
  return index.chunks.filter((chunk) => (
    chunk.radius_maximum_km >= minimum
    && chunk.radius_minimum_km <= maximum
  ))
}

function hexDigest(arrayBuffer) {
  return Array.from(new Uint8Array(arrayBuffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyChunkHash(arrayBuffer, expectedHash, resource) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(`SHA-256 verification is unavailable for ${resource}`)
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer)
  if (hexDigest(digest) !== expectedHash) {
    throw new Error(`SHA-256 verification failed for ${resource}`)
  }
}

function decodeChunk(arrayBuffer, chunk, storage) {
  if (arrayBuffer.byteLength !== chunk.byte_length) {
    throw new Error(`Binary length mismatch for ${chunk.file_name}`)
  }
  if (
    storage.data_type !== 'Float64' || storage.byte_order !== 'little-endian'
    || storage.bytes_per_value !== 8
    || storage.bytes_per_record !== storage.columns.length * 8
  ) {
    throw new Error('Unsupported exact-observation binary storage')
  }
  if (arrayBuffer.byteLength !== chunk.row_count * storage.bytes_per_record) {
    throw new Error(`Binary row count mismatch for ${chunk.file_name}`)
  }

  const dataView = new DataView(arrayBuffer)
  return Array.from({ length: chunk.row_count }, (_, localIndex) => {
    const sample = {
      sample_index: chunk.first_sample_index + localIndex,
    }
    const rowOffset = localIndex * storage.bytes_per_record
    storage.columns.forEach((column, columnIndex) => {
      sample[column.id] = dataView.getFloat64(
        rowOffset + columnIndex * storage.bytes_per_value,
        true,
      )
    })
    return sample
  })
}

function loadExactChunk(basePath, index, chunk) {
  const resource = `${normalizedBasePath(basePath)}/${chunk.file_name}`
  const cacheKey = `${resource}:${chunk.sha256}`
  if (!chunkCache.has(cacheKey)) {
    const request = fetch(resource)
      .then((response) => checkedResponse(response, resource))
      .then((response) => response.arrayBuffer())
      .then(async (arrayBuffer) => {
        await verifyChunkHash(arrayBuffer, chunk.sha256, resource)
        return decodeChunk(arrayBuffer, chunk, index.storage)
      })
      .catch((error) => {
        chunkCache.delete(cacheKey)
        throw error
      })
    chunkCache.set(cacheKey, request)
    while (chunkCache.size > MAX_CACHED_CHUNKS) {
      chunkCache.delete(chunkCache.keys().next().value)
    }
  }
  return chunkCache.get(cacheKey)
}

export async function loadExactRange(basePath, range, suppliedIndex = null) {
  const [minimum, maximum] = normalizeRadialRange(range)
  const index = suppliedIndex ?? await loadObservationIndex(basePath)
  const chunks = chunksIntersectingRange(index, [minimum, maximum])
  const chunkRows = await Promise.all(
    chunks.map((chunk) => loadExactChunk(basePath, index, chunk)),
  )
  const samples = chunkRows
    .flat()
    .filter((sample) => (
      sample.ring_radius_km >= minimum
      && sample.ring_radius_km <= maximum
    ))
    .sort((left, right) => left.sample_index - right.sample_index)
  return {
    index,
    chunks,
    samples,
  }
}

export function estimatedRecordCount(metadata, range) {
  const [minimum, maximum] = normalizeRadialRange(range)
  const radialRange = metadata.observation.radial_range
  if (maximum < radialRange.minimum || minimum > radialRange.maximum) return 0
  const fullSpan = radialRange.maximum - radialRange.minimum
  if (fullSpan <= 0) return metadata.observation.record_count
  const selectedSpan = Math.max(0, Math.min(maximum, radialRange.maximum)
    - Math.max(minimum, radialRange.minimum))
  return Math.min(
    metadata.observation.record_count,
    Math.ceil(
      (metadata.observation.record_count - 1) * (selectedSpan / fullSpan),
    ) + 1,
  )
}

function nearestFiniteSample(samples, radius) {
  let nearest = null
  let distance = Infinity
  for (const sample of samples) {
    if (!Number.isFinite(sample.ring_radius_km)) continue
    const candidateDistance = Math.abs(sample.ring_radius_km - radius)
    if (candidateDistance < distance) {
      nearest = sample
      distance = candidateDistance
    }
  }
  return nearest
}

export function nearestSample(samples, radius) {
  if (!samples.length || !Number.isFinite(radius)) return null
  if (!Number.isFinite(samples[0].ring_radius_km)
    || !Number.isFinite(samples.at(-1).ring_radius_km)) {
    return nearestFiniteSample(samples, radius)
  }
  const ascending = samples[0].ring_radius_km <= samples.at(-1).ring_radius_km
  let lower = 0
  let upper = samples.length - 1
  while (lower <= upper) {
    const middle = Math.floor((lower + upper) / 2)
    const middleRadius = samples[middle].ring_radius_km
    // Missing radii cannot be searched by ordering; keep valid source samples.
    if (!Number.isFinite(middleRadius)) {
      return nearestFiniteSample(samples, radius)
    }
    if (middleRadius === radius) return samples[middle]
    if (ascending ? middleRadius < radius : middleRadius > radius) lower = middle + 1
    else upper = middle - 1
  }
  if (lower >= samples.length) return samples.at(-1)
  if (upper < 0) return samples[0]
  return (
    Math.abs(samples[lower].ring_radius_km - radius)
      < Math.abs(samples[upper].ring_radius_km - radius)
      ? samples[lower]
      : samples[upper]
  )
}

export function sampleAtOffset(samples, currentSample, offset) {
  if (!samples.length) return null
  if (offset === Number.NEGATIVE_INFINITY) return samples[0]
  if (offset === Number.POSITIVE_INFINITY) return samples.at(-1)
  const currentIndex = currentSample
    ? samples.findIndex(
      (sample) => sample.sample_index === currentSample.sample_index,
    )
    : Math.floor(samples.length / 2)
  const safeIndex = currentIndex < 0
    ? Math.floor(samples.length / 2)
    : currentIndex
  return samples[
    Math.min(samples.length - 1, Math.max(0, safeIndex + offset))
  ]
}

function csvNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return Object.is(number, -0) ? '-0' : number.toString()
}

export function sourceDatasetUrl(metadata) {
  return `https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=${encodeURIComponent(metadata.pds_identity.data_set_id)}`
}

export function exactWindowBounds(rows) {
  let minimum = Infinity
  let maximum = -Infinity
  for (const row of rows) {
    if (!Number.isFinite(row.ring_radius_km)) continue
    minimum = Math.min(minimum, row.ring_radius_km)
    maximum = Math.max(maximum, row.ring_radius_km)
  }
  return minimum <= maximum ? [minimum, maximum] : null
}

export function buildExactWindowCsv(metadata, rows, generatedTime = new Date(), options = {}) {
  if (!rows.length) return ''
  const columns = metadata.binary_columns.map((column) => column.id)
  const bounds = exactWindowBounds(rows)
  if (!bounds) throw new Error('No finite-radius source records are available to export.')
  const selectedRange = normalizeRadialRange(options.range ?? bounds)
  const lines = [
    '# PROJECT-EXPORTED EXACT WINDOW',
    `# dataset_id: ${metadata.dataset_id}`,
    `# product_id: ${metadata.pds_identity.product_id}`,
    `# source_product_id: ${metadata.pds_identity.source_product_id ?? 'not recorded'}`,
    `# pds_data_set_id: ${metadata.pds_identity.data_set_id}`,
    `# source_dataset_url: ${sourceDatasetUrl(metadata)}`,
    `# web_product_version: ${metadata.web_product_version}`,
    `# metadata_schema_version: ${metadata.schema_version}`,
    `# source_product_creation_time: ${metadata.pds_identity.product_creation_time ?? 'not recorded'}`,
    `# radius_minimum_km: ${csvNumber(bounds[0])}`,
    `# radius_maximum_km: ${csvNumber(bounds[1])}`,
    `# selected_radius_minimum_km: ${csvNumber(selectedRange[0])}`,
    `# selected_radius_maximum_km: ${csvNumber(selectedRange[1])}`,
    '# boundary_rule: minimum <= ring_radius_km <= maximum (both boundaries inclusive)',
    '# sample_index: zero-based source record index; source record order preserved',
    `# ring_profile_direction: ${metadata.observation?.ring_profile_direction ?? 'not recorded'}`,
    `# active_variable: ${options.variableId ?? 'not recorded; all published fields exported'}`,
    '# display_mode: exact converted source records; no interpolation or overview decimation',
    '# missing_value_rule: retain every source record in the radius window; missing or non-finite numeric values are empty fields',
    '# quality_flags: not included in the published four-field derivative; no per-sample quality classification inferred',
    ...metadata.binary_columns.map((column) => (
      `# column ${column.id}: ${column.label}; source=${column.source_column}; unit=${column.unit === 'N/A' ? 'dimensionless (PDS unit: N/A)' : column.unit}`
    )),
    `# exact_row_count: ${rows.length}`,
    `# generated_time: ${generatedTime.toISOString()}`,
    '# source: exact non-interpolated Float64 project derivative of a conversion-verified Cassini RSS PDS3 DLP profile product; not the original PDS ASCII table',
    ['sample_index', ...columns].join(','),
    ...rows.map((row) => [
      row.sample_index,
      ...columns.map((column) => csvNumber(row[column])),
    ].join(',')),
  ]
  return `${lines.join('\n')}\n`
}

export function exactWindowFilename(metadata, rows, range = null) {
  const bounds = normalizeRadialRange(range ?? exactWindowBounds(rows))
  return `${metadata.dataset_id}_v${metadata.web_product_version}_window_${csvNumber(bounds[0])}_${csvNumber(bounds[1])}km.csv`
}

export function downloadExactWindow(metadata, rows, options = {}) {
  const csvText = buildExactWindowCsv(metadata, rows, new Date(), options)
  if (!csvText) return null
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const fileName = exactWindowFilename(metadata, rows, options.range)
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Keep the object URL alive long enough for WebKit to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { csvText, fileName, rowCount: rows.length }
}

export function clearObservationCaches() {
  jsonCache.clear()
  chunkCache.clear()
}
