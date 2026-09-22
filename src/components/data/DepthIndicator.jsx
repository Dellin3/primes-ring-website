const STAGES = [
  { id: 'observation', label: 'Observation' },
  { id: 'window', label: 'Radial window' },
  { id: 'exact', label: 'Exact sample' },
  { id: 'derived', label: 'Derived product' },
]

export default function DepthIndicator({ activeStage = 'observation' }) {
  return (
    <nav
      className="depth-indicator"
      aria-label="Scientific data depth"
    >
      <ol>
        {STAGES.map((stage, index) => (
          <li
            key={stage.id}
            className={stage.id === activeStage ? 'is-active' : undefined}
            aria-current={stage.id === activeStage ? 'step' : undefined}
          >
            {index > 0 && <span className="depth-indicator-separator" aria-hidden="true">→</span>}
            <span>{stage.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
