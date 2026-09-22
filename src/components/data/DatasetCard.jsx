import { Link } from 'react-router-dom'
import { formatRadialRange } from '../../content/datasets.js'
import DatasetProfilePreview from './DatasetProfilePreview.jsx'

export default function DatasetCard({ dataset }) {
  return (
    <article className="dataset-card">
      <header>
        <div>
          <p className="metadata-label">Observation subset</p>
          <h2>{dataset.event}</h2>
        </div>
        <span>{dataset.band}</span>
      </header>
      <DatasetProfilePreview dataset={dataset} compact showCaption={false} />
      <p className="dataset-range">Radial range: {formatRadialRange(dataset.radialRange)}</p>
      <Link className="text-link" to={`/data/${dataset.slug}`}>
        View Dataset →
      </Link>
    </article>
  )
}
