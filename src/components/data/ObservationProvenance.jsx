function readableKey(key) {
  return key
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function readableValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export default function ObservationProvenance({ metadata }) {
  return (
    <section className="observation-provenance" aria-labelledby="provenance-chain-title">
      <header>
        <p className="eyebrow">Traceable source chain</p>
        <h2 id="provenance-chain-title">Provenance</h2>
      </header>
      <ol>
        {metadata.provenance_chain.map((node) => (
          <li key={node.id}>
            <details>
              <summary>{node.label}</summary>
              <dl>
                {Object.entries(node.details).map(([key, value]) => (
                  <div key={key}>
                    <dt>{readableKey(key)}</dt>
                    <dd>{readableValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </li>
        ))}
      </ol>
    </section>
  )
}
