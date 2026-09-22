import { datasetProvenance, formatRadialRange } from '../../content/datasets.js'

export default function DatasetOverview({ dataset, rows, columns }) {
  const metadata = [
    ['Event / revolution', dataset.revolution],
    ['Band', dataset.band],
    ['Source product identifier', dataset.productId],
    ['Registered product', dataset.product],
    ['Radial range', formatRadialRange(dataset.radialRange)],
    ['Rows in local subset', rows.length ? String(rows.length) : 'Loading…'],
    ['Source status', 'Documented as derived from public PDS products; conversion manifest pending'],
  ]

  return (
    <section id="overview" className="dataset-section" aria-labelledby="dataset-overview-title">
      <header className="subsection-heading">
        <p>Overview</p>
        <h2 id="dataset-overview-title">Dataset record</h2>
      </header>
      <dl className="dataset-metadata">
        {metadata.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="column-record">
        <h3>Available columns</h3>
        <p>{columns.length ? columns.join(', ') : 'Column names load with the local CSV subset.'}</p>
      </div>
      <p className="provenance-note">{datasetProvenance.statement}</p>
    </section>
  )
}
