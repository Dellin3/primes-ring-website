// Resolve only the local identity explicitly requested by the URL. Storage
// reads and ID generation stay with the caller so this decision is deterministic.
export function restoreExplorerSession(params, metadata, observation, store, freshDraftId) {
  const recordId = params.get('record')
  const draftQuery = params.get('draft')
  const hasRecord = params.has('record')
  const hasDraft = params.has('draft')
  const saved = recordId ? store.records.find((item) => item.id === recordId && item.datasetId === metadata.dataset_id) : null
  const draft = hasDraft ? store.drafts[draftQuery === '1' ? metadata.dataset_id : draftQuery] : store.drafts[metadata.dataset_id]
  const validDraft = draft?.datasetId === metadata.dataset_id && (!hasRecord || draft.originRecordId === recordId)
  const restored = hasDraft ? validDraft ? { ...draft, id: draft.originRecordId } : null
    : hasRecord ? saved : !params.has('version') && validDraft ? { ...draft, id: draft.originRecordId } : null
  return {
    restored,
    // A saved snapshot and its live draft can contain different notes. Give
    // record-only restores a separate working draft so neither is overwritten.
    draftId: hasRecord && !hasDraft ? freshDraftId : restored?.draftId || freshDraftId,
    title: restored?.title || `Rev ${String(observation.revolution_number).padStart(3, '0')} · ring profile`,
    notice: hasDraft && !validDraft ? 'This draft is unavailable for this observation. A fresh draft is open; existing notes are preserved in your notebook.'
      : hasRecord && !restored ? 'This saved note is unavailable in this browser. The linked data view is open.' : '',
    storageError: store.error,
  }
}

export function canonicalSessionParams(params, record, requestedVersion, notice) {
  const next = new URLSearchParams(params)
  next.set('draft', record.draftId)
  if (next.has('record') && next.get('record') !== record.id) next.delete('record')
  if (!next.has('from')) next.set('from', String(record.range[0]))
  if (!next.has('to')) next.set('to', String(record.range[1]))
  if (!next.has('variable')) next.set('variable', record.variable)
  if (!next.has('version')) next.set('version', requestedVersion || record.version)
  if (notice) next.set('notice', 'local-note-unavailable')
  return next
}
