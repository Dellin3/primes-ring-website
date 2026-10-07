import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { render, siteOrigin } from '../dist-ssr/entry-server.js'

const origin = new URL(siteOrigin)
if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('VITE_PUBLIC_SITE_URL must be a HTTPS site origin without credentials')
const catalog = JSON.parse(await readFile('public/data/observations/catalog.json', 'utf8'))
const publicRoutes = ['/', '/data', '/research', '/datasets', ...catalog.observations.flatMap(observation => [`/data/${observation.slug}`, `/datasets/${observation.slug}`])]
const routes = [...publicRoutes, '/feedback', '/explorations', '/404']
const template = await readFile('dist/index.html', 'utf8')
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
function routeStyles(path) {
  const entry = path === '/research' ? 'src/orbit/Research.jsx' : path === '/explorations' ? 'src/orbit/Notebook.jsx' : path.startsWith('/data') && !path.startsWith('/datasets') ? 'src/orbit/Explorer.jsx' : null
  const css = new Set()
  const visited = new Set()
  function collect(key) {
    if (!key || visited.has(key)) return
    visited.add(key)
    const chunk = manifest[key]
    for (const file of chunk?.css || []) css.add(file)
    for (const dependency of chunk?.imports || []) collect(dependency)
  }
  collect(entry)
  return [...css].filter(file => !template.includes(file)).map(file => `<link rel="stylesheet" href="/${file}">`).join('\n')
}
for (const path of routes) {
  const { body, head } = await render(path)
  if (!body || !head.includes('canonical')) throw new Error(`Incomplete route rendering: ${path}`)
  const html = template.replace('<!--route-head-->', `${head}\n${routeStyles(path)}`).replace('<!--route-body-->', body)
  const directory = path === '/' || path === '/404' ? resolve('dist') : resolve(`dist${path}`)
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, path === '/404' ? '404.html' : 'index.html'), html)
}
const urls = publicRoutes.map(path => `${siteOrigin}${path}`)
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `<url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`)
await writeFile('dist/sitemap.txt', `${urls.join('\n')}\n`)
// Leave the notebook crawlable so crawlers can observe its noindex directive.
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`)
let llms = await readFile('public/llms.txt', 'utf8')
llms = llms.split('\nPublic observation catalog:')[0]
llms = llms.replaceAll('https://primes-ring-website-p9yv.vercel.app', siteOrigin).replace(/^- My notebook: .*\n/m, '')
llms += `\nPublic observation catalog: ${siteOrigin}/datasets\n${catalog.observations.map(observation => `- ${observation.display_name}: ${siteOrigin}/datasets/${observation.slug}`).join('\n')}\n\nThe visitor notebook is browser-local and excluded from public search indexing. These data details describe the archived DLP products, not new high-resolution reconstruction results.\n`
await writeFile('dist/llms.txt', llms)
console.log(`Prerendered ${routes.length} routes with shared React components; ${publicRoutes.length} public canonical URLs.`)
