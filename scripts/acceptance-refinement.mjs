import assert from 'node:assert/strict'
import { chromium } from '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { explorationExamples } from '../src/content/explorationExamples.js'
const output = new URL('../artifacts/refinement/', import.meta.url).pathname
await mkdir(output, { recursive: true })
const base = process.env.ACCEPTANCE_URL || 'http://localhost:5174'
const catalog = JSON.parse(await readFile(new URL('../public/data/observations/catalog.json', import.meta.url)))
const observation = catalog.observations.find(o => o.dataset_id === catalog.featured_dataset_id)
const example = explorationExamples[observation.dataset_id]
const fullUrl = `${base}/data/${observation.slug}?guide=0&version=${example.webProductVersion}`
const exampleUrl = `${fullUrl}&from=${example.range[0]}&to=${example.range[1]}&variable=optical_depth`
const notes = page => page.getByLabel('Observations and limitations')
const canvas = page => page.locator('.scientific-profile canvas[role=slider]')
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem('cassini.explorations.v1')))
const openNotes = page => page.getByRole('button', { name: 'Add a note', exact: true }).click()
const report = { at: new Date().toISOString(), engine: '', checks: [], zoom: [], contrast: [], limitations: ['Safari 18.2 WebDriver session could not start: Allow remote automation is disabled. Native Safari downloads were not tested.'] }
const browser = await chromium.launch({ channel: 'chrome', headless: true })
report.engine = browser.version()
async function check(name, fn) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try { const details = await fn(page, context); assert.deepEqual(errors, []); report.checks.push({ name, status: 'pass', ...details }); console.log('PASS', name) }
  catch (error) { report.checks.push({ name, status: 'fail', error: error.stack, errors }); console.log('FAIL', name, error.message); await page.screenshot({ path: join(output, `failure-${report.checks.length}.png`), fullPage: true }) }
  finally { await context.close(); await writeFile(join(output, 'refinement-results.json'), JSON.stringify(report, null, 2)) }
}
await check('Overview can save notes, restores mode and never claims sample inspection', async page => {
  await page.goto(fullUrl)
  await openNotes(page)
  assert.equal(await notes(page).getAttribute('placeholder'), 'What do you notice in this region? What would you check next?')
  assert.equal(await notes(page).evaluate(e => e === document.activeElement), true)
  assert.equal(await page.locator('.guide-strip ol').count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Download selected data', exact: true }).isDisabled(), true)
  await page.getByLabel('Title', { exact: true }).fill('A broad view to revisit')
  await notes(page).fill('I want to compare the broad profile before choosing a smaller region.')
  await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
  await page.getByText('Exploration saved.', { exact: true }).waitFor()
  const saved = (await store(page)).records[0]
  assert.equal(saved.displayMode, 'overview'); assert.deepEqual(saved.selectedSamples, []); assert.equal(saved.guideProgress, 'explore')
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: join(output, 'overview-saved.png'), fullPage: true })
  await page.reload(); await openNotes(page)
  assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), saved.title)
  assert.equal(await notes(page).inputValue(), saved.notes)
  assert.equal(await page.getByRole('button', { name: 'Download selected data', exact: true }).isDisabled(), true)
  assert.equal(await page.locator('.guide-strip ol').count(), 0)
  await page.goto(`${base}/explorations`)
  await page.getByRole('heading', { name: 'Saved explorations', exact: true }).waitFor()
  assert.equal(await page.locator('.saved-empty').count(), 0)
  assert.match(await page.locator('.saved-exploration').innerText(), /Overview view/)
  await page.screenshot({ path: join(output, 'notebook-saved.png'), fullPage: true })
  return { savedDisplayMode: saved.displayMode, selectedSamples: saved.selectedSamples, guideProgress: saved.guideProgress }
})
await check('No records, drafts only, and saved records render distinct notebook states', async page => {
  await page.goto(`${base}/explorations`)
  await page.locator('.saved-empty').waitFor()
  await page.screenshot({ path: join(output, 'notebook-empty.png'), fullPage: true })
  await page.goto(fullUrl); await openNotes(page); await notes(page).fill('An unfinished region question')
  await page.goto(`${base}/explorations`)
  await page.getByRole('heading', { name: 'Continue your latest draft', exact: true }).waitFor()
  assert.equal(await page.locator('.saved-empty').count(), 0)
  assert.equal(await page.locator('.saved-exploration').count(), 0)
  assert.equal(await page.locator('.saved-draft').count(), 1)
  assert.match(await page.locator('.saved-draft time').innerText(), /Just now|minute/)
  assert.ok((await page.locator('.saved-draft time').getAttribute('title')).length > 20)
  assert.match(await page.locator('.notebook-radius').innerText(), /\d{2,3},\d{3}/)
  await page.screenshot({ path: join(output, 'notebook-draft-only.png'), fullPage: true })
  await page.getByRole('link', { name: 'Resume draft', exact: true }).click(); await openNotes(page)
  assert.equal(await notes(page).inputValue(), 'An unfinished region question')
})
await check('Example gives explicit bounds and restores broad view; note prompts follow actual selected samples', async page => {
  await page.goto(fullUrl); await openNotes(page)
  await page.getByLabel('Title', { exact: true }).fill('My unchanged question')
  await notes(page).fill('Keep this note across variables and ranges')
  await page.locator('.workbench-notice').getByRole('button', { name: 'Open example region', exact: true }).click()
  await canvas(page).waitFor()
  await page.getByText(/Example region opened:/).waitFor()
  await page.getByRole('button', { name: 'Restore previous view', exact: true }).click()
  assert.equal(Number(new URL(page.url()).searchParams.get('from')), observation.radial_range.minimum)
  assert.equal(new URL(page.url()).searchParams.get('guide'), '0')
  await page.getByRole('button', { name: 'Open example region', exact: true }).first().click(); await canvas(page).waitFor()
  await canvas(page).focus(); await canvas(page).press('Home'); await openNotes(page)
  assert.match(await notes(page).getAttribute('placeholder'), /Choose another point/)
  await canvas(page).focus(); await canvas(page).press('ArrowRight'); await openNotes(page)
  assert.match(await notes(page).getAttribute('placeholder'), /these two positions/)
  for (const variable of observation.principal_variables) {
    await page.getByRole('button', { name: variable.label, exact: true }).click()
    assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), 'My unchanged question')
    assert.equal(await notes(page).inputValue(), 'Keep this note across variables and ranges')
  }
  const phase = await page.locator('.phase-display-note').boundingBox(), chart = await page.locator('.scientific-profile').boundingBox()
  assert.ok(phase.y < chart.y)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: join(output, 'phase-notes.png'), fullPage: true })
})
await check('One save status follows failure and recovery without losing overview notes', async page => {
  await page.addInitScript(() => { const write = Storage.prototype.setItem; window.failWrites = true; Storage.prototype.setItem = function(...args) { if (window.failWrites) throw new DOMException('Test quota failure', 'QuotaExceededError'); return write.apply(this, args) } })
  await page.goto(fullUrl); await openNotes(page); await notes(page).fill('Notes survive a failed browser save')
  await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
  await page.locator('.save-status').filter({ hasText: 'Could not save' }).waitFor()
  assert.equal(await page.locator('.save-status').count(), 1)
  assert.equal(await page.getByText('Exploration saved.', { exact: true }).count(), 0)
  await page.evaluate(() => { window.failWrites = false })
  await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
  await page.getByText('Exploration saved.', { exact: true }).waitFor()
  assert.equal((await store(page)).records[0].notes, 'Notes survive a failed browser save')
  assert.equal((await store(page)).records[0].displayMode, 'overview')
})
await check('Notes and data downloads have local truthful feedback and can be retried', async page => {
  await page.goto(exampleUrl); await canvas(page).waitFor(); await openNotes(page); await notes(page).fill('Download retry evidence')
  await page.evaluate(() => { window.originalObjectURL = URL.createObjectURL; URL.createObjectURL = () => { throw new Error('Test download preparation failure') } })
  await page.getByRole('button', { name: 'Export notes', exact: true }).click()
  await page.locator('.exploration-notes .download-status').filter({ hasText: 'could not start' }).waitFor()
  await page.evaluate(() => { URL.createObjectURL = window.originalObjectURL })
  for (const [button, selector, filename] of [['Export notes','.exploration-notes .download-status','refinement-notes.md'],['Download selected data','.workbench-plot-column .download-status','refinement-data.csv']]) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: button, exact: true }).click(); const file = await pending
    assert.equal(await file.failure(), null); await file.saveAs(join(output, filename))
    assert.match(await page.locator(selector).innerText(), /prepared for download/)
    assert.match(await page.locator(selector).evaluate(e => e.parentElement.innerText), /browser may ask permission/)
  }
  assert.ok((await readFile(join(output, 'refinement-notes.md'),'utf8')).includes('Download retry evidence'))
})
await check('Mismatched and missing draft IDs never replace another observation’s notes', async page => {
  await page.goto(exampleUrl); await canvas(page).waitFor(); await openNotes(page)
  await notes(page).fill('Keep this original draft in its own observation')
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('cassini.explorations.v1')).drafts).some(d => d.notes === 'Keep this original draft in its own observation'))
  const originalDraftId = new URL(page.url()).searchParams.get('draft')
  await page.goto(`${base}/data/${catalog.observations[0].slug}?draft=${originalDraftId}`)
  await openNotes(page)
  await page.getByText('That draft belongs to another observation. A separate draft is open here; the original remains in My Explorations.', { exact: true }).waitFor()
  assert.equal(await notes(page).inputValue(), '')
  assert.notEqual(new URL(page.url()).searchParams.get('draft'), originalDraftId)
  assert.equal((await store(page)).drafts[originalDraftId].datasetId, observation.dataset_id)
  assert.equal((await store(page)).drafts[originalDraftId].notes, 'Keep this original draft in its own observation')
  await page.goto(`${exampleUrl}&draft=unknown-draft-refinement`); await openNotes(page)
  assert.equal(await notes(page).inputValue(), '')
})
await check('Same-observation SPA history switches between distinct drafts', async (page, context) => {
  await page.goto(exampleUrl); await canvas(page).waitFor(); await openNotes(page); await notes(page).fill('Draft A stays separate')
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('cassini.explorations.v1')).drafts).some(d => d.notes === 'Draft A stays separate'))
  const firstUrl = page.url()
  const other = await context.newPage(); await other.goto(exampleUrl); await canvas(other).waitFor(); await openNotes(other); await notes(other).fill('Draft B stays separate')
  await other.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('cassini.explorations.v1')).drafts).some(d => d.notes === 'Draft B stays separate'))
  const secondUrl = other.url()
  await page.evaluate(url => { history.pushState(null, '', url); dispatchEvent(new PopStateEvent('popstate')) }, secondUrl)
  await openNotes(page); assert.equal(await notes(page).inputValue(), 'Draft B stays separate')
  await page.goBack(); await openNotes(page); assert.equal(await notes(page).inputValue(), 'Draft A stays separate')
  assert.equal(new URL(page.url()).searchParams.get('draft'), new URL(firstUrl).searchParams.get('draft'))
  await other.close()
})
await check('Saving while a restored sample window reloads preserves previously selected IDs', async page => {
  await page.goto(exampleUrl); await canvas(page).waitFor(); await canvas(page).focus(); await canvas(page).press('Home'); await canvas(page).press('ArrowRight'); await openNotes(page)
  await page.getByRole('button', { name: 'Save exploration', exact: true }).click(); await page.getByText('Exploration saved.', { exact: true }).waitFor()
  const previous = (await store(page)).records[0]
  assert.equal(previous.selectedSamples.length, 2)
  await page.route('**/exact/*.bin', async route => { await new Promise(resolve => setTimeout(resolve, 3000)); await route.continue() })
  await page.reload(); await openNotes(page); await notes(page).fill('A note added while samples are loading')
  await page.getByRole('button', { name: 'Save exploration', exact: true }).click()
  await page.getByText('Exploration saved.', { exact: true }).waitFor()
  const pending = (await store(page)).records[0]
  assert.deepEqual(pending.selectedSamples, previous.selectedSamples)
  assert.equal(pending.displayMode, 'overview')
  await canvas(page).waitFor(); await page.getByRole('tab', { name: 'Inspect', exact: true }).click()
  assert.equal(Number(await page.locator('[data-sample-index]').getAttribute('data-sample-index')), previous.selectedSamples.at(-1))
  return { selectedSamples: pending.selectedSamples, displayModeDuringLoading: pending.displayMode }
})
await browser.close()

