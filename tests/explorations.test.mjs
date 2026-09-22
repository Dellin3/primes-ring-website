import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readExplorations, saveDraft, saveExploration, renameExploration, deleteExploration, observationMarkdown, viewHref, explorationHref } from '../src/lib/explorations.js'
import { emitExplorationEvent, setExplorationEventAdapter } from '../src/lib/explorationEvents.js'
const values = new Map()
globalThis.localStorage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) }
const record = { title: 'Evidence notes', notes: 'private text & <script>', datasetId: 'rss_2010_170_x43_e_dlp_500m', slug: 'rev133e-x43-dlp-500m', version: '1.1.0', variable: 'phase_shift', range: [133625.75, 133881.75], selectedSamples: [247552, 247553], guide: true, guideProgress: 'inspect', observationName: 'Rev 133 Egress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), displayMode: 'exact' }

test('named save, rename, draft, restore and delete preserve state with honest storage results', () => {
  readExplorations()
  const result = saveExploration(record)
  assert.equal(result.persistent, true)
  assert.deepEqual(readExplorations().records[0].selectedSamples, record.selectedSamples)
  const id = result.record.id
  renameExploration(id, 'Renamed')
  assert.equal(readExplorations().records[0].title, 'Renamed')
  saveDraft({ ...result.record, notes: 'updated draft' })
  assert.equal(readExplorations().drafts[record.datasetId].originRecordId, id)
  assert.equal(readExplorations().drafts[record.datasetId].notes, 'updated draft')
  deleteExploration(id)
  assert.equal(readExplorations().records.length, 0)
})
test('shared links encode public view only, restored links distinguish a local record', () => {
  const url = new URL(viewHref(record), 'https://example.org')
  assert.equal(url.searchParams.get('from'), String(record.range[0]))
  assert.equal(url.searchParams.get('version'), record.version)
  assert.equal(url.searchParams.has('notes'), false)
  assert.equal(url.searchParams.has('record'), false)
  assert.ok(!url.href.includes('private'))
  assert.ok(explorationHref({ ...record, id: 'local-id' }).endsWith('record=local-id'))
})
test('readable exported record includes real identity and leaves unwritten observations empty', () => {
  const meta = JSON.parse(readFileSync(`public/data/observations/${record.datasetId}/metadata.json`))
  const markdown = observationMarkdown({ ...record, notes: '' }, meta, 'https://example.org', new Date('2026-09-08T12:00:00Z'))
  assert.ok(markdown.includes('## Your observations and limitations\n\n\n\n'))
  assert.ok(markdown.includes('RSS_2010_170_X43_E_DLP_500M.TAB'))
  assert.ok(markdown.includes('247552, 247553'))
  assert.ok(markdown.includes('2026-09-08T12:00:00.000Z'))
  assert.ok(markdown.includes('DEGREE'))
})
test('events are allowlisted, deduplicated, and never send notes or radius boundaries', () => {
  const events = []
  setExplorationEventAdapter((event) => events.push(event))
  assert.equal(emitExplorationEvent('sample_inspected', { datasetId: 'dataset', notes: 'private', from: 123 }, 'once'), true)
  assert.equal(emitExplorationEvent('sample_inspected', {}, 'once'), false)
  assert.equal(emitExplorationEvent('unknown', {}, 'once'), false)
  assert.equal(events.length, 1)
  assert.equal('notes' in events[0], false)
  assert.equal('from' in events[0], false)
})
test('quota failure never reports success and session notes survive subsequent reads', () => {
  globalThis.localStorage.setItem = () => { throw new Error('Quota exceeded') }
  const result = saveExploration({ ...record, notes: 'work that must survive' })
  assert.equal(result.persistent, false)
  assert.match(result.error, /Could not save/)
  assert.equal(readExplorations().records[0].notes, 'work that must survive')
  assert.equal(readExplorations().error, result.error)
})
