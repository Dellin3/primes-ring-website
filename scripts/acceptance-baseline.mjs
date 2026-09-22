// Existing Playwright installation only; no new project dependencies.
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const candidate = process.env.PLAYWRIGHT_MODULE
  || '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core'
const { chromium, webkit } = require(candidate)
const base = process.env.ACCEPTANCE_URL || 'http://localhost:5173'
const output = new URL('../artifacts/acceptance/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const page = await context.newPage()
const report = { date: new Date().toISOString(), base, browser: browser.version(), webkitInstalled: existsSync(webkit.executablePath()), checks: [] }
const catalog = await (await fetch(`${base}/data/observations/catalog.json`)).json()

try {
  await page.goto(`${base}/data`)
  await page.locator('.observation-rail [role=option]').first().waitFor()
  assert.equal(await page.locator('.observation-rail [role=option]').count(), catalog.observations.length)
  for (const observation of catalog.observations) {
    const option = page.locator('.observation-rail [role=option]').filter({ hasText: observation.ring_observation_id })
    await option.click()
    await page.locator('.observation-preview-main').getByText(observation.ring_observation_id, { exact: true }).waitFor()
    await page.locator('.observation-preview-main canvas, .observation-preview-main svg').first().waitFor()
    report.checks.push({ name: `catalog identity ${observation.dataset_id}`, status: 'pass' })
  }
  // Click successive selections without waiting for overview responses.
  await page.evaluate(() => {
    for (const button of document.querySelectorAll('.observation-rail [role=option]')) button.click()
  })
  const final = catalog.observations.at(-1)
  await page.locator('.observation-preview-main').getByText(final.ring_observation_id, { exact: true }).waitFor()
  report.checks.push({ name: 'rapid catalog switching leaves final identity', status: 'pass' })
  for (const observation of catalog.observations) {
    await page.goto(`${base}/data/${observation.slug}`)
    await page.locator('.scientific-profile canvas').waitFor()
    assert.match(await page.locator('.observation-identity').innerText(), new RegExp(observation.ring_observation_id))
    report.checks.push({ name: `detail overview ${observation.dataset_id}`, status: 'pass' })
  }
} catch (error) {
  report.checks.push({ name: 'baseline', status: 'fail', error: error.stack })
  process.exitCode = 1
} finally {
  await writeFile(new URL('baseline.json', output), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
}
