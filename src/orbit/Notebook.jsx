import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { deleteExploration, downloadText, explorationHref, readExplorations, renameExploration } from '../lib/explorations.js'
import { formatNotebookRange, relativeUpdatedTime, savedViewLabel } from '../lib/notebookPresentation.js'
import './Notebook.css'

const metricLabels = {
  optical_depth: 'Optical depth',
  signal_power: 'Signal power',
  phase_shift: 'Phase shift',
  normal_optical_depth: 'Optical depth',
  normalized_signal_power: 'Signal power',
  phase_shift_deg: 'Phase shift',
}

function NotebookIcon({ className = '' }) {
  return <svg className={className} width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M12 8h20a3 3 0 0 1 3 3v25H13a5 5 0 0 1-5-5V12a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="1.5" /><path d="M13 8v28M19 16h10M19 22h7M8 30h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}

function UpdatedTime({ value }) {
  const exact = new Date(value).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
  return <time dateTime={value} title={exact} aria-label={`Updated ${exact}`}>{relativeUpdatedTime(value)}</time>
}

function ViewDetails({ record }) {
  return <div className="orbit-note-details"><span>{metricLabels[record.variable] || record.variable.replaceAll('_', ' ')}</span><span className="mono">{formatNotebookRange(record.range)}</span><span><UpdatedTime value={record.updatedAt} /></span></div>
}

function NoteExcerpt({ notes }) {
  const trimmed = notes?.trim()
  return <p className={`orbit-note-excerpt${trimmed ? '' : ' is-empty'}`}>{trimmed ? `${trimmed.slice(0, 190)}${trimmed.length > 190 ? '…' : ''}` : 'A view to return to. Add your observations as you explore.'}</p>
}

// Autosaving after a save can leave an identical draft. Only hide that copy;
// changed notes and changed views must always remain available to resume.
function isUsefulDraft(draft, records) {
  const origin = records.find((record) => record.id === draft.originRecordId || (draft.draftId && record.draftId === draft.draftId))
  if (!origin) return true
  return ['notes', 'variable', 'version', 'slug', 'displayMode', 'guideProgress', 'guide', 'mode'].some((key) => (draft[key] ?? '') !== (origin[key] ?? ''))
    || (draft.title !== origin.title && draft.updatedAt > origin.updatedAt)
    || JSON.stringify(draft.range) !== JSON.stringify(origin.range)
    || JSON.stringify(draft.selectedSamples) !== JSON.stringify(origin.selectedSamples)
}

function SavedNote({ record, index, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(record.title)
  const inputRef = useRef(null)
  const renameRef = useRef(null)

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [editing])

  function finishRename() {
    setEditing(false)
    requestAnimationFrame(() => renameRef.current?.focus())
  }

  return <article className="orbit-saved-note glass-panel">
    <div className="orbit-note-caption"><span className="mono">{String(index + 1).padStart(2, '0')}</span><span>{record.observationName || 'Saved observation'}</span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h10v16l-5-3-5 3V4Z" stroke="currentColor" strokeWidth="1.3" /></svg></div>
    {editing ? <form className="orbit-note-rename" onSubmit={(event) => { event.preventDefault(); onRename(record.id, title); finishRename() }} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); finishRename() } }}>
      <label htmlFor={`note-title-${record.id}`}>Observation title</label><input ref={inputRef} id={`note-title-${record.id}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required />
      <div><button className="button button-secondary" type="submit">Save title</button><button className="button button-quiet" type="button" onClick={finishRename}>Cancel</button></div>
    </form> : <h3>{record.title || 'Untitled exploration'}</h3>}
    <NoteExcerpt notes={record.notes} />
    <ViewDetails record={record} />
    <div className="orbit-note-footer"><Link className="orbit-note-continue" to={explorationHref(record)} aria-label={`Continue ${record.title || 'untitled exploration'}`}>Continue <span aria-hidden="true">↗</span></Link><div><button ref={renameRef} type="button" disabled={editing} onClick={() => { setTitle(record.title); setEditing(true) }}>Rename</button><button type="button" onClick={() => onDelete(record)}>Delete</button></div></div>
  </article>
}

export default function Notebook() {
  const [store, setStore] = useState(readExplorations)
  const [status, setStatus] = useState('')
  const [deleting, setDeleting] = useState(null)
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    function refresh() { setStore(readExplorations()) }
    window.addEventListener('cassini-explorations-change', refresh)
    window.addEventListener('storage', refresh)
    return () => { window.removeEventListener('cassini-explorations-change', refresh); window.removeEventListener('storage', refresh) }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (deleting) { if (!dialog.open) dialog.showModal(); cancelRef.current?.focus() }
    else if (dialog.open) dialog.close()
  }, [deleting])

  const records = [...store.records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const drafts = Object.values(store.drafts).filter((draft) => isUsefulDraft(draft, records)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const latestDraft = drafts[0]
  const hasWork = records.length > 0 || drafts.length > 0

  function rename(id, title) {
    const result = renameExploration(id, title)
    setStore(readExplorations())
    setStatus(result.persistent ? 'Observation renamed.' : result.error)
  }

  function remove() {
    const result = deleteExploration(deleting.id)
    setDeleting(null)
    setStore(readExplorations())
    setStatus(result.persistent ? 'Saved observation deleted.' : result.error)
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  function exportNotebook() {
    try {
      downloadText(JSON.stringify({ schema: 1, records: store.records, drafts: store.drafts }, null, 2), `saturn-notebook-${new Date().toISOString().slice(0, 10)}.json`, 'application/json;charset=utf-8')
      setStatus('Notebook backup downloaded, including your saved observations and drafts.')
    } catch { setStatus('The backup could not be downloaded. Please try again.') }
  }

  return <section className="orbit-notebook" aria-label="Your observation notebook">
    <PageMeta title="Notebook" description="Return to your saved Cassini observations, continue a draft, and keep your questions about Saturn’s rings in one place." path="/explorations" />
    <header className="orbit-notebook-intro page-intro"><div><p className="eyebrow">Your notebook</p><h1 ref={titleRef} tabIndex={-1}>A thought worth keeping.</h1><p>Your observations, saved in this browser.</p></div>{hasWork && <button className="button button-quiet orbit-notebook-export" type="button" onClick={exportNotebook}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v9m-3-3 3 3 3-3M4 13v4h12v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Export notebook</button>}</header>
    {store.error && <p className="orbit-notebook-alert" role="alert">{store.error}</p>}
    <p className="orbit-notebook-status" role="status" aria-live="polite">{status}</p>
    {!hasWork && <section className="orbit-notebook-empty glass-panel" aria-labelledby="notebook-empty-title"><div className="orbit-notebook-empty-icon"><NotebookIcon /></div><p className="eyebrow">Room for discovery</p><h2 id="notebook-empty-title">Every observation starts<br />with a little curiosity.</h2><p>Explore the rings, notice a detail, and save the view.<br className="orbit-notebook-desktop-break" /> Your questions and notes will be waiting here.</p><Link to="/data" className="button button-primary">Explore data <span aria-hidden="true">↗</span></Link><div className="orbit-notebook-empty-orbit" aria-hidden="true" /></section>}
    {latestDraft && <section className="orbit-notebook-draft-section" aria-labelledby="notebook-draft-title"><div className="orbit-notebook-section-heading"><h2 id="notebook-draft-title">Pick up where you left off</h2><span className="orbit-note-live-label"><span />Draft</span></div><article className="orbit-latest-note glass-panel"><div className="orbit-latest-note-body"><p className="orbit-latest-note-caption mono">{latestDraft.observationName || 'An observation in progress'}</p><h3>{latestDraft.title || 'Untitled exploration'}</h3><NoteExcerpt notes={latestDraft.notes} /><ViewDetails record={latestDraft} /></div><div className="orbit-latest-note-action"><span>{savedViewLabel(latestDraft)}</span><Link className="button button-primary" to={explorationHref(latestDraft)}>Resume draft <span aria-hidden="true">↗</span></Link></div></article>
      {drafts.length > 1 && <details className="orbit-earlier-drafts"><summary>{drafts.length - 1} earlier {drafts.length === 2 ? 'draft' : 'drafts'}</summary><div>{drafts.slice(1).map((draft) => <article key={draft.draftId || draft.datasetId}><div><h3>{draft.title || 'Untitled exploration'}</h3>{draft.notes?.trim() && <NoteExcerpt notes={draft.notes} />}<p><UpdatedTime value={draft.updatedAt} /></p></div><Link to={explorationHref(draft)}>Resume <span aria-hidden="true">↗</span></Link></article>)}</div></details>}
    </section>}
    {records.length > 0 && <section className="orbit-notebook-saved" aria-labelledby="notebook-saved-title"><div className="orbit-notebook-section-heading"><h2 id="notebook-saved-title">Saved observations <span className="mono">{String(records.length).padStart(2, '0')}</span></h2><Link to="/data">Explore data <span aria-hidden="true">↗</span></Link></div><div className="orbit-notebook-grid">{records.map((record, index) => <SavedNote record={record} index={index} key={record.id} onRename={rename} onDelete={setDeleting} />)}</div></section>}
    <dialog ref={dialogRef} className="orbit-notebook-dialog" aria-labelledby="delete-note-title" aria-describedby="delete-note-description" onCancel={() => setDeleting(null)} onClose={() => setDeleting(null)}>{deleting && <><p className="eyebrow">Your notebook</p><h2 id="delete-note-title">Delete this observation?</h2><p id="delete-note-description">“{deleting.title || 'Untitled exploration'}” will be removed from your saved observations. This cannot be undone.</p><div><button ref={cancelRef} className="button button-secondary" type="button" onClick={() => setDeleting(null)}>Keep observation</button><button className="button orbit-delete-confirm" type="button" onClick={remove}>Delete observation</button></div></>}</dialog>
  </section>
}
