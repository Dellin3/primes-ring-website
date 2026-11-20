import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import { site } from '../src/content/site.js'

// Saturn Ring Lab is a Saturn ring website: no research-program branding and
// no personal contact details in anything the browser receives.
const textFiles = /\.(jsx?|mjs|css|html|txt|xml|json|csv|svg|webmanifest)$/
async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (textFiles.test(entry.name)) yield path
  }
}

test('the site is named Saturn Ring Lab', () => {
  assert.equal(site.name, 'Saturn Ring Lab')
  assert.equal(new URL(site.publicSiteUrl).hostname, 'saturnringlab.com')
})

test('nothing sent to browsers mentions PRIMES or a personal email address', async () => {
  const files = ['index.html']
  for (const root of ['src', 'public']) for await (const path of walk(root)) files.push(path)
  assert(files.length > 50, 'walked the site sources')
  for (const path of files) {
    const text = await readFile(path, 'utf8')
    assert(!/\bPRIMES\b/.test(text), `${path} mentions PRIMES`)
    assert(!/zhuoxuan780123/i.test(text), `${path} contains the owner's email address`)
    assert(!/research\/20\d\d|to="\/research"/.test(text), `${path} links to the removed research pages`)
  }
})
