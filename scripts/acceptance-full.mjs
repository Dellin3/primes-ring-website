// Run against the local site with an existing Playwright installation.
// No personal browser profiles, external sites, or newly installed dependencies.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { explorationExamples } from '../src/content/explorationExamples.js'

const require = createRequire(import.meta.url)
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')
const base = process.env.ACCEPTANCE_URL || 'http://localhost:5174'
const output = new URL(process.env.ACCEPTANCE_OUTPUT || '../artifacts/acceptance/', import.meta.url)
await mkdir(output, { recursive: true })
const catalog = JSON.parse(await readFile(new URL('../public/data/observations/catalog.json', import.meta.url), 'utf8'))
const featured = catalog.observations.find(item => item.dataset_id === catalog.featured_dataset_id)
const report = { at: new Date().toISOString(), base, method: 'Isolated real browser contexts; UI actions, controlled request failures, downloaded files compared independently to hashed binary records', checks: [], engines: [], notRun: [], screenshots: [], dataChecks: [] }
const reportFile = process.argv[2] ? 'browser-results-supplemental.json' : 'browser-results.json'
const note = 'Two adjacent source records were inspected. This profile alone does not establish a physical cause. PRIVATE-NOTE-ACCEPTANCE'
const title = 'Two nearby Cassini positions'
const canvas = page => page.locator('.scientific-profile canvas[role=slider]')
// Read both inputs in one browser task: dragging can render between tool calls.
const bounds = page => page.evaluate(() => Array.from(document.querySelectorAll('.exact-range-form input[type=number]'), input => Number(input.value)))
const notesTab = page => page.getByRole('tab', { name: 'Notes', exact: true }).click()
const guideUrl = (observation = featured) => {
  const example = explorationExamples[observation.dataset_id]
  return `${base}/data/${observation.slug}?guide=1&variable=optical_depth&from=${example.range[0]}&to=${example.range[1]}&version=${example.webProductVersion}`
}

async function independentlyReadRows(observation, [lower, upper]) {
  const root = new URL(`../public${observation.base_path}/`, import.meta.url)
  const index = JSON.parse(await readFile(new URL('index.json', root), 'utf8'))
  const rows = []
  for (const chunk of index.chunks.filter(item => item.radius_maximum_km >= lower && item.radius_minimum_km <= upper)) {
    const buffer = await readFile(new URL(chunk.file_name, root))
    assert.equal(createHash('sha256').update(buffer).digest('hex'), chunk.sha256)
    assert.equal(buffer.length, chunk.byte_length)
    for (let rowIndex = 0; rowIndex < chunk.row_count; rowIndex++) {
      const row = { sample_index: chunk.first_sample_index + rowIndex }
      index.storage.columns.forEach((column, columnIndex) => {
        row[column.id] = buffer.readDoubleLE(rowIndex * index.storage.bytes_per_record + columnIndex * index.storage.bytes_per_value)
      })
      if (row.ring_radius_km >= lower && row.ring_radius_km <= upper) rows.push(row)
    }
  }
  return rows.sort((a, b) => a.sample_index - b.sample_index)
}

function verifyCsv(text, expected) {
  const lines = text.trim().split(/\r?\n/).filter(line => !line.startsWith('#'))
  const fields = lines.shift().split(',')
  const actual = lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [fields[index], value])))
  assert.equal(actual.length, expected.length, 'CSV row count agrees with inclusive exact range')
  for (let index = 0; index < expected.length; index++) {
    for (const field of fields) {
      const expectedValue = expected[index][field]
      if (Number.isFinite(expectedValue)) assert.equal(Number(actual[index][field]), expectedValue, `CSV row ${index}, ${field}`)
      else assert.equal(actual[index][field], '', `missing ${field} remains blank`)
    }
  }
  return { rows: actual.length, fields, allValuesEqual: true, includesFirstAndLast: true, negativeValues: expected.reduce((count, row) => count + Object.values(row).filter(value => value < 0).length, 0), missingValues: expected.reduce((count, row) => count + Object.values(row).filter(value => !Number.isFinite(value)).length, 0) }
}

