const allowed = new Set(['exploration_started', 'exact_window_loaded', 'sample_inspected', 'exploration_saved', 'data_exported', 'view_shared', 'exploration_resumed'])
const seen = new Set()
let adapter = null
const events = []
const startedAt = Date.now()

// An opt-in, in-memory adapter. No network transport or visitor identity is installed.
export function setExplorationEventAdapter(callback) { adapter = callback }
export function emitExplorationEvent(name, detail = {}, deduplicationKey = '') {
  if (!allowed.has(name)) return false
  const key = `${name}:${deduplicationKey}`
  if (deduplicationKey && seen.has(key)) return false
  if (deduplicationKey) seen.add(key)
  const safe = { name, elapsedMs: Date.now() - startedAt }
  for (const field of ['datasetId', 'variable', 'rowCount', 'format']) {
    if (detail[field] !== undefined) safe[field] = detail[field]
  }
  events.push(safe)
  if (events.length > 100) events.shift()
  if (import.meta.env?.DEV && typeof window !== 'undefined') window.__cassiniExplorationEvents = events
  try { adapter?.(safe) } catch { /* Analytics must never interrupt research. */ }
  return true
}