async function zoomScreenshot(page, context, path) {
  for (const img of await page.locator('img').all()) {
    await img.scrollIntoViewIfNeeded()
    await img.evaluate(e => e.decode().catch(() => {}))
  }
  await page.evaluate(() => { scrollTo({ top: 0, behavior: 'instant' }) })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const cdp = await context.newCDPSession(page)
  const { contentSize } = await cdp.send('Page.getLayoutMetrics')
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true, clip: { x: 0, y: 0, width: contentSize.width, height: contentSize.height, scale: 1 } })
  await writeFile(path, Buffer.from(screenshot.data, 'base64'))
  await cdp.detach()
}

// Chrome's own zoom preference, in disposable isolated profiles. Confirm actual
// viewport + devicePixelRatio changes; this is neither CSS zoom nor pinch scaling.
// Pref format: https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc
for (const width of [1440, 1280, 500]) for (const zoom of [1, 1.25, 1.5, 2]) {
  const profile = await mkdtemp(join(tmpdir(), 'cassini-refinement-zoom-'))
  await mkdir(join(profile, 'Default'))
  await writeFile(join(profile, 'Default', 'Preferences'), JSON.stringify({ partition: { default_zoom_level: { x: Math.log(zoom) / Math.log(1.2) } } }))
  const context = await chromium.launchPersistentContext(profile, { channel: 'chrome', headless: true, viewport: null, args: [`--window-size=${width},1000`] })
  try {
    const page = context.pages()[0]; page.setDefaultTimeout(10000)
    for (const [name, url] of [['home',base],['catalog',`${base}/data`],['workbench',exampleUrl],['notebook',`${base}/explorations`],['resources',`${base}/resources`]]) {
      await page.goto(url, { waitUntil: 'networkidle' }); await page.getByRole('heading', { level: 1 }).waitFor()
      if (name === 'workbench') { await canvas(page).waitFor(); await openNotes(page) }
      const details = await page.evaluate(() => ({ innerWidth, outerWidth, dpr: devicePixelRatio, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }))
      const passed = Math.abs(details.dpr - zoom) < 0.01 && !details.overflow
      report.zoom.push({ width, zoom, page: name, status: passed ? 'pass' : 'fail', ...details })
      if (!passed || (width === 1440 && zoom === 2) || (width === 500 && zoom === 1)) await zoomScreenshot(page, context, join(output, `zoom-${width}-${zoom}-${name}.png`))
      console.log(passed ? 'PASS' : 'FAIL', `real Chrome zoom ${width} ${zoom} ${name}`, details)
    }
  } finally { await context.close(); await rm(profile, { recursive: true, force: true }) }
  await writeFile(join(output, 'refinement-results.json'), JSON.stringify(report, null, 2))
}
process.exitCode = report.checks.some(r=>r.status==='fail') || report.zoom.some(r=>r.status==='fail') ? 1 : 0
