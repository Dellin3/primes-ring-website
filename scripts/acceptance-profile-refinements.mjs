// Focused real-Chrome checks for the second-round axis and catalog refinements.
// Uses the existing browser tooling; does not install dependencies or publish.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { getExample } from '../src/content/explorationExamples.js'
import { parseCsvText } from '../src/lib/csv.js'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')
const base = process.env.ACCEPTANCE_URL || 'http://127.0.0.1:5174'
const output = new URL('../artifacts/refinements/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true })
await context.addInitScript(() => {
  const clear = CanvasRenderingContext2D.prototype.clearRect
  const fillText = CanvasRenderingContext2D.prototype.fillText
  const arc = CanvasRenderingContext2D.prototype.arc
  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    this.canvas.__profileText = []
    this.canvas.__profileArcs = 0
    return clear.apply(this, args)
  }
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...args) {
    const metrics = this.measureText(text)
    this.canvas.__profileText ??= []
    this.canvas.__profileText.push({ text, x, y, font: this.font, align: this.textAlign,
      left: x - metrics.actualBoundingBoxLeft, right: x + metrics.actualBoundingBoxRight,
      top: y - metrics.actualBoundingBoxAscent, bottom: y + metrics.actualBoundingBoxDescent })
    return fillText.call(this, text, x, y, ...args)
  }
  CanvasRenderingContext2D.prototype.arc = function (...args) {
    this.canvas.__profileArcs = (this.canvas.__profileArcs || 0) + 1
    return arc.apply(this, args)
  }
})
const page = await context.newPage()
page.setDefaultTimeout(15000)
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const report = { at: new Date().toISOString(), browser: browser.version(), base, checks: [], errors }
const catalog = await (await fetch(`${base}/data/observations/catalog.json`)).json()
const featured = catalog.observations.find((observation) => observation.dataset_id === catalog.featured_dataset_id)
const example = getExample(featured.dataset_id)
const plot = page.locator('.scientific-profile canvas').first()

async function settlePlot() {
  await plot.waitFor()
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
  await page.waitForFunction(() => document.querySelector('.scientific-profile canvas')?.__profileText?.length > 2)
}

