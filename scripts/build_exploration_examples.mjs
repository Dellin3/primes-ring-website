#!/usr/bin/env node
// Select teachable local changes from verified exact bytes, without assigning a
// geological interpretation. Run from any directory; no network or dependencies.
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const catalog = JSON.parse(await readFile(new URL('public/data/observations/catalog.json', root)))
const examples = {}
const sampleCount = 1025

for (const observation of catalog.observations) {
  const base = new URL(`public${observation.base_path}/`, root)
  const metadata = JSON.parse(await readFile(new URL('metadata.json', base)))
  const index = JSON.parse(await readFile(new URL('index.json', base)))
  if (sampleCount > metadata.data_product.recommended_exact_window_records) {
    throw new Error(`Example exceeds supported window: ${observation.dataset_id}`)
  }
  let best = null
  for (const chunk of index.chunks) {
    const bytes = await readFile(new URL(chunk.file_name, base))
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    if (sha256 !== chunk.sha256) throw new Error(`Hash mismatch: ${chunk.file_name}`)
    const radiusAt = (row) => bytes.readDoubleLE(row * index.storage.bytes_per_record)
    const valueAt = (row) => bytes.readDoubleLE(row * index.storage.bytes_per_record + 8)
    // Every candidate fits in a single 8192-record chunk. Compare the outer
    // quarters so one isolated spike cannot determine the example by itself.
    for (let start = 0; start + sampleCount <= chunk.row_count; start += 32) {
      const values = Array.from({ length: sampleCount }, (_, n) => valueAt(start + n))
      if (!values.every(Number.isFinite)) continue
      const left = values.slice(0, 256).sort((a, b) => a - b)
      const right = values.slice(769).sort((a, b) => a - b)
      const difference = Math.abs(left[128] - right[128])
      const variation = left[192] - left[64] + right[192] - right[64]
      const score = difference / (variation + 0.03)
      if (best && score <= best.score) continue
      const range = [radiusAt(start), radiusAt(start + sampleCount - 1)].sort((a, b) => a - b)
      best = {
        score, range, difference,
        minimum: Math.min(...values), maximum: Math.max(...values),
        firstSampleIndex: chunk.first_sample_index + start,
        chunkSha256: sha256,
      }
    }
  }
  if (!best || best.difference < 0.05) {
    throw new Error(`No supported clear local change: ${observation.dataset_id}`)
  }
  examples[observation.dataset_id] = {
    datasetId: observation.dataset_id,
    slug: observation.slug,
    variableId: 'optical_depth',
    range: best.range,
    sampleCount,
    validSampleCount: sampleCount,
    webProductVersion: metadata.web_product_version,
    question: 'How does optical depth change across this region?',
    prompt: 'Compare two nearby positions. Record what you observe and what the plot alone cannot tell you.',
    selectionEvidence: {
      method: 'Exact 1025-record window; outer-quarter median contrast relative to within-quarter variation. No feature identity or physical explanation inferred.',
      firstSampleIndex: best.firstSampleIndex,
      lastSampleIndex: best.firstSampleIndex + sampleCount - 1,
      outerQuarterMedianDifference: best.difference,
      opticalDepthRange: [best.minimum, best.maximum],
      chunkSha256: best.chunkSha256,
    },
  }
}

const target = new URL('src/content/explorationExamples.js', root)
await writeFile(target, `// Generated from SHA-256-verified exact records by scripts/build_exploration_examples.mjs.\n// This is a window configuration, not a second copy of observational data.\nexport const explorationExamples = ${JSON.stringify(examples, null, 2)}\n\nexport const defaultExampleDatasetId = ${JSON.stringify(catalog.featured_dataset_id)}\n\nexport function getExample(datasetId) {\n  return explorationExamples[datasetId] ?? null\n}\n`)
console.log(`Wrote ${Object.keys(examples).length} verified example windows: ${fileURLToPath(target)}`)
