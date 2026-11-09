// One label vocabulary for what a figure or number is, used across the site.
const labels = {
  observation: 'Cassini observation',
  derived: 'Derived on this site',
  synthetic: 'Synthetic teaching model',
  illustration: 'Illustration',
}

export default function EvidenceTag({ kind, children }) {
  return <span className={`evidence-tag is-${kind}`}>{children ?? labels[kind]}</span>
}
