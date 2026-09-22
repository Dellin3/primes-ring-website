import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')
const base = process.env.ACCEPTANCE_URL || 'http://localhost:5174'
const output = new URL('../artifacts/acceptance/', import.meta.url)
await mkdir(output, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: true })
const context = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true })
const p = await context.newPage()
p.setDefaultTimeout(15000)
const errors = []
const requests = []
p.on('pageerror', e => errors.push(e.message))
p.on('request', r => requests.push(r.url()))
const report = { at: new Date().toISOString(), browser: b.version(), viewport: '1440×900', base, checks: [], errors }
try {
  await p.goto(base)
  await p.getByRole('link', { name: 'Start a guided exploration', exact: true }).first().waitFor()
  await p.screenshot({ path: new URL('01_home.png', output).pathname })
  report.checks.push({ name: 'home', status: 'pass', initial3D: requests.some(url => url.includes('ScientificHeroScene')) })
  const started = performance.now()
  await p.getByRole('link', { name: 'Start a guided exploration', exact: true }).first().click()
  const canvas = p.locator('.scientific-profile canvas[role=slider]')
  await canvas.waitFor()
  report.timeToExactWindowMs = Math.round(performance.now() - started)
  await p.screenshot({ path: new URL('02_loaded_example.png', output).pathname })
  await canvas.focus()
  await canvas.press('Home')
  await canvas.press('ArrowRight')
  await p.screenshot({ path: new URL('03_exact_sample.png', output).pathname })
  await p.getByRole('tab', { name: 'Notes', exact: true }).click()
  await p.getByLabel('Title', { exact: true }).fill('Two nearby Cassini positions')
  await p.getByLabel('Observations and limitations').fill('Two adjacent source records were inspected. This profile alone does not establish a physical cause.')
  await p.getByRole('button', { name: 'Save exploration', exact: true }).click()
  await p.getByText('Saved in this browser. Continue from My Explorations.', { exact: true }).waitFor()
  report.checks.push({ name: 'guided inspect and save', status: 'pass' })
  const range = [await p.getByLabel('Lower radius (km)', { exact: true }).inputValue(), await p.getByLabel('Upper radius (km)', { exact: true }).inputValue()]
  await p.reload()
  await p.locator('.scientific-profile canvas[role=slider]').waitFor()
  await p.getByRole('tab', { name: 'Notes', exact: true }).click()
  assert.equal(await p.getByLabel('Title', { exact: true }).inputValue(), 'Two nearby Cassini positions')
  assert.match(await p.getByLabel('Observations and limitations').inputValue(), /Two adjacent source records/)
  assert.deepEqual([await p.getByLabel('Lower radius (km)', { exact: true }).inputValue(), await p.getByLabel('Upper radius (km)', { exact: true }).inputValue()], range)
  await p.screenshot({ path: new URL('04_saved_restored.png', output).pathname })
  report.checks.push({ name: 'refresh restores title notes and range', status: 'pass' })
  for (const [button, name] of [['Download selected data', 'example_window.csv'], ['Export observation record', 'example_observation.md']]) {
    const downloading = p.waitForEvent('download')
    await p.getByRole('button', { name: button, exact: true }).click()
    const downloaded = await downloading
    await downloaded.saveAs(new URL(name, output).pathname)
    assert.equal(await downloaded.failure(), null)
    report.checks.push({ name: button, status: 'pass' })
  }
  await p.setViewportSize({ width: 390, height: 844 })
  await p.evaluate(() => scrollTo(0, 0))
  await p.screenshot({ path: new URL('05_mobile_workbench.png', output).pathname, fullPage: true })
  report.mobileOverflow = await p.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }))
  report.checks.push({ name: 'mobile has no horizontal page overflow', status: report.mobileOverflow.document <= report.mobileOverflow.viewport ? 'pass' : 'fail' })
} catch (error) {
  report.checks.push({ name: 'smoke', status: 'fail', error: error.stack })
  await p.screenshot({ path: new URL('smoke_debug.png', output).pathname, fullPage: true })
  report.pageText = (await p.locator('body').innerText()).slice(0, 15000)
  process.exitCode = 1
} finally {
  await writeFile(new URL('smoke.json', output), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await b.close()
}
