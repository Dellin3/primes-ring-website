import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { explorationHref, readExplorations } from '../../lib/explorations.js'

export default function ContinueExploration() {
  const [saved, setSaved] = useState(readExplorations)
  useEffect(() => {
    const refresh = () => setSaved(readExplorations())
    window.addEventListener('storage', refresh)
    window.addEventListener('cassini-explorations-change', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('cassini-explorations-change', refresh)
    }
  }, [])
  const latest = [...saved.records, ...Object.values(saved.drafts)]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
  if (!latest) return null
  const updated = new Date(latest.updatedAt)
  const savedKind = latest.id ? 'Exploration' : 'Draft'
  return (
    <aside className="continue-exploration" aria-label="Continue your exploration">
      <Link className="text-link" to={explorationHref(latest)}>Continue your exploration →</Link>
      <p className="continue-title">{latest.title || latest.observationName}</p>
      <p className="continue-range">{latest.observationName} · {latest.range.map((value) => value.toLocaleString('en-US', { maximumFractionDigits: 3 })).join('–')} km</p>
      <small>{saved.error ? 'Kept in this session; browser save unavailable' : `${savedKind} saved in this browser`} · <time dateTime={latest.updatedAt} title={updated.toLocaleString()}>{updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {updated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</time></small>
    </aside>
  )
}