async function download(page, button, filename) {
  const waiting = page.waitForEvent('download')
  await page.getByRole('button', { name: button, exact: true }).click()
  const file = await waiting
  assert.equal(await file.failure(), null)
  const path = new URL(filename, output).pathname
  await file.saveAs(path)
  return readFile(path, 'utf8')
}

async function exactGuide(page, observation = featured) {
  await page.goto(guideUrl(observation))
  await canvas(page).waitFor()
  assert.equal(await page.locator('article[data-dataset-id]').getAttribute('data-dataset-id'), observation.dataset_id)
}

async function apply(page, range) {
  await page.getByLabel('Lower radius (km)', { exact: true }).fill(String(range[0]))
  await page.getByLabel('Upper radius (km)', { exact: true }).fill(String(range[1]))
  await page.getByRole('button', { name: 'Apply range', exact: true }).click()
}

async function stableView(page, changedFrom) {
  const read = () => {
    const values = Array.from(document.querySelectorAll('.exact-range-form input[type=number]'), input => Number(input.value))
    const query = new URLSearchParams(location.search)
    return { values, from: Number(query.get('from')), to: Number(query.get('to')) }
  }
  const deadline = Date.now() + 10000
  let previous = null
  let stableCount = 0
  while (Date.now() < deadline) {
    const current = await page.evaluate(read)
    const agrees = current.values.length === 2 && current.values[0] === current.from && current.values[1] === current.to
    const changed = !changedFrom || current.values[0] !== changedFrom[0] || current.values[1] !== changedFrom[1]
    stableCount = agrees && changed && JSON.stringify(previous) === JSON.stringify(current) ? stableCount + 1 : 0
    if (stableCount >= 3) return current
    previous = current
    await page.waitForTimeout(50)
  }
  throw new Error(`Window did not settle consistently: ${JSON.stringify(previous)}`)
}

async function screenshot(page, name, fullPage = false) {
  await page.screenshot({ path: new URL(name, output).pathname, fullPage, animations: 'disabled' })
  report.screenshots.push(name)
}

async function deliveredVitals(page) {
  // Let buffered PerformanceObserver callbacks receive the latest painted frame.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  return page.evaluate(() => window.acceptanceVitals)
}

