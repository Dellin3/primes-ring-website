function readableKey(key) {
  return key
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function readableValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function ProvenanceNode({ node, index }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <li style={{ '--node-depth': index }}>
      <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary aria-expanded={expanded}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{node.label}</strong>
        </summary>
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
  )
}

export default function ProvenanceCorridor({ metadata, catalogVerification }) {
  const nodes = [...metadata.provenance_chain]
  if (catalogVerification) {
    nodes.push({
      id: 'catalog_integrity_verification',
      label: 'Catalog Integrity Verification',
      details: {
        integrity_status: catalogVerification.validation_status,
        deterministic_record_comparisons:
          catalogVerification.deterministic_record_comparisons,
        chunk_hashes_verified: catalogVerification.chunk_hashes_verified,
        exact_chunk_count: catalogVerification.chunk_count,
      },
    })
  }
  return (
    <section className="provenance-corridor" aria-labelledby="provenance-chain-title">
      <header>
        <p className="eyebrow">Traceable source chain</p>
        <h2 id="provenance-chain-title">Provenance</h2>
      </header>
      <ol>
        {nodes.map((node, index) => (
          <ProvenanceNode key={node.id} node={node} index={index} />
        ))}
      </ol>
    </section>
  )
}
import { useState } from 'react'
