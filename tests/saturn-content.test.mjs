import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { explorerHref, findObservation, guidedObservations, mapWindow, observationDate, observations, observedSpan, ringRegions } from '../src/content/rings.js'
import { formatPublished, moonColumns, moons, moonsCsv, moonsCsvPath, moonHighlights, sortMoons } from '../src/content/moons.js'
import { missionEras } from '../src/content/missions.js'
import { cohortPath, findCohort, primesCohorts } from '../src/content/primesCohorts.js'
import { keyFacts, moonCount, sections, sourceList, sources } from '../src/content/saturn.js'

const root = new URL('../', import.meta.url)
const RECOMMENDED_EXACT_ROWS = 32768
const rowsCache = new Map()

// Reads the same SHA-verified Float64 chunks the browser loads: rows of
// [ring radius km, normal optical depth, normalized signal power, phase].
async function exactRows(slug) {
  if (rowsCache.has(slug)) return rowsCache.get(slug)
  const observation = findObservation(slug)
  const base = new URL(`public${observation.base_path}/`, root)
  const index = JSON.parse(await readFile(new URL('index.json', base)))
  const rows = []
  for (const chunk of index.chunks) {
    const bytes = await readFile(new URL(chunk.file_name, base))
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    for (let offset = 0; offset < bytes.byteLength; offset += 32) rows.push([view.getFloat64(offset, true), view.getFloat64(offset + 8, true)])
  }
  rowsCache.set(slug, rows)
  return rows
}
const inside = (rows, [from, to]) => rows.filter(([radius]) => radius >= from && radius <= to)
function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
function peak(rows) {
  return rows.reduce((best, row) => row[1] > best[1] ? row : best)
}
function longestClearRun(rows, threshold) {
  let best = null, start = null, last = null
  for (const [radius, tau] of [...rows, [Infinity, Infinity]]) {
    if (tau < threshold) { start ??= radius; last = radius }
    else if (start !== null) { if (!best || last - start > best[1] - best[0]) best = [start, last]; start = null }
  }
  return best
}

test('every guided observation opens a covered, exact-size explorer window', () => {
  assert.equal(guidedObservations.length, 5)
  for (const item of guidedObservations) {
    for (const slug of [item.slug, item.compareSlug].filter(Boolean)) {
      const observation = findObservation(slug)
      assert(observation, `${item.id}: unknown observation ${slug}`)
      assert(item.range[0] >= observation.radial_range.minimum && item.range[1] <= observation.radial_range.maximum, `${item.id}: window inside ${slug}`)
      assert((item.range[1] - item.range[0]) / observation.radial_range.sampling_interval + 1 <= RECOMMENDED_EXACT_ROWS, `${item.id}: exact samples load for this window`)
      const href = new URL(explorerHref(slug, item.range), 'https://example.org')
      assert.equal(href.pathname, `/data/${slug}`)
      assert.deepEqual([href.searchParams.get('from'), href.searchParams.get('to'), href.searchParams.get('variable'), href.searchParams.get('version')], [String(item.range[0]), String(item.range[1]), 'optical_depth', '1.1.0'])
    }
    assert(item.question && item.look && item.notice && item.caution && item.checks.length, `${item.id}: complete text and checks`)
  }
})

test('the numbers stated in guided observations match the exact Cassini data', async () => {
  for (const item of guidedObservations) {
    for (const check of item.checks) {
      const rows = inside(await exactRows(check.slug || item.slug), check.range)
      assert(rows.length > 10, `${item.id}: data in ${check.range}`)
      if (check.kind === 'median') {
        const value = median(rows.map(row => row[1]))
        assert(Math.abs(value - check.expect) <= check.tolerance, `${item.id}: median ${value} in ${check.range} expected ${check.expect}`)
      } else if (check.kind === 'firstAbove') {
        const first = rows.find(([radius, tau]) => radius > check.range[0] && tau > check.threshold)
        assert(first && Math.abs(first[0] - check.expect) <= check.tolerance, `${item.id}: first crossing ${first?.[0]}`)
      } else if (check.kind === 'peak') {
        const [radius, tau] = peak(rows)
        assert(Math.abs(tau - check.expectValue) <= check.valueTolerance && Math.abs(radius - check.expectRadius) <= check.radiusTolerance, `${item.id}: peak ${tau} at ${radius}`)
      } else if (check.kind === 'peakRadiusSpread') {
        const radii = []
        for (const slug of check.slugs) radii.push(peak(inside(await exactRows(slug), check.range))[0])
        assert(Math.abs(Math.min(...radii) - check.expect[0]) <= check.tolerance && Math.abs(Math.max(...radii) - check.expect[1]) <= check.tolerance, `${item.id}: peak radii ${radii}`)
        const covering = observations.filter(observation => observation.radial_range.minimum <= check.range[0] && observation.radial_range.maximum >= check.range[1]).map(observation => observation.slug)
        assert.deepEqual([...check.slugs].sort(), covering.sort(), `${item.id}: the stated spread uses every observation that covers the gap`)
      } else if (check.kind === 'clearRun') {
        const run = longestClearRun(rows, check.threshold)
        assert(run && Math.abs(run[0] - check.expect[0]) <= check.tolerance && Math.abs(run[1] - check.expect[1]) <= check.tolerance, `${item.id}: clear run ${run}`)
      } else assert.fail(`Unknown check ${check.kind}`)
    }
  }
})