async function runEngine(engine, name, options) {
  const browser = await engine.launch(options)
  report.engines.push({ name, version: browser.version() })
  async function check(label, task, viewport = { width: 1440, height: 900 }) {
    if (process.argv[2] && !label.includes(process.argv[2])) return
    const context = await browser.newContext({ viewport, acceptDownloads: true, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const start = performance.now()
    try {
      const detail = await task(page, context)
      assert.deepEqual(errors, [], 'No uncaught page errors')
      const result = { name: label, engine: name, viewport, status: 'pass', elapsedMs: Math.round(performance.now() - start), ...detail }
      report.checks.push(result)
      console.log(`PASS ${name}: ${label}`)
    } catch (error) {
      report.checks.push({ name: label, engine: name, viewport, status: 'fail', error: error.stack, pageErrors: errors })
      console.log(`FAIL ${name}: ${label}\n${error.message}`)
      await writeFile(new URL(`debug_${name}_${report.checks.length}.txt`, output), (await page.locator('body').innerText()).slice(0, 18000)).catch(() => {})
    } finally {
      await context.close()
      await writeFile(new URL(reportFile, output), JSON.stringify(report, null, 2))
    }
  }

  await check('Homepage → exact example → keyboard inspection → save → refresh → downloads', async page => {
    const requests = []
    page.on('request', request => requests.push(request.url()))
    await page.addInitScript(() => {
      window.acceptanceVitals = { lcp: 0, cls: 0, maxInteractionDuration: 0 }
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.acceptanceVitals.lcp = entry.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.acceptanceVitals.cls += entry.value }).observe({ type: 'layout-shift', buffered: true })
      try { new PerformanceObserver(list => { for (const entry of list.getEntries()) if (entry.interactionId) window.acceptanceVitals.maxInteractionDuration = Math.max(window.acceptanceVitals.maxInteractionDuration, entry.duration) }).observe({ type: 'event', buffered: true, durationThreshold: 16 }) } catch { /* Unsupported in this engine; this is not a field INP measurement. */ }
    })
    await page.goto(base)
    await page.getByRole('heading', { level: 1 }).waitFor()
    assert.match(await page.getByRole('heading', { level: 1 }).innerText(), /Explore Saturn’s rings through Cassini data/)
    assert.equal(await page.locator('.hero-actions .button-primary').count(), 1)
    await page.locator('.data-preview canvas').waitFor()
    assert.equal(requests.some(url => url.includes('ScientificHeroScene')), false)
    assert.equal(requests.some(url => /\/exact\/.*\.bin/.test(url)), false, 'Homepage does not load exact observation binaries')
    if (name === 'chromium') await screenshot(page, '01_home.png')
    const homeVitals = await deliveredVitals(page)
    const clickedAt = performance.now()
    await page.getByRole('link', { name: 'Start a guided exploration', exact: true }).first().click()
    await canvas(page).waitFor()
    const timeToExactWindowMs = Math.round(performance.now() - clickedAt)
    const range = await bounds(page)
    assert.deepEqual(range, explorationExamples[featured.dataset_id].range)
    await page.getByText('How does optical depth change across this region?', { exact: true }).waitFor()
    const applyBox = await page.getByRole('button', { name: 'Apply range', exact: true }).boundingBox()
    assert.ok(applyBox.y + applyBox.height <= 900, `Apply range bottom ${applyBox.y + applyBox.height}px exceeds 900px viewport`)
    if (name === 'chromium') await screenshot(page, '02_loaded_example.png')
    await canvas(page).focus()
    await canvas(page).press('Home')
    await canvas(page).press('ArrowRight')
    const timeToFirstInspectionMs = Math.round(performance.now() - clickedAt)
    const expected = await independentlyReadRows(featured, range)
    assert.equal(Number(await page.locator('[data-sample-index]').getAttribute('data-sample-index')), expected[1].sample_index)
    const inspector = await page.locator('.exact-sample-inspector').innerText()
    assert.ok(inspector.includes(`${expected[1].ring_radius_km} km`))
    assert.ok(inspector.includes(`${expected[1].optical_depth} dimensionless`))
    assert.ok(inspector.includes(featured.ring_observation_id))
    assert.ok(inspector.includes('Compare two positions'))
    if (name === 'chromium') await screenshot(page, '03_exact_sample.png')
    await notesTab(page)
    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Observations and limitations').fill(note)
    await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
    await page.getByText('Exploration saved.', { exact: true }).waitFor()
    const explorationVitals = await deliveredVitals(page)
    await page.reload()
    await canvas(page).waitFor()
    await notesTab(page)
    assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), title)
    assert.equal(await page.getByLabel('Observations and limitations').inputValue(), note)
    assert.deepEqual(await bounds(page), range)
    if (name === 'chromium') await screenshot(page, '04_saved_restored.png')
    const csv = await download(page, 'Download selected data', `${name}_example_window.csv`)
    const checked = verifyCsv(csv, expected)
    report.dataChecks.push({ engine: name, dataset: featured.dataset_id, ...checked })
    const markdown = await download(page, 'Export notes', `${name}_example_observation.md`)
    assert.ok(markdown.includes(note))
    assert.ok(markdown.includes(featured.product_id))
    assert.ok(markdown.includes('Web data version:'))
    assert.ok(markdown.includes('not this project’s high-resolution reconstruction'))
    assert.ok(markdown.includes(`from=${range[0]}`) && markdown.includes(`to=${range[1]}`))
    return { timeToExactWindowMs, timeToFirstInspectionMs, firstInspectionTimingLimit: 'Includes screenshot capture and assertion overhead between exact-window readiness and keyboard inspection; not an uninstrumented human task time.', downloadedRows: expected.length, applyRangeBottom: applyBox.y + applyBox.height, homeVitals, explorationVitals, performanceLimit: 'Single local automated run, not field P75 or INP. homeVitals was captured before leaving home. explorationVitals is the cumulative SPA document measurement through inspection and save, captured before reload.' }
  })

  for (const observation of catalog.observations) {
    await check(`Real example identity and three variables: ${observation.dataset_id}`, async page => {
      await exactGuide(page, observation)
      const range = await bounds(page)
      const expected = await independentlyReadRows(observation, range)
      assert.equal(expected.length, explorationExamples[observation.dataset_id].sampleCount)
      for (const variable of observation.principal_variables) {
        await page.getByRole('button', { name: variable.label, exact: true }).click()
        await page.waitForFunction(({ id, label }) => {
          const selected = document.querySelector('.observation-instrument-toolbar button[aria-pressed=true]')
          return new URLSearchParams(location.search).get('variable') === id && selected?.textContent === label
        }, { id: variable.id, label: variable.label })
        assert.deepEqual(await bounds(page), range)
        await canvas(page).focus()
        await canvas(page).press('Home')
        try {
          await page.waitForFunction(({ label, value, index }) => {
            const inspector = document.querySelector('.exact-sample-inspector')
            const field = Array.from(inspector?.querySelectorAll('dt') || []).find(item => item.textContent === label)
            return inspector?.querySelector('[data-sample-index]')?.getAttribute('data-sample-index') === String(index)
              && field?.nextElementSibling?.textContent.startsWith(`${value} `)
          }, { label: variable.label, value: String(expected[0][variable.id]), index: expected[0].sample_index })
        } catch (error) {
          const actual = await page.locator('.exact-sample-inspector').innerText()
          throw new Error(`Sample readout mismatch for ${observation.dataset_id}; expected ${variable.label}=${expected[0][variable.id]} at source index ${expected[0].sample_index}; actual readout: ${actual}`, { cause: error })
        }
        assert.equal(Number(await page.locator('[data-sample-index]').getAttribute('data-sample-index')), expected[0].sample_index)
        const inspector = await page.locator('.exact-sample-inspector').innerText()
        assert.ok(inspector.includes(String(expected[0][variable.id])))
        if (variable.id === 'phase_shift') await page.getByText('Phase continuity not inferred.', { exact: true }).waitFor()
      }
      return { rows: expected.length, firstSourceIndex: expected[0].sample_index, range }
    })
  }

  await check('Rapid observation switching ignores delayed old overview', async page => {
    const slow = catalog.observations[0]
    const final = catalog.observations.at(-1)
    await page.route(`**${slow.overview_url}`, async route => { await new Promise(resolve => setTimeout(resolve, 800)); await route.continue() })
    await page.goto(`${base}/data`)
    await page.locator('.observation-rail [role=option]').first().waitFor()
    assert.equal(await page.locator('.observation-rail [role=option]').count(), 6)
    const oldResponse = page.waitForResponse(response => response.url().endsWith(slow.overview_url))
    await page.locator('.observation-rail [role=option]').filter({ hasText: slow.ring_observation_id }).click()
    for (const observation of catalog.observations.slice(1)) await page.locator('.observation-rail [role=option]').filter({ hasText: observation.ring_observation_id }).click()
    await page.locator('.observation-preview-main').getByText(final.ring_observation_id, { exact: false }).waitFor()
    await oldResponse
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    assert.match(await page.locator('.observation-preview-main').innerText(), new RegExp(final.ring_observation_id))
    assert.match(await page.locator('.observation-context-rail').innerText(), new RegExp(final.product_id.replace('.', '\\.')))
  })

  await check('Range input rejects empty reversed and out-of-coverage; exact boundaries and empty window', async page => {
    await exactGuide(page)
    const original = await bounds(page)
    for (const invalid of [['', original[1]], [original[1], original[0]], [0, original[1]]]) {
      await apply(page, invalid)
      await page.locator('.exact-range-form [role=alert]').waitFor()
      const current = new URL(page.url()).searchParams
      assert.equal(Number(current.get('from')), original[0])
      assert.equal(Number(current.get('to')), original[1])
    }
    const source = await independentlyReadRows(featured, original)
    await apply(page, [source[0].ring_radius_km, source[1].ring_radius_km])
    await canvas(page).waitFor()
    await page.getByText('2 exact rows in this inclusive window.', { exact: false }).waitFor()
    const csv = await download(page, 'Download selected data', `${name}_inclusive_two_rows.csv`)
    verifyCsv(csv, source.slice(0, 2))
    await apply(page, [source[0].ring_radius_km + 0.01, source[0].ring_radius_km + 0.02])
    await page.getByText('No source samples lie within these boundaries. Expand the range or open the example region.', { exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Download selected data', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: 'Open example region', exact: true }).first().click()
    await canvas(page).waitFor()
    assert.deepEqual(await bounds(page), original)
  })

  await check('Pointer range drag and keyboard boundary controls update the same input state', async page => {
    await exactGuide(page)
    await page.locator('.navigator-disclosure > summary').click()
    const start = await bounds(page)
    const navigator = page.locator('.observation-navigator canvas')
    await navigator.scrollIntoViewIfNeeded()
    const box = await navigator.boundingBox()
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5, { steps: 6 })
    await page.mouse.up()
    const stable = await stableView(page, start)
    const dragged = stable.values
    assert.notDeepEqual(dragged, start)
    assert.equal(stable.from, dragged[0])
    assert.equal(stable.to, dragged[1])
    await page.getByLabel('Lower radius boundary', { exact: true }).focus()
    await page.getByLabel('Lower radius boundary', { exact: true }).press('ArrowRight')
    const keyboard = await stableView(page, dragged)
    assert.ok(keyboard.values[0] > dragged[0])
  })

  await check('Named save, home continue, next task, rename and delete', async page => {
    await exactGuide(page)
    await canvas(page).focus()
    await canvas(page).press('Home')
    await notesTab(page)
    await page.getByLabel('Title', { exact: true }).fill(title)
    await page.getByLabel('Observations and limitations').fill(note)
    await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
    await page.getByText('Exploration saved.', { exact: true }).waitFor()
    await page.goto(base)
    await page.getByRole('link', { name: /Continue your exploration/ }).click()
    await canvas(page).waitFor()
    await notesTab(page)
    assert.equal(await page.getByLabel('Observations and limitations').inputValue(), note)
    const originalRange = await bounds(page)
    await page.getByRole('button', { name: 'Try another variable', exact: true }).click()
    assert.equal(new URL(page.url()).searchParams.get('variable'), 'signal_power')
    assert.deepEqual(await bounds(page), originalRange)
    await page.goto(`${base}/explorations`)
    await page.locator('.saved-exploration').getByRole('button', { name: 'Rename', exact: true }).click()
    await page.getByLabel('New title', { exact: true }).fill('Renamed Cassini record')
    await page.getByRole('button', { name: 'Save title', exact: true }).click()
    await page.locator('.saved-exploration').getByRole('heading', { name: 'Renamed Cassini record', exact: true }).waitFor()
    await page.locator('.saved-exploration').getByRole('button', { name: 'Delete', exact: true }).click()
    assert.equal(await page.locator('.saved-exploration').count(), 0)
  })

  await check('Share fallback excludes notes and clean session restores same data view', async (page) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Intentional clipboard denial') } } }) })
    await exactGuide(page)
    await notesTab(page)
    await page.getByLabel('Observations and limitations').fill(note)
    await page.getByRole('button', { name: 'Share view', exact: true }).click()
    const shared = await page.getByLabel('View link', { exact: false }).inputValue()
    const params = new URL(shared).searchParams
    assert.equal(params.has('draft'), false)
    assert.equal(params.has('record'), false)
    assert.equal(shared.includes('PRIVATE'), false)
    await page.getByText('Copy the selected view link below. Your notes are not included.', { exact: true }).waitFor()
    const fresh = await browser.newContext()
    try {
      const clean = await fresh.newPage()
      await clean.goto(shared)
      await canvas(clean).waitFor()
      assert.deepEqual(await bounds(clean), await bounds(page))
      await notesTab(clean)
      assert.equal(await clean.getByLabel('Observations and limitations').inputValue(), '')
      assert.equal(await clean.locator('article[data-dataset-id]').getAttribute('data-dataset-id'), featured.dataset_id)
    } finally { await fresh.close() }
  })

  await check('Local storage failure preserves in-session notes and permits Markdown export', async page => {
    await page.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Intentional quota exhaustion', 'QuotaExceededError') } })
    await exactGuide(page)
    await canvas(page).focus()
    await canvas(page).press('Home')
    await notesTab(page)
    await page.getByLabel('Observations and limitations').fill(note)
    await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
    await page.getByText('Could not save in this browser. Your work remains in this session. Export notes before leaving.', { exact: true }).waitFor()
    assert.equal(await page.getByText('Exploration saved.', { exact: true }).count(), 0)
    assert.equal(await page.getByLabel('Observations and limitations').inputValue(), note)
    assert.ok((await download(page, 'Export notes', `${name}_storage_failure_notes.md`)).includes(note))
    assert.equal(await page.evaluate(() => localStorage.getItem('cassini.explorations.v1')), null)
  })

  await check('Exact request failure retries without losing range or notes', async page => {
    let fail = true
    await page.route('**/exact/*.bin', route => fail ? route.abort('failed') : route.continue())
    await page.goto(guideUrl())
    await page.getByRole('tab', { name: 'Notes', exact: true }).waitFor()
    await notesTab(page)
    await page.getByLabel('Observations and limitations').fill(note)
    await page.getByRole('button', { name: 'Retry exact data', exact: true }).waitFor()
    const range = await bounds(page)
    fail = false
    await page.getByRole('button', { name: 'Retry exact data', exact: true }).click()
    await canvas(page).waitFor()
    assert.deepEqual(await bounds(page), range)
    assert.equal(await page.getByLabel('Observations and limitations').inputValue(), note)
  })

  await check('Metadata and catalog request failures offer working retry', async page => {
    let fail = true
    await page.route('**/catalog.json', route => fail ? route.abort('failed') : route.continue())
    await page.goto(`${base}/data`)
    await page.getByRole('button', { name: 'Retry catalog', exact: true }).waitFor()
    fail = false
    await page.getByRole('button', { name: 'Retry catalog', exact: true }).click()
    await page.locator('.observation-rail [role=option]').first().waitFor()
    await page.unroute('**/catalog.json')
    fail = true
    await page.route('**/metadata.json', route => fail ? route.abort('failed') : route.continue())
    await page.goto(guideUrl())
    await page.getByRole('button', { name: 'Retry observation', exact: true }).waitFor()
    fail = false
    await page.getByRole('button', { name: 'Retry observation', exact: true }).click()
    await canvas(page).waitFor()
  })

  await check('Invalid observation and old version disclose differences', async page => {
    await page.goto(`${base}/data/unknown-observation`)
    await page.getByRole('heading', { name: 'Observation not found', exact: true }).waitFor()
    assert.equal(await page.locator('article[data-dataset-id]').count(), 0)
    await page.goto(guideUrl().replace('version=1.1.0', 'version=0.0.0'))
    await canvas(page).waitFor()
    await page.getByText(/Data version changed: this view requested 0.0.0/).waitFor()
    await page.goto(`${guideUrl()}&record=unavailable-record`)
    await canvas(page).waitFor()
    await page.getByText(/This saved record is not available in this browser/).waitFor()
  })

  await check('Back/forward and immediate refresh preserve view and unfinished notes', async page => {
    await exactGuide(page)
    await notesTab(page)
    await page.getByLabel('Observations and limitations').fill(note)
    await page.reload()
    await canvas(page).waitFor()
    await notesTab(page)
    assert.equal(await page.getByLabel('Observations and limitations').inputValue(), note)
    await page.getByRole('button', { name: 'Normalized Signal Power', exact: true }).click()
    await page.getByRole('button', { name: 'Phase Shift', exact: true }).click()
    await page.goBack()
    assert.equal(new URL(page.url()).searchParams.get('variable'), 'signal_power')
    await page.goForward()
    assert.equal(new URL(page.url()).searchParams.get('variable'), 'phase_shift')
    await notesTab(page)
    assert.equal(await page.getByLabel('Observations and limitations').inputValue(), note)
  })

  await check('Three research chapters and available resource links load', async page => {
    const paths = ['/research', '/research/signal-and-phase', '/research/stationary-roots-and-continuation', '/research/reliability-and-reconstruction', '/resources']
    for (const path of paths) {
      await page.goto(`${base}${path}`)
      await page.getByRole('heading', { level: 1 }).waitFor()
      const body = await page.locator('body').innerText()
      assert.equal(/Provisional architecture label/.test(body), false)
      assert.equal(/404|Page not found/.test(await page.getByRole('heading', { level: 1 }).innerText()), false)
      const localLinks = await page.locator('main a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => href?.startsWith('/') && !href.includes('#')))
      for (const link of new Set(localLinks)) {
        const response = await page.request.get(`${base}${link}`)
        assert.ok(response.ok(), `Local link ${link} responds successfully`)
      }
    }
  })

  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await check(`Visible workbench and keyboard/table path at ${viewport.width}×${viewport.height}`, async page => {
      await exactGuide(page)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      const plot = await canvas(page).boundingBox()
      assert.ok(plot.y < viewport.height, 'Chart starts in first viewport')
      const applyBox = await page.getByRole('button', { name: 'Apply range', exact: true }).boundingBox()
      if (viewport.width >= 1000) assert.ok(applyBox.y + applyBox.height <= viewport.height, `Apply range bottom ${applyBox.y + applyBox.height}px exceeds ${viewport.height}px viewport`)
      await page.getByRole('tab', { name: 'Inspect', exact: true }).click()
      await page.getByRole('button', { name: 'Focus chart, then use arrow keys', exact: true }).click()
      await page.keyboard.press('Home')
      await page.keyboard.press('ArrowRight')
      await page.locator('[data-sample-index]').waitFor()
      await notesTab(page)
      await page.getByLabel('Title', { exact: true }).fill(`Keyboard ${viewport.width}`)
      await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
      await page.getByText('Exploration saved.', { exact: true }).waitFor()
      await page.locator('.exact-table > summary').click()
      await page.locator('.exact-table tbody tr').first().getByRole('button').click()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      if (name === 'chromium' && viewport.width === 390) { await page.locator('.exact-table > summary').click(); await page.evaluate(() => scrollTo(0, 0)); await screenshot(page, '05_mobile_workbench.png', true) }
      return { plotTop: plot.y, plotHeight: plot.height, applyRangeBottom: applyBox.y + applyBox.height, horizontalOverflow: false }
    }, viewport)
  }
  await check('Supplemental: observation switches preserve intersection and explain non-overlap', async page => {
    const first = catalog.observations[0]
    const ingress = catalog.observations[1]
    await exactGuide(page, first)
    await apply(page, [114950, 115050])
    await stableView(page)
    await page.getByLabel('Observation', { exact: true }).selectOption(ingress.slug)
    await page.locator(`article[data-dataset-id="${ingress.dataset_id}"]`).waitFor()
    await canvas(page).waitFor()
    assert.deepEqual(await bounds(page), [114970.25, 115050])
    await page.getByText('The radius window was limited to the shared coverage of the new observation.', { exact: true }).waitFor()
    await page.getByLabel('Observation', { exact: true }).selectOption(first.slug)
    await page.locator(`article[data-dataset-id="${first.dataset_id}"]`).waitFor()
    await canvas(page).waitFor()
    await apply(page, [90000, 90256])
    await stableView(page)
    await page.getByLabel('Observation', { exact: true }).selectOption(ingress.slug)
    await page.locator(`article[data-dataset-id="${ingress.dataset_id}"]`).waitFor()
    await canvas(page).waitFor()
    assert.deepEqual(await bounds(page), explorationExamples[ingress.dataset_id].range)
    await page.getByText('The observations have no common radius window. Opened the example for this observation.', { exact: true }).waitFor()
  })
  await check('Supplemental: unchanged range permits saving and unsupported variable is explained', async page => {
    await exactGuide(page)
    await notesTab(page)
    assert.equal(await page.getByRole('button', { name: 'Save exploration', exact: true }).isDisabled(), false)
    await page.getByRole('button', { name: 'Apply range', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Save exploration', exact: true }).isDisabled(), false)
    await page.goto(guideUrl().replace('variable=optical_depth', 'variable=unknown_field'))
    await canvas(page).waitFor()
    await page.getByText(/The requested variable “unknown_field” is unavailable/).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Normal Optical Depth', exact: true }).getAttribute('aria-pressed'), 'true')
  })
  await check('Supplemental: two tabs retain independent drafts and named saves', async (page, context) => {
    await exactGuide(page)
    const other = await context.newPage()
    await exactGuide(other)
    await canvas(page).focus()
    await canvas(page).press('Home')
    await notesTab(page)
    await page.getByLabel('Title', { exact: true }).fill('Tab A saved evidence')
    await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
    await page.getByText('Exploration saved.', { exact: true }).waitFor()
    await notesTab(other)
    await other.getByLabel('Observations and limitations').fill('Tab B independent private draft')
    await other.waitForFunction(() => {
      const store = JSON.parse(localStorage.getItem('cassini.explorations.v1'))
      return store.records.some(record => record.title === 'Tab A saved evidence') && Object.values(store.drafts).some(draft => draft.notes === 'Tab B independent private draft')
    })
    const store = await other.evaluate(() => JSON.parse(localStorage.getItem('cassini.explorations.v1')))
    assert.ok(Object.keys(store.drafts).length >= 2)
    assert.equal(new URL(page.url()).searchParams.get('draft') === new URL(other.url()).searchParams.get('draft'), false)
    await page.reload()
    await canvas(page).waitFor()
    await notesTab(page)
    assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), 'Tab A saved evidence')
    assert.equal(await page.getByLabel('Observations and limitations').inputValue(), '')
    await other.close()
  })
  await browser.close()
}

await runEngine(chromium, 'chromium', { channel: 'chrome', headless: true })
if (existsSync(webkit.executablePath())) await runEngine(webkit, 'webkit', { headless: true })
else report.notRun.push({ name: 'WebKit / Safari', reason: 'Playwright WebKit executable is not installed; no browser engine was downloaded or user Safari automation setting changed.' })
report.notRun.push({ name: 'Production P75 LCP/INP/CLS and five-person independent usability study', reason: 'Local automated browser runs cannot establish production field performance, retention, or human task completion.' })
report.summary = { passed: report.checks.filter(check => check.status === 'pass').length, failed: report.checks.filter(check => check.status === 'fail').length, notRun: report.notRun.length }
await writeFile(new URL(reportFile, output), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report.summary))
if (report.summary.failed) process.exitCode = 1
