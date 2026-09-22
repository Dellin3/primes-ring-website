const defaultMessage =
  'Verified project artifacts will be added here after the manuscript, code, and generated outputs are finalized.'

export default function EmptyEvidenceState({ message = defaultMessage }) {
  return (
    <div className="evidence-empty" role="note">
      <span className="evidence-empty-mark" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
