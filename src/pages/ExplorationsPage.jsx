import '../styles/explorations.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { deleteExploration, explorationHref, readExplorations, renameExploration } from '../lib/explorations.js'
import { formatNotebookRange, relativeUpdatedTime, savedViewLabel } from '../lib/notebookPresentation.js'

function UpdatedTime({ value }) {
  const exact = new Date(value).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })
  return <time dateTime={value} title={exact} aria-label={`Updated ${exact}`}>{relativeUpdatedTime(value)}</time>
}
function ViewSummary({ record }) {
  return <><p>{record.observationName}</p><p><span className="notebook-radius">{formatNotebookRange(record.range)}</span> · {record.variable.replaceAll('_', ' ')} · {savedViewLabel(record)}</p><p className="notebook-meta"><UpdatedTime value={record.updatedAt} /> · data v{record.version}</p></>
}
function SavedItem({ record, onChange }) {
  const [title, setTitle] = useState(record.title)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  return <article className="saved-exploration"><div><h3>{record.title}</h3><ViewSummary record={record} />{record.notes && <p className="saved-note-preview">{record.notes.slice(0, 240)}{record.notes.length > 240 ? '…' : ''}</p>}</div><div className="saved-exploration-actions"><Link className="button button-primary" to={explorationHref(record)}>Continue exploration</Link><button type="button" onClick={() => setEditing(!editing)}>Rename</button><button type="button" onClick={() => { const result = deleteExploration(record.id); if (!result.persistent) setMessage(result.error); onChange() }}>Delete</button></div>{editing && <form onSubmit={(event) => { event.preventDefault(); const result = renameExploration(record.id, title); setMessage(result.persistent ? 'Renamed in this browser.' : result.error); setEditing(false); onChange() }}><label>New title<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} /></label><button type="submit">Save title</button></form>}{message && <p role="status">{message}</p>}</article>
}
export default function ExplorationsPage() {
  const [store, setStore] = useState(readExplorations)
  function refresh() { setStore(readExplorations()) }
  useEffect(() => { window.addEventListener('cassini-explorations-change', refresh); window.addEventListener('storage', refresh); return () => { window.removeEventListener('cassini-explorations-change', refresh); window.removeEventListener('storage', refresh) } }, [])
  const drafts = Object.values(store.drafts).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return <div className="explorations-page">
    <PageMeta title="My Explorations" description="Continue your saved Cassini observations in this browser." path="/explorations" />
    <p className="eyebrow">Your research notebook</p><h1>My Explorations</h1>
    <p>Drafts and saved explorations stay in this browser. Export notes from a view to keep a portable copy.</p>
    {store.error && <p role="alert">{store.error}</p>}
    {!store.records.length && !drafts.length && <div className="saved-empty"><h2>Keep a question worth returning to.</h2><p>Open an observation, note what you notice, and save a view to revisit.</p><Link className="button button-primary" to="/data?guide=1">Start with an example observation</Link></div>}
    {drafts.length > 0 && <section className="notebook-drafts" aria-labelledby="drafts-title"><h2 id="drafts-title">Continue your latest draft</h2>
      {drafts.map((record, index) => <article className={`saved-draft ${index === 0 ? 'latest-draft' : ''}`} key={record.draftId || record.datasetId}><div><h3>{record.title}</h3><ViewSummary record={record} />{index === 0 && record.notes && <p className="saved-note-preview">{record.notes.slice(0, 240)}{record.notes.length > 240 ? '…' : ''}</p>}</div><Link className={index === 0 ? 'button button-primary' : undefined} to={explorationHref(record)}>Resume draft{index === 0 ? '' : ' →'}</Link></article>)}
    </section>}
    {store.records.length > 0 && <section aria-labelledby="saved-title"><h2 id="saved-title">Saved explorations</h2>{store.records.map((record) => <SavedItem key={record.id} record={record} onChange={refresh} />)}</section>}
    <p><Link to="/data">Open the full data workbench →</Link></p>
  </div>
}
