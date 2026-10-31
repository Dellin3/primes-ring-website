import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
// Home, five sections, one research page per PRIMES cohort, the explorer, the catalog and 6 + 6 observation pages.
assert.equal(urls.length, 21)
assert.equal(new Set(urls).size, urls.length)
const origin = new URL(urls[0]).origin
const titles = new Set()
const bodies = new Set()
for (const url of urls) {
  const path = new URL(url).pathname
  const html = await readFile(path === '/' ? 'dist/index.html' : `dist${path}/index.html`, 'utf8')
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${path}: one canonical`)
  assert(html.includes(`href="${url}"`), `${path}: canonical matches route`)
  const title = html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1]
  assert(title && !titles.has(title), `${path}: distinct title`); titles.add(title)
  const body = html.match(/<div id="root">([\s\S]+)<\/div>/)?.[1]
  assert(body && /<h1\b/.test(body) && !bodies.has(body), `${path}: substantive distinct React HTML with primary heading`); bodies.add(body)
  assert(!html.includes('Opening your workspace'), `${path}: no Suspense shell`)
  assert(!html.includes('<!--route-'), `${path}: no unfilled placeholders`)
  assert(!html.includes('cassini.explorations.v1'), `${path}: no browser records serialized`)
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(match[1])
  if (path.startsWith('/datasets/')) {
    const schema = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]))
    assert(schema.some(item => item['@type'] === 'Dataset' && item.url === url && item.isBasedOn?.identifier.startsWith('RSS_')), `${path}: traceable Dataset schema`)
    assert(html.includes('not the original PDS ASCII table or a new reconstruction') && html.includes('metadata.json'), `${path}: visible data provenance and limits`)
  }
}
const notebook = await readFile('dist/explorations/index.html', 'utf8')
assert(/name="robots" content="noindex, follow"/.test(notebook), 'Notebook must be noindex')
assert(!sitemap.includes('/explorations') && urls.every(url => !new URL(url).search && !new URL(url).hash), 'Private/parameter views absent from sitemap')
assert(!sitemap.includes('/feedback') && (await readFile('dist/feedback/index.html', 'utf8')).includes('noindex, follow'), 'Feedback form remains available but unindexed')
assert((await readFile('dist/404.html', 'utf8')).includes('noindex, follow'), '404 must be noindex')
assert((await readFile('dist/robots.txt', 'utf8')).includes(`Sitemap: ${origin}/sitemap.xml`), 'Robots origin matches sitemap')
assert(!(await readFile('dist/llms.txt', 'utf8')).includes('- My notebook:'), 'AI document does not direct public indexing to notebook')
const config = JSON.parse(await readFile('vercel.json', 'utf8'))
assert(config.functions['api/feedback.js'], 'Existing feedback function preserved')
assert(!config.rewrites.some(rule => rule.destination === '/index.html'), 'No route falls back to homepage metadata')
const page = async path => readFile(path === '/' ? 'dist/index.html' : `dist${path}/index.html`, 'utf8')
for (const path of ['/planet', '/rings', '/moons', '/missions', '/research', '/research/2026']) assert(urls.includes(`${origin}${path}`), `${path} is a public canonical page`)
for (const path of ['/planet', '/rings', '/moons', '/missions']) assert((await page(path)).includes('Where these facts come from'), `${path}: visible sources`)
const ringsHtml = await page('/rings')
assert.equal((ringsHtml.match(/class="guided-item"/g) || []).length, 5, '/rings: five guided observations in static HTML')
assert(ringsHtml.includes('href="/data/rev064e-x43-dlp-500m?variable=optical_depth&amp;from=89000&amp;to=95000&amp;version=1.1.0"'), '/rings: guided links open exact explorer windows')
const moonsHtml = await page('/moons')
assert.equal((moonsHtml.match(/<tr>/g) || []).length, 17, '/moons: header row plus sixteen moons')
assert(moonsHtml.includes('href="/downloads/saturn-major-moons.csv"') && (await readFile('dist/downloads/saturn-major-moons.csv', 'utf8')).includes('semi_major_axis_km'), '/moons: downloadable CSV')
const schemaOf = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]))
assert(schemaOf(await page('/research/2026')).some(item => item['@type'] === 'ResearchProject' && item.url === `${origin}/research/2026`), '/research/2026: project schema')
assert(schemaOf(await page('/research')).some(item => item['@type'] === 'CollectionPage'), '/research: archive schema')
assert(config.rewrites.some(rule => rule.source === '/research/:year(\\d{4})'), 'Cohort pages have a static rewrite')
assert(!config.redirects.some(rule => rule.source === '/research/:moduleSlug'), 'Former module redirect must not capture cohort pages')
console.log(`SEO checks passed: ${urls.length} raw HTML routes, unique metadata, sourced section pages, research archive, six source-backed Dataset pages, notebook exclusions and preserved feedback API.`)
