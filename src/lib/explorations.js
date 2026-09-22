import { project } from '../content/project.js'
const STORAGE_KEY = 'cassini.explorations.v1'
let memory = { records: [], drafts: {} }
let storageError = null
let pendingOperations = []

const validText = (value) => typeof value === 'string'
const validIdentifier = (value) => validText(value) && /^[a-zA-Z0-9_-]+$/.test(value)
const validDate = (value) => validText(value) && Number.isFinite(Date.parse(value))

function validRecord(record) {
  return record && validIdentifier(record.datasetId) && validText(record.slug)
    && /^[a-z0-9-]+$/.test(record.slug) && validIdentifier(record.variable)
    && Array.isArray(record.range) && record.range.length === 2
    && record.range.every(Number.isFinite) && record.range[0] <= record.range[1]
    && validText(record.title) && validText(record.notes)
    && validText(record.version) && record.version.trim().length > 0
    && Array.isArray(record.selectedSamples) && record.selectedSamples.length <= 2
    && record.selectedSamples.every((value) => Number.isSafeInteger(value) && value >= 0)
    && validDate(record.createdAt) && validDate(record.updatedAt)
    && (record.id === undefined || validIdentifier(record.id))
    && (record.originRecordId === undefined || validIdentifier(record.originRecordId))
    && (record.draftId === undefined || validIdentifier(record.draftId))
}

function parseStore(raw) {
  if (!raw) return { records: [], drafts: {} }
  const parsed = JSON.parse(raw)
  if (!parsed || parsed.schema !== 1 || !Array.isArray(parsed.records)
    || !parsed.drafts || typeof parsed.drafts !== 'object' || Array.isArray(parsed.drafts)
    || !parsed.records.every((record) => validRecord(record) && validIdentifier(record.id))
    || !Object.values(parsed.drafts).every(validRecord)) {
    throw new Error('Unrecognized or damaged saved data')
  }
  return { records: parsed.records, drafts: parsed.drafts }
}

export function readExplorations() {
  if (pendingOperations.length) return { ...memory, error: storageError }
  try {
    if (!globalThis.localStorage) throw new Error('Storage unavailable')
    memory = parseStore(globalThis.localStorage.getItem(STORAGE_KEY))
    storageError = null
  } catch {
    storageError = 'Browser storage is unavailable or unreadable. This session is kept in memory; export notes before leaving.'
  }
  return { ...memory, error: storageError }
}

function applyOperation(store, operation) {
  if (operation.type === 'draft') {
    return { ...store, drafts: { ...store.drafts, [operation.key]: operation.record } }
  }
  if (operation.type === 'save') {
    return { ...store, records: [operation.record, ...store.records.filter((record) => record.id !== operation.record.id)] }
  }
  if (operation.type === 'rename') {
    return { ...store, records: store.records.map((record) => record.id === operation.id ? { ...record, title: operation.title, updatedAt: operation.updatedAt } : record) }
  }
  return { ...store, records: store.records.filter((record) => record.id !== operation.id) }
}

function persist(operation) {
  memory = applyOperation(memory, operation)
  // A failed-storage editing session keeps its latest draft rather than a full
  // history of every keystroke. Other pending operations preserve their order.
  if (operation.type === 'draft') {
    pendingOperations = pendingOperations.filter((item) => item.type !== 'draft' || item.key !== operation.key)
  }
  pendingOperations.push(operation)
  let persistent = false
  try {
    if (!globalThis.localStorage) throw new Error('Storage unavailable')
    // Read immediately before writing: another tab may have saved, renamed or
    // deleted records since this module last read the notebook. Replay only our
    // own operations so a draft cannot replace another tab's complete records.
    const latest = parseStore(globalThis.localStorage.getItem(STORAGE_KEY))
    const next = pendingOperations.reduce(applyOperation, latest)
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: 1, ...next }))
    memory = next
    pendingOperations = []
    persistent = true
    storageError = null
  } catch {
    storageError = 'Could not save in this browser. Your work remains in this session. Export notes before leaving.'
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cassini-explorations-change'))
  return { persistent, error: storageError }
}

export function saveDraft(record) {
  return persist({ type: 'draft', key: record.draftId || record.datasetId, record: { ...record, originRecordId: record.id, id: undefined } })
}

export function saveExploration(record) {
  const now = new Date().toISOString()
  const saved = { ...record, id: record.id || globalThis.crypto.randomUUID(), title: record.title.trim() || 'Untitled exploration', createdAt: record.createdAt || now, updatedAt: now }
  return { record: saved, ...persist({ type: 'save', record: saved }) }
}

export function renameExploration(id, title) {
  return persist({ type: 'rename', id, title: title.trim() || 'Untitled exploration', updatedAt: new Date().toISOString() })
}

export function deleteExploration(id) {
  return persist({ type: 'delete', id })
}

export function viewHref(record) {
  const params = new URLSearchParams({ variable: record.variable, from: String(record.range[0]), to: String(record.range[1]), version: record.version })
  if (record.guide) params.set('guide', '1')
  if (record.mode === 'research') params.set('mode', 'research')
  return `/data/${record.slug}?${params}`
}

export function explorationHref(record) {
  return `${viewHref(record)}&${record.id ? `record=${encodeURIComponent(record.id)}` : `draft=${encodeURIComponent(record.draftId || '1')}`}`
}

export function downloadText(text, name, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export function observationMarkdown(record, metadata, origin = '', now = new Date()) {
  const variable = metadata.principal_variables.find((item) => item.id === record.variable)
  const viewOrigin = origin === 'null' ? project.publicSiteUrl : origin
  return `# ${record.title || 'Untitled exploration'}\n\n## Question\n\nHow does ${variable?.label?.toLowerCase() || 'the selected variable'} change across this region?\n\n## Your observations and limitations\n\n${record.notes || ''}\n\n## Reproducible view\n\n${viewOrigin}${viewHref(record)}\n\n- Observation: ${record.observationName}\n- Source product: ${metadata.pds_identity.product_id}\n- Ring observation: ${metadata.pds_identity.ring_observation_id}\n- Dataset: ${record.datasetId}\n- Web data version: ${record.version}\n- Selected radius (inclusive): ${record.range[0]} to ${record.range[1]} km from Saturn’s center\n- Variable: ${variable?.label || record.variable}\n- Unit: ${variable?.unit === 'N/A' ? 'dimensionless (source unit: N/A)' : variable?.unit}\n- Selected source sample indices (0-based): ${(record.selectedSamples || []).join(', ')}\n- Display mode when exported: ${record.displayMode}\n- Guide progress: ${record.guideProgress}\n- Created: ${record.createdAt}\n- Updated: ${record.updatedAt}\n- Exported: ${now.toISOString()}\n\n## Evidence and limitations\n\n${variable?.description || ''}\n\nThe Diffraction-Limited Profile (DLP) is calibrated and still affected by diffraction; this is not this project’s high-resolution reconstruction. Optical depth is not mass density. Phase is displayed as stored, without unwrapping or inferred continuity. No per-sample quality flag is included in the four-field web derivative. Missing values remain missing; negative measurements are preserved. Overview samples are for display only. CSV exports include every exact converted row within the inclusive radius boundaries and preserve the original zero-based sample index. Float64 values preserve the project conversion, not the original ASCII formatting. Version differences must be checked when reopening.\n\nSource archive: https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=CO-SR-RSS-4%2F5-OCC-V2.0\n\nNotes are not included in the view URL. This document includes the notes you chose to export.\n`
}