async function checkLabels(name) {
  await settlePlot()
  const result = await plot.evaluate((canvas) => ({
    width: canvas.getBoundingClientRect().width,
    height: canvas.getBoundingClientRect().height,
    texts: canvas.__profileText,
    radius: [Number(canvas.getAttribute('aria-valuemin')), Number(canvas.getAttribute('aria-valuemax'))],
    arcs: canvas.__profileArcs,
  }))
  for (const text of result.texts) {
    assert.ok(text.left >= -1 && text.right <= result.width + 1 && text.top >= -1 && text.bottom <= result.height + 1,
      `${name}: clipped label ${JSON.stringify(text)} in ${result.width}×${result.height}`)
  }
  const xTicks = result.texts.filter((text) => text.align === 'center' && /^[−-]?\d[\d,.]*(e[−+\-]?\d+)?$/.test(text.text)).sort((a, b) => a.left - b.left)
  for (let n = 1; n < xTicks.length; n += 1) assert.ok(xTicks[n - 1].right < xTicks[n].left, `${name}: adjacent radius labels overlap`)
  report.checks.push({ name, status: 'pass', canvas: `${result.width}×${result.height}`, xTickLabels: xTicks.map((text) => text.text), radius: result.radius })
  return result
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto(`${base}/data`)
    await checkLabels(`catalog labels ${viewport.width}×${viewport.height}`)
    const layout = await page.evaluate(() => {
      const main = document.querySelector('.observation-preview-main').getBoundingClientRect()
      const profile = document.querySelector('.observation-preview-profile').getBoundingClientRect()
      const groups = [...document.querySelectorAll('.observation-range-group')].map((element) => ({ width: element.getBoundingClientRect().width, parent: element.parentElement.getBoundingClientRect().width, nowrap: getComputedStyle(element).whiteSpace }))
      return { unusedBottom: main.bottom - profile.bottom, documentWidth: document.documentElement.scrollWidth, viewport: innerWidth, groups }
    })
    assert.ok(layout.unusedBottom < 30, 'Preview panel has stretched unused space below the graph')
    assert.ok(layout.documentWidth <= layout.viewport, 'Catalog creates horizontal page overflow')
    assert.ok(layout.groups.every((group) => group.nowrap === 'nowrap' && group.width <= group.parent + 1), 'Radius and unit group wraps or overflows')
    assert.equal((await page.locator('.open-profile-link').innerText()).trim(), 'Open profile →')
    report.checks.push({ name: `catalog units, short link and content height ${viewport.width}`, status: 'pass', layout })
    await page.locator('.data-observatory-workspace').screenshot({ path: new URL(`catalog-${viewport.width}.png`, output).pathname })
  }

  const selectedRange = [example.range[0] + 0.01, example.range[1] - 0.01]
  const query = new URLSearchParams({ variable: 'optical_depth', from: String(selectedRange[0]), to: String(selectedRange[1]), version: example.webProductVersion })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(`${base}/data/${featured.slug}?${query}`)
  await page.locator('.scientific-profile canvas[role="slider"]').waitFor()
  const expectedRange = [example.range[0] + 0.25, example.range[1] - 0.25]
  const result = await checkLabels('exact source coverage with non-sample-aligned input boundaries')
  assert.deepEqual(result.radius, expectedRange)
  assert.equal(await page.getByLabel('Lower radius (km)', { exact: true }).inputValue(), String(selectedRange[0]))
  assert.equal(await page.getByLabel('Upper radius (km)', { exact: true }).inputValue(), String(selectedRange[1]))
  assert.match(await page.locator('.profile-range-note').innerText(), /within the requested/)

  for (const variable of featured.principal_variables) {
    await page.getByRole('button', { name: variable.label, exact: true }).click()
    const result = await checkLabels(`variable labels and source range: ${variable.id}`)
    assert.deepEqual(result.radius, expectedRange)
    if (variable.id === 'phase_shift') assert.ok(result.arcs >= example.sampleCount - 2, 'Phase samples must remain unconnected source points')
  }
  await plot.focus()
  await plot.press('Home')
  assert.equal(await plot.getAttribute('aria-valuenow'), String(expectedRange[0]))
  await plot.press('ArrowRight')
  assert.equal(await plot.getAttribute('aria-valuenow'), String(expectedRange[0] + 0.25))
  report.checks.push({ name: 'keyboard retains exact source radii after layout changes', status: 'pass' })
  await page.locator('.scientific-profile').screenshot({ path: new URL('exact-phase-axis-1280.png', output).pathname })

  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download selected data', exact: true }).click()
  const download = await downloading
  const file = new URL('axis-verified-window.csv', output)
  await download.saveAs(file.pathname)
  assert.equal(await download.failure(), null)
  const exported = parseCsvText(await readFile(file, 'utf8'))
  assert.equal(exported.length, example.sampleCount - 2)
  assert.deepEqual([Number(exported[0].ring_radius_km), Number(exported.at(-1).ring_radius_km)], expectedRange)
  const index = await (await fetch(`${base}${featured.index_url}`)).json()
  const chunk = index.chunks.find((chunk) => example.selectionEvidence.firstSampleIndex >= chunk.first_sample_index && example.selectionEvidence.firstSampleIndex <= chunk.last_sample_index)
  const bytes = Buffer.from(await (await fetch(`${base}${featured.base_path}/${chunk.file_name}`)).arrayBuffer())
  for (const row of exported) {
    const offset = (Number(row.sample_index) - chunk.first_sample_index) * index.storage.bytes_per_record
    index.storage.columns.forEach((column, n) => assert.equal(Number(row[column.id]), bytes.readDoubleLE(offset + n * 8)))
  }
  report.checks.push({ name: 'browser CSV matches all 1023 exact source rows and four fields', status: 'pass', rows: exported.length })

  await page.setViewportSize({ width: 390, height: 844 })
  await checkLabels('mobile phase labels after exact inspection')
  await page.locator('.scientific-profile').screenshot({ path: new URL('exact-phase-axis-390.png', output).pathname })
  assert.equal(errors.length, 0, errors.join('\n'))
} catch (error) {
  report.checks.push({ name: 'axis/catalog acceptance', status: 'fail', error: error.stack })
  await page.screenshot({ path: new URL('axis-acceptance-debug.png', output).pathname, fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await writeFile(new URL('profile-axis-report.json', output), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
}
