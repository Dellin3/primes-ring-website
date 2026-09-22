import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { canonicalSessionParams, restoreExplorerSession } from '../src/lib/explorerSession.js'
import { readExplorations, saveDraft, saveExploration } from '../src/lib/explorations.js'

const values = new Map()
const storageKey = 'cassini.explorations.v1'
globalThis.localStorage = {
  getItem: (key) => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
}
const metadata = { dataset_id: 'rss_2010_170_x43_e_dlp_500m' }
const observation = { revolution_number: 133 }
const baseRecord = {
  datasetId: metadata.dataset_id, slug: 'rev133e-x43-dlp-500m',
  title: 'Saved observation', notes: 'Original saved notes',
  version: '1.1.0', variable: 'optical_depth', range: [133625.75, 133881.75],
  selectedSamples: [247552, 247553], createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z', displayMode: 'exact',
}
const params = (query = '') => new URLSearchParams(query)
const restore = (query, freshDraftId = 'fresh-draft', target = metadata) => (
  restoreExplorerSession(query, target, observation, readExplorations(), freshDraftId)
)
const persisted = () => JSON.parse(values.get(storageKey))

beforeEach(() => {
  values.clear()
  readExplorations()
})

test('opening a saved snapshot and auto-saving it preserves its newer unsaved draft', () => {
  const saved = saveExploration({ ...baseRecord, draftId: 'dirty-draft' }).record
  const dirty = { ...saved, notes: 'New unsaved evidence', variable: 'phase_shift', updatedAt: '2030-01-01T00:00:00.000Z' }
  saveDraft(dirty)

  const session = restore(params(`record=${saved.id}`), 'snapshot-working-draft')
  assert.equal(session.restored.notes, baseRecord.notes)
  assert.equal(session.draftId, 'snapshot-working-draft')
  saveDraft({ ...session.restored, draftId: session.draftId })

  const store = persisted()
  assert.equal(store.drafts['dirty-draft'].notes, dirty.notes)
  assert.equal(store.drafts['dirty-draft'].variable, 'phase_shift')
  assert.equal(store.drafts['snapshot-working-draft'].notes, baseRecord.notes)
  assert.equal(store.records[0].notes, baseRecord.notes)
})

test('explicit current and legacy draft URLs restore their exact notes and source selections', () => {
  const saved = saveExploration({ ...baseRecord, draftId: 'current-draft' }).record
  saveDraft({ ...saved, notes: 'Latest draft notes', variable: 'signal_power' })
  const session = restore(params(`record=${saved.id}&draft=current-draft`))
  assert.equal(session.draftId, 'current-draft')
  assert.equal(session.restored.id, saved.id)
  assert.equal(session.restored.notes, 'Latest draft notes')
  assert.equal(session.restored.variable, 'signal_power')
  assert.deepEqual(session.restored.selectedSamples, baseRecord.selectedSamples)

  saveDraft({ ...baseRecord, notes: 'Legacy dataset-key draft' })
  assert.equal(restore(params('draft=1')).restored.notes, 'Legacy dataset-key draft')
})

test('fresh UUID draft URL resumes typed notes and the selected view after refresh', () => {
  const initial = restore(params(), 'fresh-uuid')
  const working = { ...baseRecord, title: initial.title, draftId: initial.draftId, notes: 'Typed before the first refresh', variable: 'phase_shift' }
  saveDraft(working)
  const address = canonicalSessionParams(params(), working, working.version, '')
  assert.equal(address.get('draft'), 'fresh-uuid')
  assert.equal(address.get('from'), String(working.range[0]))
  assert.equal(address.get('to'), String(working.range[1]))
  assert.equal(address.get('variable'), working.variable)
  assert.equal(address.has('notes'), false)

  const refreshed = restore(params(address.toString()), 'unused-new-uuid')
  assert.equal(refreshed.draftId, 'fresh-uuid')
  assert.equal(refreshed.restored.notes, working.notes)
  assert.equal(refreshed.restored.variable, working.variable)
  assert.deepEqual(refreshed.restored.range, working.range)
  assert.deepEqual(refreshed.restored.selectedSamples, working.selectedSamples)
})

test('an unavailable record cannot reject the new working draft after canonical navigation', () => {
  const originalAddress = params('record=missing-record')
  const initial = restore(originalAddress, 'recovery-draft')
  assert.ok(!initial.restored)
  assert.ok(initial.notice)
  const working = { ...baseRecord, draftId: initial.draftId, notes: 'Work after the unavailable record' }
  saveDraft(working)
  const address = canonicalSessionParams(originalAddress, working, working.version, initial.notice)
  assert.equal(originalAddress.get('record'), 'missing-record')
  assert.equal(address.has('record'), false)
  assert.equal(address.get('notice'), 'local-note-unavailable')
  assert.equal(restore(address).restored.notes, working.notes)
})

test('canonicalization retains old version and explicit public view fields without changing saved data', () => {
  const saved = saveExploration({ ...baseRecord, version: '0.9.0' }).record
  const originalAddress = params(`record=${saved.id}&version=0.9.0&variable=signal_power&from=133700&to=133800`)
  const initial = restore(originalAddress, 'version-working-draft')
  const current = { ...initial.restored, draftId: initial.draftId, version: '1.1.0' }
  saveDraft(current)
  const address = canonicalSessionParams(originalAddress, current, '0.9.0', '')
  assert.equal(address.get('version'), '0.9.0')
  assert.equal(address.get('variable'), 'signal_power')
  assert.equal(address.get('from'), '133700')
  assert.equal(address.get('to'), '133800')
  assert.equal(address.get('record'), saved.id)
  assert.equal(persisted().records[0].version, '0.9.0')
  assert.equal(persisted().records[0].notes, baseRecord.notes)
})

test('a public versioned view never imports private local notes', () => {
  saveDraft({ ...baseRecord, notes: 'Private legacy notes' })
  saveDraft({ ...baseRecord, draftId: 'private-uuid', notes: 'Private current notes' })
  const session = restore(params('version=1.1.0&variable=optical_depth'))
  assert.equal(session.restored, null)
  assert.equal(session.draftId, 'fresh-draft')
  assert.equal(persisted().drafts[metadata.dataset_id].notes, 'Private legacy notes')
  assert.equal(persisted().drafts['private-uuid'].notes, 'Private current notes')
})

test('mismatched or empty identities never substitute another draft or saved record', () => {
  const saved = saveExploration({ ...baseRecord, draftId: 'known-draft' }).record
  saveDraft(saved)
  saveDraft({ ...baseRecord, notes: 'Default draft must not substitute' })
  const otherDataset = { dataset_id: 'rss_2005_123_x43_e_dlp_500m' }
  for (const query of [params('draft=known-draft'), params(`record=${saved.id}`)]) {
    const session = restore(query, 'fresh-other', otherDataset)
    assert.ok(!session.restored)
    assert.ok(session.notice)
  }
  for (const query of ['record=', 'draft=', 'draft=missing-draft', 'record=wrong-record&draft=known-draft']) {
    const session = restore(params(query))
    assert.ok(!session.restored)
    assert.ok(session.notice)
  }
  assert.equal(persisted().drafts['known-draft'].notes, baseRecord.notes)
})
