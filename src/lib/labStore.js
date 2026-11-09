// The measurement lab keeps one baseline and the activity answer in this
// browser, so a comparison survives switching observations. Storage can be
// unavailable (private windows, blocked site data); the lab then works for
// the current page only and says so.
const KEY = 'cassini.lab.v1'
const empty = { schema: 1, baseline: null, answer: '' }

export function readLab() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    if (!raw) return { ...empty }
    const parsed = JSON.parse(raw)
    if (parsed?.schema !== 1) return { ...empty }
    return { ...empty, ...parsed }
  } catch {
    return { ...empty, unavailable: true }
  }
}

export function writeLab(next) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify({ ...empty, ...next, unavailable: undefined }))
    return true
  } catch {
    return false
  }
}
