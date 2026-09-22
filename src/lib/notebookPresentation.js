const radiusFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 })
export const formatNotebookRange = (range) => `${radiusFormatter.format(range[0])}–${radiusFormatter.format(range[1])} km`
export function relativeUpdatedTime(date, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(date).getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
export const savedViewLabel = (record) => record.displayMode === 'exact' ? 'Individual-sample view' : record.displayMode ? 'Overview view' : 'Saved view'
