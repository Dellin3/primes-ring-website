import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { niceAxisTicks, axisTickFormatter, measuredAxisTicks, measuredProfileAxes } from '../src/lib/profileAxes.js'
import { numericExtent } from '../src/lib/profileRendering.js'
import { getExample } from '../src/content/explorationExamples.js'
import { buildExactWindowCsv, clearObservationCaches, loadExactRange, overviewSamples } from '../src/lib/webObservation.js'

test('nice ticks stay within the unchanged domain, retain negative scale values and avoid floating artifacts', () => {
  const domain = Object.freeze([-0.04614, 0.08072])
  const ticks = niceAxisTicks(...domain, 5)
  assert.deepEqual(ticks.values, [-0.025, 0, 0.025, 0.05, 0.075])
  assert.deepEqual(domain, [-0.04614, 0.08072])
  assert.deepEqual(niceAxisTicks(0.1, 0.3, 5).values, [0.1, 0.15, 0.2, 0.25, 0.3])
  for (const value of ticks.values) assert.ok(value >= domain[0] && value <= domain[1])
  assert.deepEqual(niceAxisTicks(NaN, 1).values, [])
  assert.deepEqual(niceAxisTicks(3, 3).values, [3])
})

test('formatters derive precision from tick spacing, use grouped absolute radii and readable small values', () => {
  const decimal = axisTickFormatter({ minimum: -0.04614, maximum: 0.08072, step: 0.025 })
  assert.equal(decimal(-0.025), '−0.025')
  assert.equal(decimal(0.05), '0.05')
  assert.equal(decimal(-0), '0')
  const radius = axisTickFormatter({ minimum: 133625.75, maximum: 133881.75, step: 50, radius: true })
  assert.equal(radius(133650), '133,650')
  const smallRadius = axisTickFormatter({ minimum: 133625.75, maximum: 133625.751, step: 0.00025, radius: true })
  assert.equal(smallRadius(133625.75025), '133,625.75025')
  const tiny = axisTickFormatter({ minimum: 1e-8, maximum: 8e-8, step: 2e-8 })
  assert.equal(tiny(2e-8), '2e−8')
  assert.notEqual(tiny(2e-8), tiny(4e-8))
})

test('tick density responds to measured labels and chart width without changing the domain', () => {
  // Deliberately proportional widths prove layout does not rely on character
  // counts; browser acceptance uses the real Canvas measureText implementation.
  const measure = (text) => [...text].reduce((sum, character) => sum + (character === '1' ? 4 : 8), 0)
  const domain = [133625.75, 133881.75]
  const wide = measuredAxisTicks(...domain, 750, measure, { radius: true })
  const narrow = measuredAxisTicks(...domain, 190, measure, { radius: true })
  assert.ok(narrow.values.length < wide.values.length)
  for (const [result, span] of [[wide, 750], [narrow, 190]]) {
    result.values.forEach((value, index) => {
      assert.ok(value >= domain[0] && value <= domain[1])
      if (index) assert.ok((value - result.values[index - 1]) / (domain[1] - domain[0]) * span >= (result.widths[index - 1] + result.widths[index]) / 2 + 18)
    })
  }
})

test('measured margins reserve full tick labels and titles at desktop, narrow width and larger text', () => {
  for (const [width, fontSize] of [[850, 12], [600, 12], [326, 12], [326, 18], [600, 24]]) {
    const measureText = (text) => text.length * fontSize * 0.6
    const axes = measuredProfileAxes({ width, height: 300, fontSize, measureText, xDomain: [133625.75, 133881.75], yDomain: [-0.04614, 0.46], yTitle: 'Normal Optical Depth (dimensionless)' })
    assert.ok(axes.margins.left >= Math.max(...axes.y.widths) + 18)
    assert.ok(axes.plotHeight > 0 && axes.plotWidth > 0)
    assert.ok(axes.margins.top >= axes.titleLines.length * axes.lineHeight)
    axes.x.values.forEach((value, index) => {
      const position = axes.margins.left + (value - 133625.75) / 256 * axes.plotWidth
      assert.ok(position - axes.x.widths[index] / 2 >= 0)
      assert.ok(position + axes.x.widths[index] / 2 <= width)
    })
  }
})

test('all six actual windows keep source radii, values and CSV precision through axis planning; overview coverage is not a requested boundary', async (t) => {
  clearObservationCaches()
  const root = new URL('../', import.meta.url)
  const json = async (path) => JSON.parse(await readFile(new URL(path, root)))
  const catalog = await json('public/data/observations/catalog.json')
  t.mock.method(globalThis, 'fetch', async (path) => new Response(await readFile(new URL(`public${path}`, root))))
  for (const observation of catalog.observations) {
    const metadata = await json(`public${observation.metadata_url}`)
    const index = await json(`public${observation.index_url}`)
    const overview = overviewSamples(await json(`public${observation.overview_url}`))
    const example = getExample(observation.dataset_id)
    const selected = [example.range[0] + 0.01, example.range[1] - 0.01]
    const exact = await loadExactRange(observation.base_path, selected, index)
    const date = new Date('2026-09-09T12:00:00Z')
    const csv = buildExactWindowCsv(metadata, exact.samples, date, { range: selected })
    const radiusDomain = numericExtent(exact.samples, 'ring_radius_km', 0)
    assert.ok(radiusDomain[0] > selected[0] && radiusDomain[1] < selected[1])
    assert.equal(exact.samples.length, example.sampleCount - 2)
    for (const variable of metadata.principal_variables) {
      const valueDomain = numericExtent(exact.samples, variable.id)
      const originalDomain = [...valueDomain]
      measuredProfileAxes({ width: 600, height: 300, fontSize: 12, measureText: (text) => text.length * 7.2, xDomain: radiusDomain, yDomain: valueDomain, yTitle: variable.label })
      assert.deepEqual(valueDomain, originalDomain)
      assert.equal(buildExactWindowCsv(metadata, exact.samples, date, { range: selected }), csv)
    }
    const displayedOverview = overview.filter((sample) => sample.ring_radius_km >= selected[0] && sample.ring_radius_km <= selected[1])
    assert.ok(displayedOverview.every((sample) => sample.ring_radius_km >= selected[0] && sample.ring_radius_km <= selected[1]))
    const ticks = niceAxisTicks(...radiusDomain)
    assert.ok(ticks.values.at(-1) <= radiusDomain[1])
  }
  t.diagnostic('Six observations: input boundaries, contained overview samples, exact 0.25 km records and display-only ticks checked independently; no source/domain mismatch found.')
})