test('the F ring note matches all six profiles', async () => {
  const fRing = ringRegions.find(region => region.id === 'f-ring')
  assert(fRing.siteNote.includes('barely rises'))
  for (const observation of observations) {
    const rows = inside(await exactRows(observation.slug), [fRing.inner, fRing.outer])
    assert(peak(rows)[1] < 0.05, `${observation.slug}: F ring stays near the background`)
  }
})

test('ring regions follow the PDS table and link only to covered windows', () => {
  const ids = new Set()
  for (const region of ringRegions) {
    assert(!ids.has(region.id)); ids.add(region.id)
    assert(region.inner < region.outer && region.name && region.opticalDepth && region.note, region.id)
    if (region.parent) {
      const parent = ringRegions.find(item => item.id === region.parent)
      assert(region.inner >= parent.inner && region.outer <= parent.outer, `${region.id} inside ${parent.id}`)
    }
    const range = mapWindow(region)
    if (range) {
      const observation = findObservation('rev007e-x43-dlp-500m')
      assert(range[0] >= observation.radial_range.minimum && range[1] <= observation.radial_range.maximum && range[0] < range[1], region.id)
    }
  }
  assert.deepEqual(mapWindow(ringRegions.find(region => region.id === 'g-ring')), null)
  assert.deepEqual(observedSpan, [71737.75, 145212.5])
})

test('observation dates come from the PDS ring observation IDs', () => {
  assert.deepEqual(observations.map(observationDate), ['2005-05-03', '2006-09-15', '2007-05-10', '2008-04-11', '2009-12-26', '2010-06-19'])
  const radioEntry = missionEras.flatMap(era => era.entries).find(entry => entry.title === 'The six radio profiles on this site')
  assert(radioEntry.text.includes('May 3, 2005') && radioEntry.text.includes('June 19, 2010'))
})

test('moons table: complete rows, faithful formatting, and a CSV that matches the page', async () => {
  assert.equal(moons.length, 16)
  const distances = moons.map(moon => Number(moon.a))
  assert.deepEqual(distances, [...distances].sort((a, b) => a - b), 'stored from the rings outward')
  for (const moon of moons) {
    for (const key of ['id', 'name', 'group', 'a', 'e', 'i', 'period', 'year', 'discoverers']) assert(moon[key], `${moon.name}: ${key}`)
    if (!moon.radius) assert(moon.note, `${moon.name}: explain the missing radius`)
  }
  assert.equal(formatPublished('2574.76'), '2,574.76')
  assert.equal(formatPublished('12929400'), '12,929,400')
  assert.equal(formatPublished('0.3650'), '0.3650')
  assert.equal(sortMoons(moons, 'radius', 'descending')[0].name, 'Titan')
  assert.equal(sortMoons(moons, 'radius', 'ascending').at(-1).name, 'Daphnis', 'missing values sort last')
  assert.equal(sortMoons(moons, 'year', 'ascending')[0].name, 'Titan')
  assert.deepEqual(moonColumns.map(column => column.key), ['name', 'radius', 'a', 'period', 'density', 'year'])
  const file = await readFile(new URL(`public${moonsCsvPath}`, root), 'utf8')
  assert.equal(file, moonsCsv(), 'Run npm run data:moons after editing src/content/moons.js')
  const dataRows = file.split('\n').filter(line => line && !line.startsWith('#'))
  assert.equal(dataRows.length, 17)
  for (const highlight of moonHighlights) for (const name of highlight.names) assert(moons.some(moon => moon.name === name), `${highlight.id}: ${name} is in the table`)
})

test('every cited source exists and uses HTTPS', () => {
  const cited = [
    ...keyFacts.flatMap(fact => fact.sources),
    ...moonHighlights.flatMap(item => item.sources),
    ...missionEras.flatMap(era => era.entries.flatMap(entry => entry.sources)),
    moonCount.source,
  ]
  assert.doesNotThrow(() => sourceList(cited))
  for (const source of Object.values(sources)) assert.equal(new URL(source.url).protocol, 'https:')
})

test('PRIMES cohorts form a usable archive', () => {
  const years = primesCohorts.map(cohort => cohort.year)
  assert.equal(new Set(years).size, years.length)
  for (const cohort of primesCohorts) {
    assert(Number.isInteger(cohort.year) && cohort.year >= 2026)
    for (const key of ['program', 'title', 'mentor', 'status', 'question', 'summary', 'data']) assert(cohort[key], `${cohort.year}: ${key}`)
    assert(cohort.team.length && cohort.focus.length && Array.isArray(cohort.results) && Array.isArray(cohort.materials))
    assert.equal(cohortPath(cohort), `/research/${cohort.year}`)
    assert.equal(findCohort(String(cohort.year)), cohort)
  }
  assert(findCohort(2026).story, 'the 2026 cohort keeps its full research story')
  assert.equal(findCohort('signal-and-phase'), undefined)
})

test('sections list every public section page once, in navigation order', () => {
  assert.deepEqual(sections.map(section => section.path), ['/planet', '/rings', '/moons', '/missions', '/research'])
  assert(sections.every(section => section.title && section.summary && /^0[1-5]$/.test(section.number)))
})
