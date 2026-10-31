// Writes the downloadable moons table from src/content/moons.js so the file
// and the page always show the same values. Run: npm run data:moons
import { mkdir, writeFile } from 'node:fs/promises'
import { moonsCsv, moonsCsvPath } from '../src/content/moons.js'

const target = new URL(`../public${moonsCsvPath}`, import.meta.url)
await mkdir(new URL('.', target), { recursive: true })
await writeFile(target, moonsCsv())
console.log(`Wrote public${moonsCsvPath}`)
