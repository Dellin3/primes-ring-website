import assert from 'node:assert/strict'
import test from 'node:test'

const key = 'cassini.explorations.v1'
const now = '2026-09-08T12:00:00.000Z'
const record = {
  title: 'A local observation', notes: 'Local notes',
  datasetId: 'rss_2010_170_x43_e_dlp_500m', slug: 'rev133e-x43-dlp-500m',
  version: '1.1.0', variable: 'optical_depth', range: [133625.75, 133881.75],
  selectedSamples: [247552], createdAt: now, updatedAt: now,
}
let contextNumber = 0
globalThis.localStorage = {}
async function tabs(t) {
  const values = new Map()
  const storage = { getItem: (name) => values.get(name) || null, setItem: (name, value) => values.set(name, value) }
  t.mock.property(globalThis, 'localStorage', storage)
  const context = contextNumber++
  const a = await import(`../src/lib/explorations.js?multi=${context}-a`)
  const b = await import(`../src/lib/explorations.js?multi=${context}-b`)
  a.readExplorations()
  b.readExplorations()
  return { a, b, values, storage }
}

test('another tab auto-saving a draft preserves newly saved and renamed records', async (t) => {
  const { a, b, values } = await tabs(t)
  const saved = a.saveExploration(record).record
  b.saveDraft({ ...record, draftId: 'tab-b' })
  let persisted = JSON.parse(values.get(key))
  assert.equal(persisted.records[0].id, saved.id)
  assert.equal(persisted.drafts['tab-b'].notes, record.notes)
  a.renameExploration(saved.id, 'Renamed in A')
  b.saveDraft({ ...record, draftId: 'tab-b', notes: 'A later draft in B' })
  persisted = JSON.parse(values.get(key))
  assert.equal(persisted.records[0].title, 'Renamed in A')
  a.deleteExploration(saved.id)
  b.saveDraft({ ...record, draftId: 'tab-b', notes: 'Still editing in B' })
  assert.equal(JSON.parse(values.get(key)).records.length, 0)
})

test('independent same-dataset drafts and their resume links remain distinct', async (t) => {
  const { a, b, values } = await tabs(t)
  a.saveDraft({ ...record, draftId: 'tab-a', notes: 'Private A notes' })
  b.saveDraft({ ...record, draftId: 'tab-b', notes: '' })
  const persisted = JSON.parse(values.get(key))
  assert.equal(persisted.drafts['tab-a'].notes, 'Private A notes')
  assert.equal(persisted.drafts['tab-b'].notes, '')
  assert.match(a.explorationHref({ ...record, draftId: 'tab-a' }), /draft=tab-a$/)
  assert.match(a.explorationHref(record), /draft=1$/)
  assert.ok(!a.viewHref({ ...record, draftId: 'tab-a' }).includes('draft'))
})

test('failed writes keep local notes and merge queued edits with another tab when storage recovers', async (t) => {
  const { a, b, storage, values } = await tabs(t)
  const normalSet = storage.setItem
  storage.setItem = () => { throw new Error('Quota') }
  assert.equal(a.saveDraft({ ...record, draftId: 'tab-a', notes: 'Must survive' }).persistent, false)
  assert.equal(a.readExplorations().drafts['tab-a'].notes, 'Must survive')
  storage.setItem = normalSet
  const saved = b.saveExploration({ ...record, title: 'Saved by B' }).record
  assert.equal(a.saveDraft({ ...record, draftId: 'tab-a', notes: 'Must survive, updated' }).persistent, true)
  const persisted = JSON.parse(values.get(key))
  assert.equal(persisted.records[0].id, saved.id)
  assert.equal(persisted.drafts['tab-a'].notes, 'Must survive, updated')
})

test('damaged versions, selected indices and timestamps never enter UI state or destroy the in-session copy', async (t) => {
  const { a, values } = await tabs(t)
  const saved = a.saveExploration(record).record
  for (const badField of [{ version: null }, { selectedSamples: 'invalid' }, { selectedSamples: [NaN] }, { updatedAt: {} }, { createdAt: 'not a date' }]) {
    values.set(key, JSON.stringify({ schema: 1, records: [{ ...saved, ...badField }], drafts: {} }))
    const result = a.readExplorations()
    assert.match(result.error, /unreadable/)
    assert.equal(result.records[0].id, saved.id)
    assert.equal(result.records[0].updatedAt, saved.updatedAt)
  }
  const damaged = values.get(key)
  assert.equal(a.saveDraft({ ...record, draftId: 'recover-me' }).persistent, false)
  assert.equal(values.get(key), damaged)
  assert.equal(a.readExplorations().drafts['recover-me'].title, record.title)
})
