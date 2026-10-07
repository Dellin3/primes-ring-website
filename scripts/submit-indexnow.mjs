import { readFile, readdir } from 'node:fs/promises'

// Explicit post-deployment action only. Never run during builds or CI.
const builtSitemap = await readFile('dist/sitemap.xml', 'utf8')
const builtUrls = [...builtSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
if (!builtUrls.length) throw new Error('Build the site before submitting URLs')
const origin = new URL(builtUrls[0]).origin
const configured = process.env.VITE_PUBLIC_SITE_URL || process.env.VITE_SITE_URL
if (configured && new URL(configured).origin !== origin) throw new Error('Configured origin differs from the built canonical sitemap; rebuild first')
const keyFiles = (await readdir('public')).filter(name => /^[a-f0-9]{32}\.txt$/.test(name))
if (keyFiles.length !== 1) throw new Error('Expected one public IndexNow verification key')
const key = (await readFile(`public/${keyFiles[0]}`, 'utf8')).trim()
if (key !== keyFiles[0].slice(0, -4)) throw new Error('IndexNow key file does not match filename')
const keyLocation = `${origin}/${keyFiles[0]}`
const verification = await fetch(keyLocation, { signal: AbortSignal.timeout(15000), redirect: 'error' })
if (verification.status !== 200 || (await verification.text()).trim() !== key) throw new Error('Live IndexNow key is not deployed or returns incorrect contents')
const response = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(15000), redirect: 'error' })
if (response.status !== 200) throw new Error(`Live sitemap unavailable: HTTP ${response.status}`)
const urls = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
if (!urls.length || urls.some(value => {
  const url = new URL(value)
  return url.origin !== origin || url.search || url.hash || url.pathname.startsWith('/explorations') || url.pathname === '/feedback' || !builtUrls.includes(value)
})) throw new Error('Live sitemap contains unexpected, private, parameterized or cross-origin URLs')
if (new Set(urls).size !== builtUrls.length || urls.length !== builtUrls.length) throw new Error('Live sitemap differs from the built URL set; deploy the completed build first')
const submitted = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList: [...new Set(urls)] }),
  signal: AbortSignal.timeout(20000),
})
if (!submitted.ok) throw new Error(`IndexNow rejected submission: HTTP ${submitted.status}`)
console.log(`IndexNow accepted ${new Set(urls).size} public URLs for ${origin} (HTTP ${submitted.status}). Acceptance does not guarantee crawling, indexing or AI citations.`)
